---
title: gitee 仓库创建及上传文件
author: Mr.xu
date: 2025-11-06 21:00:13
tags:
---

**首先由个gitee的账号**
**git 全局设置**
```
git config --global user.name"名字"
git config --global user.email "邮箱"
```

**创建git仓库**
```
mkdir qingfeng
cd qingfeng
git init
touch README.md
git add README.md
git commit -m "first commit"
git remote add origin https://gitee.com/xbd666/qingfeng.git
git push -u origin "master"
```
# 备注：也可以在搜索栏那里直接拉取，就不需要终端命令设置了

**已有仓库的**
```
cd existing_git_repo
git remote add origin https://gitee.com/xbd666/qingfeng.git
git push -u origin "master"
```

**拉取**
```
git pull origin master
```
**上传到仓库**
```
git add .
```
**备注描述**
```
git commit -m '描述信息'
```
**上传**
```
git push orign master
```
```
令牌：30acd398455f085b72e9d05343177631

bash <(curl -sSL https://gitee.com/xbd666/qingfeng/raw/master/system_tool.sh)
```