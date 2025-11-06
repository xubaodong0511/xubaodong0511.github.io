---
title: jenkins版本8部署
author: Mr.xu
date: 2025-11-06 16:15:43
tags:
---

## 1.8版jenkins安装--适应java 8 环境

```perl
dev-jenkins访问地址：106.15.94.146:8181
# 用户 / 密码 / 邮箱
zijian / h8G*p%4d%vqN*wbJ  / 13921808706@163.com
dev-network-jenkins访问地址：106.15.94.146:8182
# 用户 / 密码 / 邮箱
zijian / h8G*p%4d%vqN*wbJ  / 13921808706@163.com

博客地址：https://blog.csdn.net/DrakHP/article/details/136065639

wget https://a.xbd666.cn/d/Aliyun/Cloud_computing/Software_package/tomcat-jdk/jdk-8u271-linux-x64.tar.gz

wget https://a.xbd666.cn/d/Aliyun/Cloud_computing/Software_package/maven-nodejs/apache-maven-3.9.3-bin.tar.gz

[root@localhost ~]# ls
anaconda-ks.cfg  apache-maven-3.9.3-bin.tar.gz  jdk-8u271-linux-x64.tar.gz
[root@localhost ~]# tar xzf apache-maven-3.9.3-bin.tar.gz  -C /usr/local/
[root@localhost ~]# tar xzf jdk-8u271-linux-x64.tar.gz  -C /usr/local/
[root@localhost ~]# cd /usr/local/
[root@localhost local]# ls
apache-maven-3.9.3  bin  etc  games  include  jdk1.8.0_271  lib  lib64  libexec  sbin  share  src
[root@localhost local]# mv apache-maven-3.9.3/ maven
[root@localhost local]# mv jdk1.8.0_271/ java
[root@localhost local]# ls
bin  etc  games  include  java  lib  lib64  libexec  maven  sbin  share  src
[root@localhost local]# mkdir jenkins
[root@localhost local]# cd jenkins/
[root@localhost jenkins]# ls
[root@localhost jenkins]#  wget https://repo.huaweicloud.com/jenkins/redhat-stable/jenkins-2.346.3-1.1.noarch.rpm

[root@localhost jenkins]# ls
jenkins-2.346.3-1.1.noarch.rpm
[root@localhost jenkins]# rpm -ivh jenkins-2.346.3-1.1.noarch.rpm
警告：jenkins-2.346.3-1.1.noarch.rpm: 头V4 RSA/SHA512 Signature, 密钥 ID 45f2c3d5: NOKEY
准备中...                          ################################# [100%]
stat: 无法获取"/var/cache/jenkins" 的文件状态(stat): 没有那个文件或目录
stat: 无法获取"/var/log/jenkins" 的文件状态(stat): 没有那个文件或目录
stat: 无法获取"/var/lib/jenkins" 的文件状态(stat): 没有那个文件或目录
错误：%pre(jenkins-2.346.3-1.1.noarch) 脚本执行失败，退出状态码为 1
错误：jenkins-2.346.3-1.1.noarch: 安裝 已失败

[root@localhost jenkins]# mkdir -p /var/cache/jenkins
[root@localhost jenkins]# mkdir -p /var/log/jenkins
[root@localhost jenkins]# mkdir -p /var/lib/jenkins
[root@localhost jenkins]# rpm -ivh jenkins-2.346.3-1.1.noarch.rpm
警告：jenkins-2.346.3-1.1.noarch.rpm: 头V4 RSA/SHA512 Signature, 密钥 ID 45f2c3d5: NOKEY
准备中...                          ################################# [100%]
正在升级/安装...
   1:jenkins-2.346.3-1.1              ################################# [100%]

[root@localhost jenkins]# vim /etc/profile

JAVA_HOME=/usr/local/java
MAVEN_HOME=/usr/local/maven
PATH=$PATH:$JAVA_HOME/bin:$MAVEN_HOME/bin
export JAVA_HOME MAVEN_HOME PATH
export JENKINS_HOME=/usr/local/jenkins		#添加到最后一行,并添加环境变量

[root@localhost jenkins]# vim /etc/sysconfig/jenkins

JENKINS_HOME="/var/lib/jenkins"	改为	JENKINS_HOME="/usr/local/jenkins"

JENKINS_USER="jenkins"	改为	JENKINS_USER="root"

JENKINS_PORT="8080"	端口改为	JENKINS_PORT="8181"

[root@localhost jenkins]# source /etc/profile
[root@localhost jenkins]# which java
/usr/local/java/bin/java
[root@localhost jenkins]# vim /etc/init.d/jenkins 

往下滑，找到 candidates=

将“”中的最后一行改为我们刚刚得到的jdk路径  /usr/local/java/bin/java

candidates="
/etc/alternatives/java
/usr/lib/jvm/java-1.8.0/bin/java
/usr/lib/jvm/jre-1.8.0/bin/java
/usr/lib/jvm/java-11.0/bin/java
/usr/lib/jvm/jre-11.0/bin/java
/usr/lib/jvm/java-11-openjdk-amd64
/usr/bin/java
/usr/local/java/bin/java		#直接添加我们刚刚得到的JDK路径
"

[root@localhost jenkins]# systemctl daemon-reload
[root@localhost jenkins]# systemctl stop firewalld
[root@localhost jenkins]# cd /etc/init.d/
[root@localhost init.d]# ls
functions  jenkins  netconsole  network  README
[root@localhost init.d]# ./jenkins start

#访问网址：139.224.245.121:8181

接下来，先别安装插件，此时重新输入网址，ip+端口号/pluginManager/advanced

例如：139.224.245.121:8181/pluginManager/advanced

进入界面后，往下滑，找到Update Site，修改URL

https://mirror.tuna.tsinghua.edu.cn/jenkins/updates/dynamic-stable-2.346.1/update-center.json	# 将原有的更改为这个URL

然后点击上方的Availabale  后  点击Check now

然后需要重新启动jenkins，更新配置

输入网址：172.16.11.31:8181/restart

会提示我们是否要重启，点击Yes，等待重启成功

然后需要再重复一次输入管理面密码的操作，进入finalshell中，输入cat 得到的密码进行访问

#访问网址：139.224.245.121:8181

# 在网关的机器上配置Nginx代理
server {
        listen  9966;

        location / {
                proxy_pass http://172.16.174.124:8181/;
                proxy_set_header Host $host:$server_port;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
}
# 访问网址：http://106.15.94.146:9966/

# 用户 / 密码 / 邮箱
zijian / h8G*p%4d%vqN*wbJ  / 13921808706@163.com

# git安装--脚本安装
密码：Zj123456
```
