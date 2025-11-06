---
title: Nginx 负载均衡&反向代理实验
author: Mr.xu
date: 2025-11-06 21:12:33
tags:
---

# 负载均衡&反向代理

**准备三台机器：版本为yum源安装**

**这个配置是写代理的机器上**

```

# 1.首先在主配置文件上http模块里添加
 [root@localhost ~]# vim /etc/nginx/nginx.conf
 http {
     include       /etc/nginx/mime.types;
     default_type  application/octet-stream;
 # 以下模块添加到代理的机器上
 upstream testapp {
       server 10.0.105.199:8081;
       server 10.0.105.202:8081;
    
    }
     include /etc/nginx/conf.d/*.conf;
  }
server {
        listen       80;
        server_name  www.test.com;
        charset utf-8;
        #access_log  logs/host.access.log  main;
        
 # 2.然后在子配置文件里server模块里免添加
         location / {
                 proxy_pass http://testweb;
                 proxy_set_header Host $host:$server_port;
                 proxy_set_header X-Real-IP $remote_addr;
                 proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
         }
 }
 
 # 此时代理机器上配置完成，刷新nginx服务
 systemctl restart nginx
```

**以下是在被代理的机器上写入**

```

 # 在两台被代理的机器上分别写入以下location模块内容
 server {
     listen       80;
     server_name  localhost;
 
   #  access_log  /var/log/nginx/host.access.log  main;
 # 写入以下模块
     location / {
         root   /usr/share/nginx/html;
         index  index.html index.htm;
     }
 }
 
 # 此时被代理机器配置完成，重启服务
 systemctl restart nginx

# 分别在两台宿主机上创建文件及内容
echo 111 >> /usr/share/nginx/html/index.html

# 测试
在网站上输入代理机的IP地址，会分别出来两台宿主机的页面
```

**验证**

```

 打开网站，输入代理机器的ip或域名，刷新网站，此时会分别出现被代理机器的内容
```
