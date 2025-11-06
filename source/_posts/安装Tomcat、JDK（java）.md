---
title: 安装Tomcat、JDK（java）实验
author: Mr.xu
date: 2025-11-06 21:05:40
tags:
---

### 1、安装JDK
上传jdk1.8到服务器，安装jdk
```
[root@java-tomcat1 ~]# tar xzf jdk-8u191-linux-x64.tar.gz -C /usr/local/
[root@java-tomcat1 ~]# cd /usr/local/
[root@java-tomcat1 local]# mv jdk1.8.0_191/ java
```
设置环境变量:
```
[root@java-tomcat1 local]# vim /etc/profile
JAVA_HOME=/usr/local/java #指定java安装目录
PATH=$JAVA_HOME/bin:$PATH #用于指定java系统查找命令的路径
export JAVA_HOME PATH #类的路径，在编译运行java程序时，如果有调用到其他类的时候，在classpath中寻找需要的类。
```
检测JDK是否安装成功:
```
[root@java-tomcat1 local]# source /etc/profile
[root@java-tomcat1 local]# java -version 
java version "1.8.0_191"
Java(TM) SE Runtime Environment (build 1.8.0_191-b12)
Java HotSpot(TM) 64-Bit Server VM (build 25.191-b12, mixed mode)
```

#### 安装Tomcat

```ini
[root@java-tomcat1 ~]# mkdir /data/application -p
[root@java-tomcat1 ~]# cd /usr/src/
[root@java-tomcat1 src]# wget http://mirrors.tuna.tsinghua.edu.cn/apache/tomcat/tomcat-8/v8.5.42/bin/apache-tomcat-8.5.42.tar.gz
[root@java-tomcat1 src]# tar xzf apache-tomcat-8.5.42.tar.gz -C /data/application/
[root@java-tomcat1 src]# cd /data/application/
[root@java-tomcat1 application]# mv apache-tomcat-8.5.42/ tomcat
```
设置环境变量:
```
[root@java-tomcat1 application]# vim /etc/profile
export TOMCAT_HOME=/data/application/tomcat   #指定tomcat的安装目录
[root@java-tomcat1 application]# source  /etc/profile
```
查看tomcat是否安装成功:
```
[root@java-tomcat1 tomcat]# /data/application/tomcat/bin/startup.sh或 /data/application/tomcat/bin/version.sh
Using CATALINA_BASE:   /data/application/tomcat
Using CATALINA_HOME:   /data/application/tomcat
Using CATALINA_TMPDIR: /data/application/tomcat/temp
Using JRE_HOME:        /usr/local/java
Using CLASSPATH:       /data/application/tomcat/bin/bootstrap.jar:/data/application/tomcat/bin/tomcat-juli.jar
Server version: Apache Tomcat/8.5.42
Server built:   Jun 4 2019 20:29:04 UTC
Server number:  8.5.42.0
OS Name:        Linux
OS Version:     3.10.0-693.el7.x86_64
Architecture:   amd64
JVM Version:    1.8.0_191-b12
JVM Vendor:     Oracle Corporation
```
测试
`游览器输入IP地址，出现Tomcat测试页面代表完成`