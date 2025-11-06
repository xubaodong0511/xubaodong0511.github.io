---
title: Docker项目：搭建服务器监控面板
author: Mr.xu
date: 2025-11-06 20:54:50
tags:
---

**搭建一个专属自己的网站监控——Uptime Kuma**
**安装Docker**
`下载docker，docker官方网址docker.com`
**创建yml配置文件**
```ini
vim docker-compose.yml代码
version: '3.3'

services:
  uptime-kuma:
    image: louislam/uptime-kuma
    container_name: uptime-kuma
    volumes:
      - ./uptime-kuma:/app/data
    ports:
      - 3001:3001
```
**反向代理**
```ini
server  {
    listen 80;
    server_name    vps.7boe.top;
    location / {
        proxy_pass         http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
    }
}
```
**Docker安装推送镜像**
```ini
docker pull louislam/uptime-kuma
```
**将宿主机的目录挂载到容器内**
```ini
docker volume create uptime-kuma
```
**创建容器**
```ini
docker run -d --restart=always -p 3001:3001 -v uptime-kuma:/app/data --name uptime-kuma louislam/uptime-kuma:1
```
**测试**
`浏览器打开IP：3001`**会出来kuma的登入界面**
