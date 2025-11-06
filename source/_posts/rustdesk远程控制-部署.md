---
title: rustdesk远程控制 部署
author: Mr.xu
date: 2025-11-06 20:48:25
tags:
---

[rustdesk官网](https://rustdesk.com/)
# 配置rustdesk配置yaml文件
```
mkdir rustdesk && cd rustdesk
```
```
vim docker-compose.yaml
```
```
version: '3'

services:
  hbbs:
    container_name: hbbs
    image: rustdesk/rustdesk-server:1.0
    command: hbbs
    volumes:
      - ./data:/root
    network_mode: "host"

    depends_on:
      - hbbr
    restart: unless-stopped


  hbbr:
    container_name: hbbr
    image: rustdesk/rustdesk-server:1.0
    command: hbbr
    volumes:
      - ./data:/root
    network_mode: "host"
    restart: unless-stopped
```
# 启动
```
docker-compose up -d
```
# 查看容器有没有起来
```
docker ps
```
# 在官网下载客户端
[rustdesk官网](https://rustdesk.com/)

# app设置
```
点击左侧3个点---> 点击网络---> 配置ID服务器---> 配置中继服务器

# 注：ID服务器/中继服务器是你 服务器的IP
```
# 连接
`用另一台手机/电脑，就可以连接了`