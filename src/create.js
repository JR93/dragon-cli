const puppeteer = require('puppeteer');
const inquirer = require('inquirer');
const logger = require('simple-logger-util');
const chalkPipe = require('chalk-pipe');
const waitOpt = require('./config/waitOpt');

class Create {
  constructor(config) {
    this.config = config;
  }

  async rewriteProName() {
    logger.info('项目名已经存在，请重新填写你的潜龙项目名称：');
    return new Promise((resolve, reject) => {
      const questions = [
        {
          type: 'input',
          name: 'name',
          message: "你的潜龙项目名称是：",
          transformer: function (val) {
            const text = chalkPipe('blue.bold')(val);
            return text;
          },
          validate: function(value) {
            const pass = value.match(/^[a-z][a-z_0-9]{2,15}$/);
            if (pass) {
              return true;
            }
            return '潜龙项目名称由3-16位,字母开头,由小写英文,数字,下划线组成';
          }
        }
      ];
      inquirer.prompt(questions)
        .then(result => {
          resolve(result.name);
        });
    });
  }

  async toLogin() {
    logger.info('请准确填写你的账号密码！');
    return new Promise((resolve, reject) => {
      const questions = [
        {
          type: 'input',
          name: 'account',
          message: "你的账号是：",
          transformer: function (val) {
            const text = chalkPipe('blue.bold')(val);
            return text;
          }
        },
        {
          type: 'password',
          name: 'password',
          mask: '*',
          message: "你的密码是：",
          transformer: function (val) {
            const text = chalkPipe('blue.bold')(val);
            return text;
          }
        }
      ];
      inquirer.prompt(questions)
        .then(result => {
          resolve(result);
        });
    });
  }

