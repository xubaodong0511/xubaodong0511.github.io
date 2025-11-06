---
title: Nginx 配置健康检查模块实验
author: Mr.xu
date: 2025-11-06 21:11:29
tags:
---

# nginx配置健康检查模块

```basic
1.nginx自带的针对后端节点健康检查的功能比较简单，通过默认自带的ngx_http_proxy_module 模块和ngx_http_upstream_module模块中的参数来完成，当后端节点出现故障时，自动切换到健康节点来提供访问。但是nginx不能事先知道后端节点状态是否健康，后端即使有不健康节点，负载均衡器依然会先把请求转发给该不健康节点，然后再转发给别的节点，这样就会浪费一次转发，而且自带模块无法做到预警。所以我们可以使用第三方模块 nginx_upstream_check_module模块

2.nginx_upstream_check_module模块由淘宝团队开发 淘宝自己的 tengine 上是自带了该模块的。我们使用原生Nginx，采用添加模块的方式
```

# 健康检查模块最高支持1.22及以下的nginx版本

获取nginx_upstream_check_module模块，从github上面获取

# 下载模块

```shell
wget https://github.com/yaoweibin/nginx_upstream_check_module/archive/refs/heads/master.zip
```

# 下载解压软件包及解压

```shell
yum install -y unzip

unzip -d /usr/local/ master.zip		//解压要指定目录
```

# 进入nginx的解压目录中

```shell
cd /usr/local/nginx-1.22.1/
```

# 下载指定路径安装软件

```shell
yum install -y patch	//patch可以指定安装路径
```

# 打补丁

```shell
# -p0，是“当前路径” -p1，是“上一级路径”
patch -p1 < ../nginx_upstream_check_module-master/check_1.20.1+.patch
```

编译下载安装

```shell
./configure --prefix=/usr/local/nginx --group=nginx --user=nginx --sbin-path=/usr/local/nginx/sbin/nginx --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --http-client-body-temp-path=/tmp/nginx/client_body --http-proxy-temp-path=/tmp/nginx/proxy --http-fastcgi-temp-path=/tmp/nginx/fastcgi --pid-path=/var/run/nginx.pid --lock-path=/var/lock/nginx --with-http_stub_status_module --with-http_ssl_module --with-http_gzip_static_module --with-pcre --with-http_realip_module --with-stream --add-module=../nginx_upstream_check_module-master/

# --add-module=../nginx_upstream_check_module-master/	//这个是添加的nginx_upstream_check_module模块
```

# 编译

```shell
make 	//如果是添加模块只需要make 第一次安装需要make install	
```

# 将原来的nginx二进制命令备份

```shell
mv /usr/local/nginx/sbin/nginx /usr/local/nginx/sbin/nginx.bak
```

# 将新生成的命令cp到nginx的命令目录中

```shell
cp objs/nginx /usr/local/nginx/sbin/
```

# 示例

```shell
http {
upstream app {
        server 192.168.209.128 weight=1;
        server 192.168.209.130 weight=1;
        check interval=5000 rise=2 fall=3 timeout=4000 type=http port=80;
        check_http_send "HEAD / HTTP/1.0\r\n\r\n";
        check_http_expect_alive http_2xx http_3xx;
        }
        
server {
        listen       80;
        server_name  localhost;

        location / {
                proxy_pass http://app;
                proxy_redirect default;
                proxy_set_header Host $http_host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                }
        location /status {   #开启监控状态页面
                check_status;
                access_log   off;
           }
        }
}

参数解释：
interval:表示每隔多少毫秒向后端发送健康检查包；
rise:表示如果连续成功次数达到2 服务器就被认为是up；
fail:表示如果连续失败次数达到3 服务器就被认为是down；
timeout:表示后端健康请求的超时时间是多少毫秒；
type:表示发送的健康检查包是什么类型的请求；
port: 表示发送检查到后端的服务的端口;
check_http_send:表示http健康检查包发送的请求内容。为了减少传输数据量，推荐采用“head”方法；
check_http_expect_alive:指定HTTP回复的成功状态，默认认为2XX和3XX的状态是健康的；
```

# 查看访问状态

```shell
192.168.116.111/status		//查看状态，需要在IP地址后面加上status
```

