---
title: zipkin日志收集部署
author: Mr.xu
date: 2025-11-06 16:12:10
tags:
---

## zipkin日志收集部署

### jar包部署

```perl
# 安装jdk8
[root@dev ~]# wget https://a.xbd666.cn/d/Aliyun/Cloud_computing/Software_package/tomcat-jdk/jdk-8u271-linux-x64.tar.gz
# 变量
[root@dev ~]# vim /etc/profile
JAVA_HOME=/usr/local/java
MAVEN_HOME=/usr/local/maven
PATH=$PATH:$JAVA_HOME/bin:$MAVEN_HOME/bin
export JAVA_HOME MAVEN_HOME PATH
[root@dev ~]# source /etc/profile

# npm环境安装
这个国内目前知道的只有淘宝有。
[root@dev ~]# alias npm="npm --registry=https://registry.npm.taobao.org --disturl=https://npm.taobao.org/mirrors/node"
# node环境安装（版本：V5.5.0）
[root@dev ~]# yum install npm -y
[root@dev ~]# git clone https://github.com/creationix/nvm.git /usr/local/nvm
[root@dev ~]# source /usr/local/nvm/install.sh
[root@dev ~]# nvm --version
[root@dev ~]# nvm install v5.5.0	#会报错
# 解决办法：--在当前用户家目录的.bash_profile文件中添加如下内容
[root@dev ~]# cat /root/.bash_profile
.....
export NVM_DIR="/usr/local/nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm

[root@dev ~]# source /root/.bash_profile
[root@dev ~]# nvm install v5.5.0		# 再次执行就 OK 了

# Zipkin安装部署
[root@dev ~]# wget -O zipkin.jar 'https://search.maven.org/remote_content?g=io.zipkin.java&a=zipkin-server&v=LATEST&c=exec'
[root@dev ~]# ls
nohup.out  zipkin.jar
[root@dev ~]# nohup java -jar zipkin.jar &               //回车，放到后台去执行
[root@dev ~]#  lsof -i:9411
COMMAND  PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
java    8440 root   33u  IPv6  64454      0t0  TCP *:9411 (LISTEN)
# 访问
浏览器输入： IP + 9411
```

### dockers部署zipkin

```
# 搜索
docker search zipkin
# 下载
docker pull openzipkin/zipkin
# 运行
docker run -d -p 9411:9411 openzipkin/zipkin
# 访问
浏览器输入： IP + 9411
```

