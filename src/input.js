const inquirer = require('inquirer');
const logger = require('simple-logger-util');
const chalkPipe = require('chalk-pipe');
const chalk = require('chalk');
const yargs = require('yargs');
const Create = require('./create');

const argv = yargs
  .usage('dragon [options]')
  .option('h', {
    alias: 'headless',
    describe: '无头模式',
    default: true
  })
  .option('p', {
    alias: 'path',
    describe: '相对的路径',
    default: ''
  })
  .help()
  .version()
  .alias('v', 'version')
  .argv;

const questions = [
  {
    type: 'input',
    name: 'name',
    message: "你的潜龙项目名称是(3-16位,字母开头,由小写英文,数字,下划线组成)：",
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
  },
  {
    type: 'input',
    name: 'alias',
    message: "你的项目别名是：",
    transformer: function (val) {
      const text = chalkPipe('blue.bold')(val);
      return text;
    }
  },
  {
    type: 'input',
    name: 'desc',
    message: "你的项目描述是：",
    transformer: function (val) {
      const text = chalkPipe('blue.bold')(val);
      return text;
    }
  },
  {
    type: 'confirm',
    name: 'create',
    message: '确定要现在创建新的潜龙项目么？'
  }
];

const createQuestions = (config) => {
  if (!config) {
    return questions;
  }
  const customQuestions = [];
  if (!config.name || !config.name.match(/^[a-z][a-z_0-9]{2,15}$/)) {
    customQuestions.push(questions[0]);
  }
  if (!config.alias) {
    customQuestions.push(questions[1]);
  }
  if (!config.desc) {
    customQuestions.push(questions[2]);
  }
  customQuestions.push(questions[3]);
  return customQuestions;
}


module.exports = (config) => {
  inquirer.prompt(createQuestions(config))
    .then(answers => {
      if (answers.create) {
        const conf = Object.assign({}, config, answers, {argv});
        console.log();
        logger.success(`您的潜龙项目名称是：${chalk.blue(conf.name)}`);
        logger.success(`您的项目别名是：${chalk.blue(conf.alias)}`);
        logger.success(`您的项目描述是：${chalk.blue(conf.desc)}`);
        logger.success('准备为你创建潜龙项目~');

        const dragon = new Create(conf);
        dragon.start().catch(err => {
          logger.error(`出现点问题：${err}`);
          process.exit(1);
        });
      } else {
        console.log();
        logger.info('你选择不创建潜龙项目，将退出服务~');
        process.exit(1);
      }
    });
};
