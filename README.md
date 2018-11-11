<h1 align="center">
  dragon-cli
</h1>

## Description

自动创建潜龙项目，**个人项目，仅供参考**

## env

因使用 async/await，故 Node version > 7.6.0 (推荐使用 8.x 及以上版本)

## Usage

```bash
dragon
```

```
// dragon.config.js
module.exports = {
  name: 'project name', // 项目名称
  alias: 'alias name', // 别名
  desc: 'description' // 描述
};
```

## Options

### headless

默认是无头模式，若想开启

```
dragon -h false
```

### path

```
dragon -p git
```
