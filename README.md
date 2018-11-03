<h1 align="center">
  yyb-dragon
</h1>

## Description

自动创建潜龙项目

## env

因使用 async/await，故 Node version > 7.6.0 (推荐使用 8.x 及以上版本)

## Usage

```
yyb-dragon
```

```
// dragon.config.js
module.exports = {
  name: 'project name', // 项目名称，须跟svn项目名一致
  alias: 'alias name', // 别名
  desc: 'description' // 描述
};
```

## Options

### headless

默认是无头模式，若想开启

```
yyb-dragon -h false
```

### path

```
yyb-dragon -p webgit
```
