---
title: Nginx 实现动静分离实验
author: Mr.xu
date: 2025-11-06 21:10:33
tags:
---

# nginx 实现动静分离

`准备环境`

准备3台机器，一个nginx代理 两个http 分别处理动态和静态

`expires`功能说明

```shell
当nginx设置了expires后，例如设置为：expires 10d; 那么用户在10天内请求的时候，都只会访问浏览器中的缓存，而不会去请求nginx。
```

# 1、静态资源配置

```shell
server {
        listen 80;
        server_name     localhost;

        location ~ \.(html|jpg|png|js|css) {
        root /home/www/nginx;
        expires      1d; #为客户端设置静态资源缓存时间
        }
}

```

`测试`

```shell
curl -I http://192.168.116.111/test.jpg
HTTP/1.1 200 OK		//显示200，代表成功

# 也可以在网址访问：192.168.116.111/test.jpg
```

# 2、动态资源配置

`yum 安装php7.1`

```shell
# 下载epel源
rpm -Uvh https://mirror.webtatic.com/yum/el7/epel-release.rpm

# Webtatic存储库添加到您的系统中，并从该存储库安装或升级相关的软件包
rpm -Uvh https://mirror.webtatic.com/yum/el7/webtatic-release.rpm

-U 表示更新（如果软件包已经安装则进行升级）。
-v 表示显示详细的安装过程。
-h 表示在安装过程中显示进度条。

# 下载php依赖包及主包
`依赖包`
yum -y install php71w-xsl php71w php71w-ldap php71w-cli php71w-common php71w-devel php71w-gd php71w-pdo php71w-mysql php71w-mbstring php71w-bcmath php71w-mcrypt
`主包`
yum install -y php71w-fpm

# 启动php
systemctl start php-fpm
```

# 编辑nginx的配置文件

```shell
erver {
        listen      80;
        server_name     localhost;
        location ~ \.php$ {
            root           /home/nginx/html;  #指定网站目录
            fastcgi_pass   127.0.0.1:9000;    #开启fastcgi连接php地址
            fastcgi_index  index.php;		#指定默认文件
            fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name; #站点根目录，取决于root配置项
            include        fastcgi_params;  #包含fastcgi使用的常量
        		}
        }
```

# 3、配置nginx反向代理upstream，并实现客户端缓存时间

```shell
upstream static {
        server 10.0.105.196:80 weight=1 max_fails=1 fail_timeout=60s;
        }
upstream php {
        server 10.0.105.200:80 weight=1 max_fails=1 fail_timeout=60s;
        }

        server {
        listen      80;
        server_name     localhost
        #动态资源加载
        location ~ \.(php|jsp)$ {
            proxy_pass http://php;
            proxy_set_header Host $host:$server_port;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                }
        #静态资源加载
        location ~ .*\.(html|jpg|png|css|js)$ {
            proxy_pass http://static;
            proxy_set_header Host $host:$server_port;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                }
        }
```

# 测试

`在网址上输入代理机的IP，后缀加上你要查看的（静态图片名字|动态图片名字）`