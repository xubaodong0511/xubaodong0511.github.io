---
title: Nginx 的localtion指令详解实验
author: Mr.xu
date: 2025-11-06 21:10:03
tags:
---

# nginx的localtion指令详解

`Nginx 的 HTTP 配置主要包括三个区块，结构如下：`

```shell
http { 						# 这个是协议级别
　　include mime.types;
　　default_type application/octet-stream;
　　keepalive_timeout 65;
　　gzip on;
　　　　server {			 # 这个是服务器级别
　　　　　　listen 80;
　　　　　　server_name localhost;
　　　　　　　　location / {  # 这个是请求级别
　　　　　　　　　　root html;
　　　　　　　　　　index index.html index.htm;
　　　　　　　　}
　　　　　　}
}
```

`一个HTTP模块里可以有多个server模块` `一个server模块里可以有多个location模块`

# location 前缀含义

```shell
=    表示精确匹配，优先级也是最高的 
^~   表示uri以某个常规字符串开头,理解为匹配url路径即可 
~    表示区分大小写的正则匹配  
~*   表示不区分大小写的正则匹配
!~   表示区分大小写不匹配的正则
!~*  表示不区分大小写不匹配的正则
/    通用匹配，任何请求都会匹配到
@    内部服务跳转
```

# 查找顺序和优先级

`= 大于 ^~  大于 ~|~*|!~|!~* 大于 /`

