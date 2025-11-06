---
title: syncTV远程共享视频网站部署
author: Mr.xu
date: 2025-11-06 20:48:59
tags:
---

# syncTV远程同步观看web部署
[官网地址点这里](https://synctv.wiki/#/quickstart?id=docker)


# 一、docker安装

[docker官网点这里](https://docs.docker.com/engine/install/centos/https://docs.docker.com/engine/install/centos/)

# docker一键脚本安装
```
bash <(curl -sSL https://gitee.com/xbd666/qingfeng/raw/master/toolbox.sh)
```
# 二、可以直接用命令运行synctv，但是建议用下面yaml文件方式运行synctv
```
docker run --name synctv -d -p 8080:8080 synctvorg/synctv:latest
```

# 三、创建docker-compose.yaml文件
```
mkdir synctv && cd synctv      #创建一个目录，并进入此目录
```
```
vim docker-compose.yaml
```
```
version: "3.3"    #这是docker-compose文件版本的声明
services:
 synctv:       #服务的别名，可以自定义
  container_name: synctv     #容器名，可以自定义
  ports:
  - '8080:8080'   #端口，左侧的8080可以自定义，映射到容器内部，右侧是容器内部端口
  environment:
  - PUID=0    # 用户ID，在终端输入id可以查看到当前用户的id
  - PGID=0    # 组ID同上
  - TZ=Asia/Shanghai   # 时区，可以自定义
  restart: always      # 开启自启动其他选项看以下备注
  volumes:
  - './data:/root/.synctv'   # 数据持久目录映射
  image: synctvorg/synctv    # 镜像名，一般都是使用的哪个镜像就写哪个镜像
  ```
  
# 查看容器有没有起来
```
docker ps
或
docker-compose ps
```
# 默认账户密码
`账户：root 密码：root`
# 四、网站更新
```
cd synctv    # 进入目录
docker-compose down     # 停止容器
docker-compose pull     # 拉取最新镜像
docekr-compose up -d    # 重新启动容器
```