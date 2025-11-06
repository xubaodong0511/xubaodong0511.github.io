---
title: Nginx优势及安装实验
author: Mr.xu
date: 2025-11-06 21:11:56
tags:
---

#  Nginx优势及安装

# 为什么选择 nginx
```shell
1.高并发，高性能
2.高可靠--7*24小时不间断运行
3.可扩展性强--模块化设计，使得添加模块非常的平稳
4.热部署--可以在不停止服务器的情况下升级nginx
5.BSD许可证--nginx不止开源免费的我们还可以更具实际需求进行定制修改源代码

# 它是IO多路复用，通过记录跟踪每个I/O流的状态，来同时管理多个I/O流，另外通过epoll来监控处理有数据的代码
# 外加它是异步非阻塞
```
## yum安装
# 1.配置yum源安装nginx
```shell
清理原有数据
yum -y install yum-utils
```

# 配置源码文件

```shell
/etc/yum.repo.d/nginx.repo << EOF
[nginx-stable]
name=nginx stable repo
baseurl=http://nginx.org/packages/centos/$releasever/$basearch/
gpgcheck=0
enabled=1
EOF
```

# 下载及启动服务

```shell
yum -y install nginx
systemctl start nginx
```

# 2.yum源选择版本安装

```shell
配置Yum源的官网：http://nginx.org/en/linux_packages.html

配置Yum源1.22版本：https://nginx.org/download/nginx-1.22.1.tar.gz
```

# 3.编译安装

# 关闭防火墙

```shell
systemctl stop firewalld
setenforce 0
```

# 下载wget

```shell
yum -y install wget
```

# 安装编译环境

```shell
yum -y install gcc gcc-c++
```

# 安装依赖pcre软件包（使nginx支持http rewrite模块）
```shell
yum install -y pcre pcre-devel gd-devel
```
# 安装依赖openssl-devel（使nginx支持ssl）
```shell
yum install -y openssl openssl-devel
```
# 安装依赖zlib
```shell
yum install -y zlib zlib-devel
```
# 创建nginx用户，不允许登录
```shell
useradd nginx -s /sbin/nologin
```
# 下载官方nginx
```shell
wget https://nginx.org/download/nginx-1.24.0.tar.gz		//下载1.24版本
wget https://nginx.org/download/nginx-1.22.1.tar.gz		//下载 1.22版本
```
# 解压nginx包
```shell
tar zxvf nginx-1.24.0.tar.gz -C /usr/local/
```
# 切换目录
```shell
cd /usr/local/nginx-1.24.0/
```
# 配置安装参数
```shell
./configure --prefix=/usr/local/nginx --group=nginx --user=nginx --sbin-path=/usr/local/nginx/sbin/nginx --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --http-client-body-temp-path=/tmp/nginx/client_body --http-proxy-temp-path=/tmp/nginx/proxy --http-fastcgi-temp-path=/tmp/nginx/fastcgi --pid-path=/var/run/nginx.pid --lock-path=/var/lock/nginx --with-http_stub_status_module --with-http_ssl_module --with-http_gzip_static_module --with-pcre --with-http_realip_module --with-stream
```
# 过程当中如果出错，删除Makefile文件后重新配置

# 编译以及编译安装
```shell
make && make install
#检测nginx配置文件是否正确
/usr/local/nginx/sbin/nginx -t
mkdir -p /tmp/nginx/client_body
```
# 启动nginx服务
```shell
/usr/local/nginx/sbin/nginx
```
# 创建连接文件，可以直接用nginx命令
```shell
ln -s /usr/local/nginx/sbin/nginx /usr/bin/nginx
```
# 连接文件创建成功后，nginx常用命令
```shell
nginx -s reload			# 修改配置后重新加载生效
nginx -s stop			# 快速停止nginx
nginx -s quit			# 正常停止nginx
nginx -t				# 测试当前配置文件是否正确**
nginx					#正常启动
```

