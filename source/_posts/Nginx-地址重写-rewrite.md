---
title: Nginx 地址重写 rewrite实验
author: Mr.xu
date: 2025-11-06 21:09:21
tags:
---



# nginx 地址重写 rewrite

`什么是Rewrite`

Rewrite对称URL Rewrite，即URL重写，就是把传入Web的请求重定向到其他URL的过程

`Rewrite 相关指令`

Nginx Rewrite 相关指令有 if、rewrite、set、return

# rewrite指令最后跟一个flag标记，支持的flag标记有

```shell
last 			    表示完成rewrite。默认为last。会第二次验证
break 				本条规则匹配完成后，终止匹配，不再匹配后面的规则
redirect 			返回302临时重定向，浏览器地址会显示跳转后的URL地址
permanent 		    返回301永久重定向，浏览器地址会显示跳转后URL地址
```

# 1、Rewrite匹配参考示例

示例

```shell
例1：
本地解析host文件--wind
# http://www.testpm.com/a/1.html ==> http://www.testpm.com/b/2.html
    location /a {
        root    /html;
        index   1.html index.htm;
        rewrite .* /b/2.html permanent;
        }
    location /b {
        root    /html;
        index   2.html index.htm;
        }
# IP地址后面需要跟后缀 `/a/1.html`

例2：
# http://www.testpm.com/2019/a/1.html ==> http://www.testpm.com/2018/a/1.html
     location /2019/a {
        root    /var/www/html;
        index   1.html index.hml;
        rewrite ^/2019/(.*)$ /2018/$1 permanent;
        }
     location /2018/a {
        root    /var/www/html;
        index   1.html index.htl;
        }
# IP地址后面需要跟后缀 `/2019/a/1.html`

例3：
# http://www.qf.com/a/1.html ==> http://jd.com
location /a {
        root    /html;
        if ($host ~* www.qf.com ) {
        rewrite .* http://jd.com permanent;
        }
        }

例4：
# http://www.qf.com/a/1.html ==> http://jd.com/a/1.html
location /a {
        root /html;
        if ( $host ~* qf.com ){
        rewrite .* http://jd.com$request_uri permanent;
        }
        }

例5：
# http://www.tianyun.com/login/tianyun.html ==> http://www.tianyun.com/reg/login.html?user=tianyun
	location /login {
        root   /usr/share/nginx/html;
        rewrite ^/login/(.*)\.html$ http://$host/reg/login.html?user=$1;
        }
    location /reg {
        root /usr/share/nginx/html;
        index login.html;
        }

例6：
#http://www.tianyun.com/qf/11-22-33/1.html  ==>  http://www.tianyun.com/qf/11/22/33/1.html
location /qf {
            rewrite ^/qf/([0-9]+)-([0-9]+)-([0-9]+)(.*)$ /qf/$1/$2/$3$4 permanent;
        }

        location /qf/11/22/33 {
                root /html;
                index   1.html;
        }
```

# 2、set 指令

set 指令是用于定义一个变量，并且赋值

示例

```shell
例8：
#http://alice.testpm.com ==> http://www.testpm.com/alice
#http://jack.testpm.com ==> http://www.testpm.com/jack

[root@nginx-server conf.d]# cd /usr/share/nginx/html/
[root@nginx-server html]# mkdir jack alice
[root@nginx-server html]# echo "jack.." >> jack/index.html
[root@nginx-server html]# echo "alice.." >> alice/index.html

本地解析域名host文件
10.0.105.202 www.testpm.com
10.0.105.202 alice.testpm.com
10.0.105.202 jack.testpm.com
编辑配置文件:
server {
    listen       80;
    server_name  www.testpm.com;

    location / {
         root   /usr/share/nginx/html;
         index  index.html index.htm;
         if ( $host ~* ^www.testpm.com$) {
                break;
                }
         if ( $host ~* "^(.*)\.testpm\.com$" ) {
                set $user $1;
                rewrite .* http://www.testpm.com/$user permanent;
                }
        }
    location /jack {
         root /usr/share/nginx/html;
         index  index.html index.hml;
        }
    location /alice {
         root /usr/share/nginx/html;
         index index.html index.hml;
        }
}
```

# 3、return 指令

return 指令用于返回状态码给客户端

示例

```shell
例9：如果访问的.sh结尾的文件则返回403操作拒绝错误
server {
    listen       80;
    server_name  www.testpm.cn;
    #access_log  /var/log/nginx/http_access.log  main;

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
        }

    location ~* \.sh$ {
        return 403;
        }
}

```

# 4、last,break详解

```shell
[root@localhost test]# cat /etc/nginx/conf.d/last_break.conf 
server {
    listen       80;
    server_name  localhost;
    access_log  /var/log/nginx/last.access.log  main;

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }
    location /break/ {
        root /usr/share/nginx/html;
        rewrite .* /test/break.html break;
    }
    location /last/ {
        root /usr/share/nginx/html;
        rewrite .* /test/last.html last;
    }
    location /test/ {
        root /usr/share/nginx/html;
        rewrite .* /test/test.html break;
    }

}
[root@localhost conf.d]# cd /usr/share/nginx/html/
[root@localhost html]# mkdir test
[root@localhost html]# echo "last" > test/last.html
[root@localhost html]# echo "break" > test/break.html
[root@localhost html]# echo "test" > test/test.html

http://10.0.105.196/break/break.html
http://10.0.105.196/last/last.html
```

