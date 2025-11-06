---
title: 自定义下载--php版本
author: Mr.xu
date: 2025-11-06 20:49:32
tags:
---

# 下载官网php
```
# wget http://rpms.remirepo.net/enterprise/remi-release-7.9.rpm
# -Uvh带有下载更新的作用,会有多个版本
rpm -Uvh http://rpms.remirepo.net/enterprise/remi-release-7.rpm
```
# 会在/etc/yum.repos.d目录生成许多remi的仓库，其中包含不同版本的php仓库
```
[root@server ~]# cd /etc/yum.repos.d/
[root@server yum.repos.d]# ls
CentOS-Base.repo   remi-modular.repo  remi-php72.repo  remi-php81.repo  remi-safe.repo
epel.repo          remi-php54.repo    remi-php73.repo  remi-php82.repo
epel.repo.rpmnew   remi-php70.repo    remi-php74.repo  remi-php83.repo
epel-testing.repo  remi-php71.repo    remi-php80.repo  remi.repo
```
# 安装yum-config-manager仓库管理工具并安装指定版本的php
```
yum -y install yum-utils
yum-config-manager --enable remi-php72

#如果想选择其它版本的话，把remi-php72改为remi-php71、remi-php70等，要看/etc/yum.repos.d/里的remi仓库，一一对应上
```
# 安装php及对应的模块
```
安装php
]# yum -y install php 
#因为直接用yum-config-manager --enable 指定了php7.2版本了，这里安装的php为7.2版本的
 
#安装常用的php模块
]# yum -y install php php72-php-opcache  php72-php-ldap php72-php-odbc php72-php-pear php72-php-xml php72-php-xmlrpc php72-php-soap curl curl-devel  php72-php-mbstring php72-php-mysqlnd  php72-php-fpm  php72-php-gd
 
#安装php-fpm
]# yum -y install php72-php-fpm.x86_64
]# systemctl restart php72-php-fpm       #启动php-fpm服务
]#netstat -tunlp|grep 9000               #查看9000端口是否正常启动了
```