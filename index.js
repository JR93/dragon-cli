const cosmiconfig = require('cosmiconfig');
const logger = require('simple-logger-util');
const input = require('./src/input');

const explorer = cosmiconfig('dragon');

explorer.search()
  .then(result => {
    if (result) {
      console.log();
      logger.success('找到配置文件，将检查是否满足配置~');
      input(result.config);
    } else {
      console.log();
      logger.warn('在该项目下没有找到配置文件~');
      input(null);
    }
  })
  .catch(err => {
    console.log();
    logger.error('读取配置文件出现异常，将退出服务~');
    process.exit(1);
  });
