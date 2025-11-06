---
title: Nginx 会话保持实验
author: Mr.xu
date: 2025-11-06 21:11:03
tags:
---

# nginx 会话保持

nginx会话保持主要有以下几种实现方式：

1、ip_hash

```shell
ip_hash使用源地址哈希算法，将同一客户端的请求总是发往同一个后端服务器，除非该服务器不可用。

ip_hash简单易用，但有如下问题：
当后端服务器宕机后，session会丢失；
来自同一局域网的客户端会被转发到同一个后端服务器，可能导致负载失衡；
```

示例

```shell
upstream backend {
    ip_hash;
    server backend1.example.com;
    server backend2.example.com;
    server backend3.example.com down;
}
```

2、sticky_cookie_insert---而是基于cookie实现

使用sticky_cookie_insert，这会让来自同一客户端的请求被传递到一组服务器的同一台服务器。与ip_hash不同之处在于，它不是基于IP来判断客户端的，而是基于cookie来判断。(需要引入第三方模块才能实现)---sticky模块。因此可以避免上述ip_hash中来自同一局域网的客户端和前段代理导致负载失衡的情况。

在yum安装的nginx的环境下，编译安装sticky添加模块

查看yum安装nginx路径，后面编译安装需要用

```shell
nginx -V		//减大V，查看安装路径
```

删除原有nginx文件

```shell
rm -rf /etc/share/nginx/*	//删除配置文件
rm -rf /var/log/nginx/*		//删除日志文件
```

安装编译环境

```shell
yum install -y pcre* openssl* gcc gcc-c++ make
```

下载sticky模块

```shell
wget  https://bitbucket.org/nginx-goodies/nginx-sticky-module-ng/get/08a395c66e42.zip
```

查看nginx版本

```shell
nginx -v	//减小v，查看版本
```

下载yum安装nginx对应版本的源码包

```shell
wget  http://nginx.org/download/nginx-1.18.0.tar.gz
```

下载解压工具及解压

```
yum install -y unzip	//下载解压工具

unzip 08a395c66e42.zip		//解压
```

更改软件名字

```shell
mv nginx-goodies-nginx-sticky-module-ng-08a395c66e42/ nginx-sticky-module-ng/
```

解压nginx的源码包

```shell
tar xzvf nginx-1.18.0.tar.gz -C /usr/local/		//指定路径，解压nginx
```

进入nginx目录里

```shell
 cd /usr/local/nginx-1.18.0/
```

查看yum安装nginx所有模块

```shell
nginx -V
```

下载

```shell
./configure --prefix=/etc/nginx --sbin-path=/usr/sbin/nginx --modules-path=/usr/lib64/nginx/modules --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --pid-path=/var/run/nginx.pid --lock-path=/var/run/nginx.lock --http-client-body-temp-path=/var/cache/nginx/client_temp --http-proxy-temp-path=/var/cache/nginx/proxy_temp --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp --http-scgi-temp-path=/var/cache/nginx/scgi_temp --user=nginx --group=nginx --with-compat --with-file-aio --with-threads --with-http_addition_module --with-http_auth_request_module --with-http_dav_module --with-http_flv_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_mp4_module --with-http_random_index_module --with-http_realip_module --with-http_secure_link_module --with-http_slice_module --with-http_ssl_module --with-http_stub_status_module --with-http_sub_module --with-http_v2_module --with-mail --with-mail_ssl_module --with-stream --with-stream_realip_module --with-stream_ssl_module --with-stream_ssl_preread_module --with-cc-opt='-O2 -g -pipe -Wall -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector-strong --param=ssp-buffer-size=4 -grecord-gcc-switches -m64 -mtune=generic -fPIC' --with-ld-opt='-Wl,-z,relro -Wl,-z,now -pie' --add-module=/root/nginx-sticky-module-ng

# --add-module=/root/nginx-sticky-module-ng是添加的cookie模块
```

配置基于cookie会话保持

```shell
# 在代理上写入
upstream qfedu {
        server 192.168.198.143;
        server 192.168.198.145;
        sticky;
}

# 在宿柱机上写入
server {
    listen       80;
    server_name  localhost;

    #charset koi8-r;
    #access_log  /var/log/nginx/host.access.log  main;

    location / {
        proxy_pass http://qfedu;
    }

}

说明：
expires：设置浏览器中保持cookie的时间 
domain：定义cookie的域 
path：为cookie定义路径
```

查看nginx配置是不是正常，及启动

```shell
nginx -t	//查看配置是不是正常 

nginx -s reload		//重启nginx
```

