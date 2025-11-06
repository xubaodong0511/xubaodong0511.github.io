---
title: Nginx 访问控制实验
author: Mr.xu
date: 2025-11-06 21:07:32
tags:
---

# Nginx 访问控制

nginx 访问控制模块

```ini
（1）基于IP的访问控制：http_access_module
（2）基于用户的信任登录：http_auth_basic_module
```

1、基于IP的访问控制

```ini
# 语法
Syntax：allow address | all;
default：默认无
Context：http，server，location

Syntax：deny address | all;
default：默认无

Context：http，server，location
===================================================

allow    允许     //ip或者网段
deny    拒绝     //ip或者网段
```

示例一

```ini
# 拒绝192.168.1.8登入，允许其他所有
[root@192 ~]# vim /etc/nginx/conf.d/access_mod.conf
server {
        listen 80;
        server_name localhost;
        location  / {
                root /usr/share/nginx/html;
                index index.html index.hml;
                deny 192.168.1.8;
                allow all;
                }
}
[root@192 ~]# nginx -t
[root@192 ~]# nginx -s reload

#需要注意:
1.按顺序匹配，已经被匹配的ip或者网段，后面不再被匹配。
2.如果先允许所有ip访问，在定义拒绝访问。那么拒绝访问不生效。
3.默认为allow all
```

示例二

```ini
# 拒绝所有请求登入
[root@192 ~]# vim /etc/nginx/conf.d/access_mod.conf
server {
        listen 80;
        server_name localhost;
        location  / {
                root /usr/share/nginx/html;
                index index.html index.hml;
                deny all;    #拒绝所有
                }
}

[root@192 ~]# nginx -t
[root@192 ~]# nginx -s reload
```

2、基于用户的信任登录

```ini
# 语法
Syntax：auth_basic string | off;
default：auth_basic off;
Context：http，server，location

Syntax：auth_basic_user_file file;
default：默认无
Context：http，server，location
file：存储用户名密码信息的文件。
```

示例一

```ini
[root@192 ~]# vim /etc/nginx/conf.d/auth_mod.conf 
server {
	listen 80;
	server_name localhost;
	location ~ /admin {
		root /var/www/html;
		index index.html index.hml;
		auth_basic "Auth access test!";
		auth_basic_user_file /etc/nginx/auth_conf;
		}
}

[root@192 ~]# nginx -t
[root@192 ~]# nginx -s reload
[root@192 ~]# mkdir /var/www/html    #创建目录
[root@192 ~]# vim /var/www/html/index.html    #创建文件
```

`auth_basic`不为`off`，开启登录验证功能，

`auth_basic_user_file`加载账号密码文件。

3、建立口令文件

`登入需要密码`

示例一

```ini
[root@192 ~]# yum install -y httpd-tools #htpasswd 是开源 http 服务器 apache httpd 的一个命令工具，用于生成 http 基本认证的密码文件
[root@192 ~]# htpasswd -cm /etc/nginx/auth_conf user10 # -c 创建解密文件，-m MD5加密
[root@192 ~]# htpasswd -m /etc/nginx/auth_conf user20
[root@192 ~]# cat /etc/nginx/auth_conf 
user10:$apr1$MOa9UVqF$RlYRMk7eprViEpNtDV0n40
user20:$apr1$biHJhW03$xboNUJgHME6yDd17gkQNb0
```

