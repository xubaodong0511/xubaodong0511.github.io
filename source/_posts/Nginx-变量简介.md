---
title: Nginx 变量简介实验
author: Mr.xu
date: 2025-11-06 21:06:59
tags:
---

# Nginx 变量

nginx变量简介

- 所有的 `Nginx`变量在` Nginx `配置文件中引用时都须带上 $ 前缀
- 在 `Nginx` 配置中，变量只能存放一种类型的值，而且也只存在一种类型，那就是字符串类型

- 所有的变量值都可以通过这种方式引用`$变量名`

nginx中的变量分为两种，自定义变量与内置预定义变量

- 自定义变量`set $变量名 变量值`

- 内置预定义变量

`$arg_PARAMETER`		GET请求中变量名PARAMETER参数的值。  

`$args`		这个变量等于GET请求中的参数。例如，foo=123&bar=blahblah;这个变量只可以被修改

`$binary_remote_addr`		二进制码形式的客户端地址

`$body_bytes_sent`		传送页面的字节数  

`$content_length`		请求头中的Content-length字段

`$content_type`		请求头中的Content-Type字段

`$cookie_COOKIE`		cookie COOKIE的值

`$document_root`		当前请求在root指令中指定的值

`$host`		请求中的主机头(Host)字段，如果请求中的主机头不可用或者空，则为处理请求的server名称(处理请求的server的server_name指令的值)。值为小写，不包含端口

`$hostname`		机器名使用 gethostname系统调用的值

`$limit_rate`		这个变量可以限制连接速率

`$nginx_version`		当前运行的nginx版本号

`$remote_addr`		客户端的IP地址

`$remote_port`		客户端的端口

`$remote_user`		已经经过Auth Basic Module验证的用户名

`$request_filename`		当前连接请求的文件路径，由root或alias指令与URI请求生成

`$request_body`		这个变量（0.7.58+）包含请求的主要信息。在使用proxy_pass或fastcgi_pass指令的location中比较有意义

`$request_body_file`		客户端请求主体信息的临时文件名

`$request_completion`		如果请求成功，设为"OK"；如果请求未完成或者不是一系列请求中最后一部分则设为空

`$request_method`		这个变量是客户端请求的动作，通常为GET或POST。包括0.8.20及之前的版本中，这个变量总为main request中的动作，如果当前请求是一个子请求，并不使用这个当前请求的动作

`$server_addr`		服务器地址，在完成一次系统调用后可以确定这个值，如果要绕开系统调用，则必须在listen中指定地址并且使用bind参数

`$server_name`		服务器名称

`$server_port`		请求到达服务器的端口号

`$server_protocol`		请求使用的协议，通常是HTTP/1.0或HTTP/1.1

`$uri`		请求中的当前URI(不带请求参数，参数位于args)，不同于浏览器传递的args)，不同于浏览器传递的args)，不同于浏览器传递的request_uri的值，它可以通过内部重定向，或者使用index指令进行修改。不包括协议和主机名，例如/foo/bar.html