  async handleLogin(iframe, userInfo) {
    return new Promise(async (resolve, reject) => {
      logger.success('准备为你登录潜龙');
      const isQuickMode = await iframe.evaluate(() => {
        return document.querySelector('#m_quickLogin').style.display !== 'none';
      });
      if (isQuickMode) {
        const loginUserList = await iframe.$('#m_quickLogin .userList');
        const dwUserIndex = await iframe.evaluate(e => {
          const list = Array.from(e.children);
          const idx = list.findIndex(v => /\(9090/.test(v.innerText))
          return idx;
        }, loginUserList);
        if (dwUserIndex >= 0) {
          logger.success('为你使用快捷登录方式');
          const dwUserItem = await loginUserList.$$('.radio_user');
          await dwUserItem[dwUserIndex].click();
          await loginUserList.dispose();
          await iframe.click('#m_quickLogin .E_login');
          resolve();
          return;
        } else {
          await iframe.click('#m_quickLogin .E_change');
        }
      }
      logger.success('为你使用账号密码登录方式');
      if (userInfo.account && userInfo.password) {
        userInfo.account = `dw_${userInfo.account}`;
      } else {
        userInfo = await this.toLogin();
      }
      await iframe.waitFor(1000);
      await iframe.type('.E_acct', userInfo.account);
      await iframe.type('.E_passwd', userInfo.password);
      await iframe.click('#m_commonLogin .E_login');
      resolve();
    });
  }

  async start({
    userInfo = {},
    projectName = '',
    callback = () => {}
  } = {}) {

      const width = 1920;
      const height = 1080;

      const browser = await puppeteer.launch({
        headless: this.config.argv.headless !== 'false',
        args: [
          `--window-size=${ width },${ height }`
        ],
      });
      logger.success('启动浏览器');

      const page = await browser.newPage();
      logger.success('打开新页面');

      await page.setViewport({
        width,
        height
      });
      logger.success(`设置浏览器宽高: ${width}*${height}`);
      // 敏感信息隐藏
      await page.goto('http://xxx.xx.com/');
      logger.success('打开 潜龙首页');

      await page.waitFor(3000);
      await page.reload();
      await page.waitFor(3000);

      const navigationPromise = page.waitForNavigation({
        timeout: 0,
        waitUntil: 'load'
      });

      const iframe = await page.frames().find(f => f.name() === 'udbsdk_frm_normal');
      await this.handleLogin(iframe, userInfo);
      await navigationPromise;

      logger.success('进入潜龙首页');
      logger.success('打开 web静态资源');
      // 敏感信息隐藏
      await page.goto('http://xxx.xx.com/');
      await navigationPromise;

      logger.success('进入 web静态资源');
      logger.success('打开 新建项目');
      await page.waitForSelector('#add', waitOpt);
      await page.click('#add');
      await navigationPromise;

      logger.success('进入 新建项目，准备填写配置');
      await page.waitFor(1000);

      let checkNameState = false;
      while(!checkNameState) {
        checkNameState = await page.evaluate((name) => {
          return new Promise((resolve, reject) => {
            // 敏感信息隐藏
            $.post('http://xxx.xx.com/', {
              bizId: 0,
              nameEn: name
            }).done(json => {
              const res = JSON.parse(json);
              console.log('项目名是否可用', res);
              resolve(res.code === 0);
            }).fail(err => {
              reject(false);
            });
          });
        }, this.config.name);
        if (!checkNameState) {
          const pName = await this.rewriteProName();
          this.config.name = pName;
        }
      }
      logger.success('潜龙项目名称合法并且可以使用');
      global.DRAGON_NAME = this.config.name;

      await page.focus('#nameEn');
      await page.type('input#nameEn', this.config.name);
      await page.type('input#nameChsAlias', this.config.alias);
      await page.select('select#language', '2048');
      await page.select('select#container', '2177');
      if (this.config.argv.path !== '') {
        await page.type('input#svn', `https://xxx.xx.com/xxx/static/project/${this.config.argv.path}/${projectName || this.config.name}/trunk`);
      } else {
        await page.type('input#svn', `https://xxx.xx.com/xxx/static/project/${this.config.name}/trunk`);
      }
      await page.type('textarea#description', this.config.desc);
      await page.click('#s2id_domain');
      await page.type('input#s2id_autogen2_search', 'web.yystatic.com');
      await page.waitFor(500);
      await page.keyboard.press('Enter');
      await page.click('input#businessDomain + a.btn');
      await page.waitFor(500);
      await page.evaluate(() => {
        document.querySelector('input#businessDomain').value = '';
      });
      await page.type('input#businessDomain', `${this.config.name}.yystatic.com`);
      await page.click('.form-actions input[type=button]');
      logger.success('保存配置');

      await page.waitFor(3000);
      await page.waitForSelector('.d-state-visible .d-footer .d-state-highlight', waitOpt);
      await page.click('.d-state-visible .d-footer .d-state-highlight');
      await navigationPromise;

      logger.success('添加环境配置');
      await page.waitFor(3000);
      await page.waitForSelector('#paramConfig .portlet', waitOpt);
      await page.waitFor(1000);
      await page.waitForSelector('#env_tree_1_span', waitOpt);
      await page.click('#env_tree_1_span');
      await page.waitFor(3000);
      await page.waitForSelector('#paramConfig .portlet', waitOpt);
      await page.waitFor(1000);
      await page.type(
        'textarea[title=after_shell]',
        `xxx`);
      await page.click('button.save-proj-var');
      logger.success('添加后置脚本完成');

      await page.waitFor(3000);
      await page.waitForSelector('.d-state-visible .d-header .d-close', waitOpt);
      await page.click('.d-state-visible .d-header .d-close');
      await page.evaluate(() => {
        $('.d-state-visible .d-header .d-close').click();
      });
      await page.waitFor(2000);
      logger.success('添加测试环境机器');
      await page.click('#modifyMachineBtn_env_tree_3');
      await page.waitForSelector('#xubox_layer1 button.addMachine', waitOpt);
      await page.click('#xubox_layer1 button.addMachine');
      await page.type('#xubox_layer1 input.machine-ip', 'xxx.xxx.xxx.xxx');
      await page.click('#xubox_layer1 button.submitMachine');
      await navigationPromise;
      logger.success('添加测试环境机器完成');

      await page.waitFor(3000);
      await page.waitForSelector('#paramConfig .portlet', waitOpt);
      await page.waitFor(1000);
      logger.success('添加生产环境机器');
      await page.evaluate(() => {
        $('#modifyMachineBtn_env_tree_8').click();
      });
      await page.waitForSelector('#xubox_layer1 button.addMachine', waitOpt);
      for (let i = 0; i < 8; i += 1) {
        await page.click('#xubox_layer1 button.addMachine');
      }
      await page.evaluate(() => {
        const IPS = [
          'xxx.xxx.xxx.xxx', 'xxx.xxx.xxx.xxx'
        ];
        const machineList = Array.from(document.querySelectorAll('#xubox_layer1 input.machine-ip'));
        return new Promise((resolve, reject) => {
          machineList.forEach((machine, index) => {
            machine.value = IPS[index];
          });
          resolve();
        });
      });
      await page.click('#xubox_layer1 button.submitMachine');
      await navigationPromise;
      await page.waitForSelector('#paramConfig .portlet', waitOpt);
      logger.success('添加生产环境机器完成');
      logger.success('完成配置');
      logger.success('已创建完潜龙项目~');
      await browser.close();

      callback && callback();
  }
}

module.exports = Create;


