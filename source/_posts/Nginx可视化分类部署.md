---
title: Nginx可视化分类部署
author: Mr.xu
date: 2025-11-06 16:13:20
tags:
---

## 部署Nginx可视化界面

### 1、长亭雷池SafeLine部署

#### 最低配置要求

```perl
操作系统：Linux
指令架构：x86_64
软件依赖：Docker 20.10.14 版本以上
软件依赖：Docker Compose 2.0.0 版本以上
最小化环境：1 核 CPU / 1 GB 内存 / 5 GB 磁盘
```

#### 一键脚本安装

```perl
bash -c "$(curl -fsSLk https://waf-ce.chaitin.cn/release/latest/setup.sh)"

# 脚本地址
https://waf-ce.chaitin.cn/docs/guide/install
```

### 2、nginxWebUI界面部署

#### 安装jdk、nginx

```perl
bash <(curl -sSL https://gitee.com/xbd666/qingfeng/raw/master/toolbox.sh)
```

#### 下载nginxWebUI.jarbao

```perl
 mkdir /opt/nginxWebUI/ 
 wget -O /opt/nginxWebUI/nginxWebUI.jar http://file.nginxwebui.cn/nginxWebUI-3.8.2.jar
```

#### 启动程序

```perl
nohup java -jar -Dfile.encoding=UTF-8 /opt/nginxWebUI/nginxWebUI.jar --server.port=8080 --project.home=/opt/nginxWebUI/ > /dev/null &
# 端口可以自定义
```

#### 登入访问页面

```perl
http://ip:8080   进入主页		# 端口可以自定义
# 第一次登入需要设置用户名 和 用户密码

# 在http参数配置中可以配置nginx的http项目，进行http转发，默认会给出几个常用配置，其他需要的配置可自由增删改查。可以勾选开启日志跟踪，生成日志文件

# 在反向代理中可配置nginx的反向代理即server项功能，可开启ssl功能，可以直接从网页上上传pem文件和key文件，或者使用系统内申请的证书，可以直接开启http转跳https功能，也可开启http2协议


# 在负载均衡中可配置nginx的负载均衡即upstream项功能，在反向代理管理中可选择代理目标为配置好的负载均衡
```
