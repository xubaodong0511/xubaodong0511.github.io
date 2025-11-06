---
title: Nginx 流量控制实验
author: Mr.xu
date: 2025-11-06 21:08:08
tags:
---

# Nginx 流量控制

配置基本的限流--ngx_http_limit_req_module模块实现

流量限制”配置两个主要的指令，`limit_req_zone`和`limit_req`，`limit_req_zone`指令设置流量限制和内存区域的参数，但实际上并不限制请求速率。所以需要通过添加`limit_req`指令启用流量限制,应用在特定的`location`或者`server`块

`limit_req_zone`指令通常在HTTP块中定义，它需要以下三个参数：

```ini
-Key - 定义应用限制的请求特性。示例中的 Nginx 变量$binary_remote_addr，保存客户端IP地址的二进制形式。
-Zone - 定义用于存储每个IP地址状态以及被限制请求URL访问频率的内存区域。通过zone=keyword标识区域的名字(自定义)，以及冒号后面跟区域大小。16000个IP地址的状态信息，大约需要1MB。
-Rate - 连接请求。在示例中，速率不能超过每秒1个请求。
```

示例一

这里需要两台机器，一台代理，一台宿主机

`代理机配置`

```shell
limit_req_zone $binary_remote_addr zone=mylimit:10m rate=1r/s;
        upstream myweb {
                server 10.0.105.196:80 weight=1 max_fails=1 fail_timeout=1;
                }
        server {
                listen 80;
                server_name localhost;

                location /login {
                        limit_req zone=mylimit;
                        proxy_pass http://myweb;
                        proxy_set_header Host $host:$server_port;
                        proxy_set_header X-Real-IP $remote_addr;
                        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                        }
        }
```

`宿主机配置`

```ini
192.168.116.111配置:
server {
        listen 80;
        server_name localhost;
        location /login {
                root    /usr/share/nginx/html;
                index   index.html index.html;
                }
}
```

测试及查看日志

```ini
客户端安装压力测试工具
[root@nginx-yum ~]# yum install httpd-tools
[root@nginx-yum ~]# ab -n1000 -c2 http://10.0.105.196/
-n 请求数
-c 并发数
代理机器看错误日志：
[root@nginx-server ~]# tail -f /var/log/nginx/error.log 
2019/09/10 07:32:09 [error] 1371#0: *1095 limiting requests, excess: 0.390 by zone "mylimit", client: 10.0.105.196, server: localhost, request: "GET / HTTP/1.0", host: "10.0.105.196"
```

示例二

```ini
limit_req_zone $binary_remote_addr zone=mylimit:10m rate=1r/s;
        upstream myweb {
                server 10.0.105.196:80 weight=1 max_fails=1 fail_timeout=1;
                }
        server {
                listen 80;
                server_name localhost;

                location /login {
                        #limit_req zone=mylimit;
						limit_req zone=mylimit burst=5;
						#limit_req zone=mylimit burst=5 nodelay;
                        proxy_pass http://myweb;
                        proxy_set_header Host $host:$server_port;
                        proxy_set_header X-Real-IP $remote_addr;
                        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                        }
        }
burst=5 表示最大延迟请求数量不大于5。超出的请求返回503状态码。
客户端测试--burst
[root@nginx-yum ~]# ab -n1000 -c50 http://10.0.105.195/
代理机器上面看日志
[root@nginx-server ~]# tail -f /var/log/nginx/access.log
10.0.105.196 - - [10/Sep/2019:08:05:10 +0800] "GET / HTTP/1.0" 503 197 "-" "ApacheBench/2.3" "-"
10.0.105.196 - - [10/Sep/2019:08:05:11 +0800] "GET / HTTP/1.0" 200 2 "-" "ApacheBench/2.3" "-"

nodelay：不延迟转发请求。速度变快
客户端测试--burst
[root@nginx-yum ~]# ab -n1000 -c50 http://10.0.105.195/

总结：
如果不加nodelay只有burst的时候只会延迟转发请求超过限制的请求出现503错误
如果nodelay和burst参数都有不会延迟转发请求并且超出规定的请求次数会返回503
```

日志字段介绍

```ini
- limiting requests - 表明日志条目记录的是被“流量限制”请求
- excess - 每毫秒超过对应“流量限制”配置的请求数量
- zone - 定义实施“流量限制”的区域
- client - 发起请求的客户端IP地址
- server - 服务器IP地址或主机名
- request - 客户端发起的实际HTTP请求
- host - HTTP报头中host的值
```

