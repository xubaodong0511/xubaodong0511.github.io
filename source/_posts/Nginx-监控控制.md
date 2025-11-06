---
title: Nginx 监控控制实验
author: Mr.xu
date: 2025-11-06 21:06:24
tags:
---

# Nginx 监控

`nginx 提供了 ngx_http_stub_status_module.这个模块提供了基本的监控功能`

# nginx的基础监控

```ini
- 进程监控
- 端口监控
```

# 监控的指标

```ini
Accepts（接受）、Handled（已处理）、Requests（请求数）是一直在增加的计数器。Active（活跃）、Waiting（等待）、Reading（读）、Writing（写）随着请求量而增减
```

# nginx Stub Status 监控模块安装

# 先使用命令查看是否已经安装这个模块

```ini
# -V大写会显示版本号和模块等信息、v小写仅显示版本信息

[root@localhost ~]# nginx -V
```

# 如果没有此模块，需要重新安装，编译命令如下

```ini
# 添加--with-http_stub_status_module模块

./configure --prefix=/etc/nginx --sbin-path=/usr/sbin/nginx --modules-path=/usr/lib64/nginx/modules --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --pid-path=/var/run/nginx.pid --lock-path=/var/run/nginx.lock --http-client-body-temp-path=/var/cache/nginx/client_temp --http-proxy-temp-path=/var/cache/nginx/proxy_temp --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp --http-scgi-temp-path=/var/cache/nginx/scgi_temp --user=nginx --group=nginx --with-compat --with-file-aio --with-threads --with-http_addition_module --with-http_auth_request_module --with-http_dav_module --with-http_flv_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_mp4_module --with-http_random_index_module --with-http_realip_module --with-http_secure_link_module --with-http_slice_module --with-http_ssl_module --with-http_stub_status_module --with-http_sub_module --with-http_v2_module --with-mail --with-mail_ssl_module --with-stream --with-stream_realip_module --with-stream_ssl_module --with-stream_ssl_preread_module --with-cc-opt='-O2 -g -pipe -Wall -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector-strong --param=ssp-buffer-size=4 -grecord-gcc-switches -m64 -mtune=generic -fPIC' --with-ld-opt='-Wl,-z,relro -Wl,-z,now -pie' --add-module=/root/nginx-sticky-module-ng --with-http_stub_status_module
```

# 在配置文件里添加

```ini
[root@localhost ~]# vim /etc/nginx/conf.d/status.conf 
server {
        listen 80;
        server_name localhost;
        location /nginx-status {
                stub_status     on;
                access_log      on;
                }
}
```

# nginx 状态查看

```ini
配置完成后在浏览器中输入http://10.0.105.207/nginx-status 查看显示信息如下

Active connections: 2 
server accepts handled requests
 26 26 48 
Reading: 0 Writing: 1 Waiting: 1
```

 

