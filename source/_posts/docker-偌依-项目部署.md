---
title: docker-偌依 项目部署
author: Mr.xu
date: 2025-11-06 20:51:26
tags:
---

# 配置环境

```ini
配置jenkins与前端服务器与git连接

10.31.162.25	nginx-server
10.31.162.32	java-server
10.31.162.35	jenkinx-server
10.31.162.39	mysql-redis-server
10.31.162.124	haobor-server
10.31.162.125	git-server
```

# 安装前端服务器

```ini
10.31.162.25	nginx-server
安装docker
[root@nginx-server ~]# yum install -y yum-utils device-mapper-persistent-data lvm2 git
[root@nginx-server ~]# yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
[root@nginx-server ~]# yum install -y docker-ce
[root@nginx-server ~]# systemctl start docker && systemctl enable docker
[root@nginx-server ~]# mkdir /application/nginx/{logs,html} -p #创建工作目录
[root@nginx-server ~]# docker pull daocloud.io/library/nginx

先运行一次容器（为了拷贝配置文件）：
[root@nginx-server ~]# docker run -itd --name nginx-1 -p 80:80 daocloud.io/library/nginx
将容器内nginx的配置文件拷贝到宿主机上面
[root@nginx-server ~]# docker  cp web-nginx:/etc/nginx /application/nginx/
[root@nginx-server ~]# cd /application/nginx/
[root@nginx-server nginx]# ll
total 0
drwxr-xr-x 2 root root   6 May 14 00:37 html
drwxr-xr-x 2 root root   6 May 14 00:37 logs
drwxr-xr-x 3 root root 177 Feb  9  2021 nginx
# 改名
[root@nginx-server nginx]# mv nginx/ conf 
[root@nginx-server nginx]# ll
total 0
drwxr-xr-x 3 root root 177 Feb  9  2021 conf
drwxr-xr-x 2 root root   6 May 14 00:37 html
drwxr-xr-x 2 root root   6 May 14 00:37 logs
[root@nginx-server nginx]# cd conf/conf.d/
[root@nginx-server conf.d]# cp default.conf default.conf.bak
[root@nginx-server conf.d]# mv default.conf app.conf
# 配置负载均衡
[root@nginx-server conf.d]# cat upstream.conf 
upstream java-web {
	server 10.31.162.32:8080;
}
[root@nginx-server conf.d]# cat app.conf 
server {
    listen       80;
    listen  [::]:80;
    server_name  localhost;

    #charset koi8-r;
    #access_log  /var/log/nginx/host.access.log  main;

    location / {
        root   /usr/share/nginx/html;
	try_files $uri $uri/ /index.html;
        index  index.html index.htm;
    }

    location /prod-api/{
      proxy_pass http://java-web/;
      proxy_set_header Host $http_host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   }
}

停止并删除容器
[root@nginx-server ~]# docker stop web-nginx 
[root@nginx-server ~]#docker rm web-nginx

创建启动脚本
[root@nginx-server ~]# mkdir /opt/script
[root@nginx-server ~]# cat /opt/script/updata-nginx.sh 
nginx.sh 
#!/usr/bin/bash
up_path=/root/upload/
code=*.tar.gz
src=/application/nginx/html
docker_name=web-nginx

docker login -uadmin -p'Harbor12345' 10.31.162.124
cd $up_path
tar xzf $code -C $src
cd $src && chmod 777 * -R
if [ $? -eq 0 ];then
	docker run -itd --restart=always --name web-nginx -p 80:80 -v /application/nginx/html/:/usr/share/nginx/html -v /application/nginx/logs/:/var/log/nginx/ -v /application/nginx/conf:/etc/nginx 10.31.162.124/nginx/mynginx:v1.0
	sleep 1
	if [ $? -eq 0 ];then
		echo "nginx is started"
	else
		echo "启动失败,请手动处理"
	fi
else
	echo "解压失败"
fi
chmod 777 $src/ -R

# 赋予权限
[root@nginx-server ~]# chmod +x /opt/script/updata-nginx.sh
配置连接harbor仓库地址
[root@nginx-server ~]# vim /etc/docker/daemon.json
{
"insecure-registries": ["192.168.209.166"]
}
[root@nginx-server ~]# systemctl restart docker
```

# 安装mysql与redis

```ini
10.31.162.39	mysql-redis-server
1.安装redis
[root@mysql-redis ~]# wget https://download.redis.io/releases/redis-7.0.9.tar.gz
[root@mysql-redis ~]# tar xzvf redis-7.0.9.tar.gz -C /usr/local/
[root@mysql-redis ~]# mv /usr/local/redis-7.0.9/ /usr/local/redis
[root@mysql-redis ~]# cd /usr/local/redis/
[root@mysql-redis redis]# yum install -y gcc make
[root@mysql-redis redis]# make
[root@mysql-redis redis]# vim redis.conf
bind 10.31.162.39　　#只监听内网IP
daemonize yes　　　　　#开启后台模式将on改为yes
port 6379                      #端口号
protected-mode no    #将加密保护模式关闭

启动redis
[root@mysql-redis redis]# src/redis-server redis.conf &
[root@mysql-redis redis]# netstat -lntp | grep 6379
tcp        0      0 192.168.209.159:6379    0.0.0.0:*               LISTEN      5770/src/redis-serv

2.安装mysql
[root@mysql-redis ~]# wget https://dev.mysql.com/get/mysql80-community-release-el7-7.noarch.rpm
[root@mysql-redis ~]# rpm -ivh mysql80-community-release-el7-7.noarch.rpm
[root@mysql-redis ~]# vim /etc/yum.repos.d/mysql-community.repo
将8.0关闭，将5.7开启
[root@mysql-redis ~]# yum install -y mysql-community-server
[root@mysql-redis ~]# systemctl start mysqld
[root@mysql-redis ~]# systemctl enable mysqld
[root@mysql-redis ~]# grep pass /var/log/mysqld.log 
2023-05-09T12:37:58.805419Z 1 [Note] A temporary password is generated for root@localhost: :h,=.RRr28kt
[root@mysql-redis ~]# mysqladmin -uroot -p':h,=.RRr28kt' password 'QianFeng@123!'
[root@mysql-redis ~]# mysql -uroot -p'QianFeng@123!'
mysql: [Warning] Using a password on the command line interface can be insecure.
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 3
Server version: 5.7.31 MySQL Community Server (GPL)
...
创建数据库ry
mysql> create database ry character set utf8 collate  utf8_general_ci;
Query OK, 1 row affected (0.00 sec)

设置root允许远程登录
mysql> update mysql.user set host = '%' where user = 'root';
Query OK, 1 row affected (0.10 sec)
Rows matched: 1  Changed: 1  Warnings: 0

mysql> flush privileges;

mysql> \q
Bye
```

# git-server获取代码

```ini
10.31.162.125	git-server
# 配置git
[root@git-server ~]# git config --global user.email "soho@163.com"
[root@git-server ~]# git config --global user.name "soho"
#[root@git-server ~]# git clone https://gitee.com/y_project/RuoYi-Vue.git
[root@git-server ~]# wget https://a.xbd666.cn/d/Aliyun/Cloud_computing/Software_package/RuoYi-Vue-master.zip
[root@git-server ~]# mv RuoYi-Vue-master/	RuoYi-Vue
[root@git-server ~]# cd RuoYi-Vue/
[root@git-server RuoYi-Vue]# ls
bin      pom.xml      ruoyi-common     ruoyi-quartz  ry.bat
doc      README.md    ruoyi-framework  ruoyi-system  ry.sh
LICENSE  ruoyi-admin  ruoyi-generator  ruoyi-ui      sql

# 进行后端数据库与redis的配置
1.先配置连接redis服务
[root@git-server RuoYi-Vue]# cd ruoyi-admin/src/main/resources/
[root@git-server resources]# vim application.yml
# redis 配置
  redis:
    # 地址--MySQL的IP地址
    host: 10.31.162.39
    # 端口，默认为6379
    port: 6379
    # 密码
    password:
    
2.修改mysql
[root@git-server resources]# vim application-druid.yml
# 数据源配置
spring:
    datasource:
        type: com.alibaba.druid.pool.DruidDataSource
        driverClassName: com.mysql.cj.jdbc.Driver
        druid:
            # 主库数据源
            master:
                url: jdbc:mysql://10.31.162.39:3306/ry?useUnicode=true&characterEncoding=utf8&zeroDateTimeBehavior=convertToNull&useSSL=true&serverTimezone=GMT%2B8
                username: root
                password: QianFeng@123!
                
同时注意数据库连接这里是否启动加密连接，如果启用了加密连接有可能会造成代码与数据库连接不上。修改为:
&useSSL=false&

配置完成

#导入数据给创建的数据库里面
安装mysql客户端
[root@git-server ~]# yum install -y mysql
[root@git-server ~]# cd RuoYi-Vue/sql/
[root@git-server sql]# ls
quartz.sql  ry_20230223.sql
[root@git-server sql]# mysql -uroot -p'Qianfeng@123' -h 10.31.162.39 -D ry < quartz.sql 
[root@git-server sql]# mysql -uroot -p'Qianfeng@123' -h 10.31.162.39 -D  ry < ry_20230223.sql

开始创建版本库
[root@git-server ~]# mkdir /git-server
[root@git-server ~]# useradd git
[root@git-server ~]# passwd git
[root@git-server ~]# cd /git-server/
[root@git-server git-server]# git init --bare ryvue
Initialized empty Git repository in /git-server/ryvue/
[root@git-server git-server]# git init --bare ryjava
Initialized empty Git repository in /git-server/ryjava/
[root@git-server git-server]# chown git.git /git-server/ -R

在本机将两个仓库克隆下来进行代码提交：
[root@git-server ~]# ssh-keygen
[root@git-server ~]# ssh-copy-id git@10.31.162.125  与自己的git用户配置免密
[root@git-server ~]# git clone git@10.31.162.125:/git-server/ryvue/
Cloning into 'ryvue'...
warning: You appear to have cloned an empty repository.
[root@git-server ~]# git clone git@10.31.162.125:/git-server/ryjava
Cloning into 'ryjava'...
warning: You appear to have cloned an empty repository.

将代码提交到相应的代码库中
注:在这里没有办法区分前端和后端打包时需要的依赖，顾将所有代码都拷贝到两个版本库中。
[root@git-server ~]# cd ryvue/
[root@git-server ryvue]# cp -r /root/RuoYi-Vue/ruoyi-ui/* .
[root@git-server ryvue]# cd ../ryjava/
[root@git-server ryjava]# cp -r /root/RuoYi-Vue/* .
[root@git-server ryjava]# git add -A
[root@git-server ryjava]# git commit -m "add 1"
[root@git-server ryjava]# git push origin master

在编写后端的Dockerfile
[root@git-server ryjava]# cat Dockerfile 
FROM 10.31.162.124/myjdk/my-jdk:v1.0

WORKDIR /application/app

ADD ruoyi-admin/target/*.jar /application/app

EXPOSE 8080

ENTRYPOINT ["java","-jar","ruoyi-admin.jar"]

[root@git-server ryjava]# git add Dockerfile 
[root@git-server ryjava]# git commit -m "docker 1"
[master 76f71f4] docker 1
 1 file changed, 1 insertion(+), 1 deletion(-)
[root@git-server ryjava]# git push origin master
Counting objects: 5, done.
Compressing objects: 100% (3/3), done.
Writing objects: 100% (3/3), 294 bytes | 0 bytes/s, done.
Total 3 (delta 2), reused 0 (delta 0)
To git@192.168.209.160:/git-server/ryjava/
   2b539ad..76f71f4  master -> master

[root@git-server ryjava]# cd ../ryvue/
[root@git-server ryvue]# git add -A
[root@git-server ryvue]# git commit -m "add 2"
[root@git-server ryvue]# git push origin master

```

# 安装harbor仓库

```ini
10.31.162.124	haobor-server
安装docker
[root@harbor ~]# yum install -y yum-utils device-mapper-persistent-data lvm2
[root@harbor ~]# yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
[root@harbor ~]# yum install -y docker-ce
[root@harbor ~]# systemctl start docker && systemctl enable docker

[root@harbor ~]# wget https://storage.googleapis.com/harbor-releases/release-1.8.0/harbor-offline-installer-v1.8.0.tgz
[root@harbor ~]# yum -y install  lrzsz

[root@harbor ~]# curl -L https://github.com/docker/compose/releases/download/1.22.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose

[root@harbor ~]# chmod +x /usr/local/bin/docker-compose

[root@harbor ~]# tar xf harbor-offline-installer-v1.8.0.tgz

[root@harbor ~]# cd harbor

http访问方式的配置：
[root@harbor harbor]# vim harbor.yml #主机名要可以解析(需要部署dns服务器，用/etc/hosts文件没有用)，如果不可以解析，可以使用IP地址,需要修改的内容如下
hostname: 10.31.162.124

[root@harbor harbor]# ./install.sh  #需要等待下载镜像
[root@harbor-server harbor]# docker-compose up -d
浏览器访问测试：
http://10.31.162.124
用户名admin 密码:Harbor12345

[root@harbor harbor]# docker login -uadmin -p'Harbor12345' 10.31.162.124
```

# 创建项目仓库

![docker-ruoyi1.webp](/upload/docker-ruoyi1.webp)

# jenkins服务器

```ini
10.31.162.35	jenkinx-server
1.安装jenkins 略
2.配置jenkins免密连接git、nginx、java服务器--略

安装git命令
[root@jenkins-server ~]# yum install git -y
安装java打包命令
安装maven打包命令--可以安装在java目录里
设置java、maven变量--/etc/profile
[root@jenkins-server ~]# source /etc/profile
# 查看版本，验证变量是否变量
[root@jenkins-server ~]# mvn -v
Apache Maven 3.5.4 (1edded0938998edf8bf061f1ceb3cfdeccf443fe; 2018-06-

安装node.js前端打包工具命令npm
[root@jenkins-server ~]# wget https://a.xbd666.cn/d/Aliyun/Cloud_computing/Software_package/node-v14.15.3-linux-x64.tar.gz
[root@jenkins-server ~]# tar xf node-v14.15.3-linux-x64.tar.gz -C /usr/local/
[root@jenkins-server ~]# cd /usr/local/
[root@jenkins-server local]# mv node-v14.15.3-linux-x64/ node
[root@jenkins-server ~]# vim /etc/profile
NODE_HOME=/usr/local/node
PATH=$NODE_HOME/bin:$PATH
export NODE_HOME PATH
[root@jenkins-server ~]# source /etc/profile
[root@jenkins-server ~]# node -v
v12.18.4

安装docker
[root@jenkins-server ~]# yum install -y yum-utils device-mapper-persistent-data lvm2 git
[root@jenkins-server ~]# yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
[root@jenkins-server ~]# yum install -y docker-ce
启动并设置开机启动
[root@jenkins-server ~]# systemctl start docker && systemctl enable docker

配置jenkins连接harbor仓库
[root@jenkins-server ~]# vim /etc/docker/daemon.json
{
"insecure-registries": ["10.31.162.124"]
}
[root@jenkins-server ~]# systemctl restart docker 
[root@jenkins-server ~]# docker login 10.31.162.124 -uadmin
Password: Harbor12345
Login Succeeded

创建带有java环境的基础镜像
[root@jenkins-server ~]# mkdir java
将对应版本的jdk包上传到该目录中
[root@jenkins-server java]# cat Dockerfile 
FROM daocloud.io/library/centos:7
# 更新软件
RUN yum -y upgrade
# 安装中文包
RUN yum install -y kde-l10n-Chinese
# 重新安装glibc-common
RUN yum -y reinstall glibc-common
# 编译生成语言库
RUN localedef -c -f UTF-8 -i zh_CN zh_CN.utf8
# 设置语言默认值为中文，时区改为东八区
RUN echo 'LANG="zh_CN.UTF-8"' > /etc/locale.conf
RUN cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
ENV LANG zh_CN.UTF-8
ENV LC_ALL zh_CN.UTF-8
# jdk1.8.0_321和自己下载的版本一致
ENV JAVA_HOME /usr/local/jdk1.8.0_321
ENV PATH=$JAVA_HOME/bin:$JAVA_HOME/jre/bin:$PATH
ENV CLASSPATH=.:$JAVA_HOME/lib:$JAVA_HOME/jre/lib:$JAVA_HOME/lib/tools.jar
# jdk-8u321-linux-x64.tar.gz和自己下载的版本一致
ADD jdk-8u321-linux-x64.tar.gz /usr/local/

构建镜像
[root@jenkins-server java]# docker build -t my-jdk:v1.0 .
[root@jenkins-server java]# docker images
[root@jenkins-server java]# docker images
REPOSITORY                   TAG                 IMAGE ID            CREATED             SIZE
my-jdk                       v1.0                617a86a455e1        2 minutes ago  


[root@jenkins-server java]# docker tag my-jdk:v1.0 10.31.162.124/myjdk/my-jdk:v1.0
将基础镜像上传到harbor仓库
[root@jenkins-server java]# docker push 10.31.162.124/myjdk/my-jdk:v1.0


制作nginx基础镜像
[root@jenkins-server nginx]# cat nginx.repo 
[nginx-stable]
name=nginx stable repo
baseurl=http://nginx.org/packages/centos/$releasever/$basearch/
gpgcheck=0
enabled=1
gpgkey=https://nginx.org/keys/nginx_signing.key
module_hotfixes=true
[root@jenkins-server nginx]# cat Dockerfile 
FROM daocloud.io/library/centos:7
# 更新软件
RUN yum -y upgrade
# 安装中文包
RUN yum install -y kde-l10n-Chinese
# 重新安装glibc-common
RUN yum -y reinstall glibc-common
# 编译生成语言库
RUN localedef -c -f UTF-8 -i zh_CN zh_CN.utf8
# 设置语言默认值为中文，时区改为东八区
RUN echo 'LANG="zh_CN.UTF-8"' > /etc/locale.conf
RUN cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
ENV LANG zh_CN.UTF-8
ENV LC_ALL zh_CN.UTF-8

ADD nginx.repo /etc/yum.repos.d/
RUN yum install -y nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

[root@jenkins-server nginx]# docker build -t myningx:v1.0 .
[root@jenkins-server nginx]# docker tag myningx:v1.0 10.31.162.124/nginx/mynginx:v1.0
[root@jenkins-server nginx]# docker push 10.31.162.124/nginx/mynginx:v1.0
```

# 配置ssh连接前端服务器

## 配置前端服务器

`访问10.31.162.35:8080/jenkins`

![docker-ruoyi1.webp](/upload/docker-ruoyi2.webp)

![docker-ruoyi1.webp](/upload/docker-ruoyi3.webp)

# 创建后端构建任务

![docker-ruoyi1.webp](/upload/docker-ruoyi4.webp))

![docker-ruoyi1.webp](/upload/docker-ruoyi5.webp)

![docker-ruoyi1.webp](/upload/docker-ruoyi6.webp)

![docker-ruoyi1.webp](/upload/docker-ruoyi7.webp)

![docker-ruoyi1.webp](/upload/docker-ruoyi8.webp)

![docker-ruoyi1.webp](/upload/docker-ruoyi9.webp)

```ini
脚本内容提供：
docker build -t java-server:v1.0 .
docker tag java-server:v1.0  10.31.162.124/java-server/java-server:v1.0
docker login -u admin -p Harbor12345 192.168.209.166
docker push 192.168.209.166/java-server/java-server:v1.0 && docker rmi 10.31.162.124/java-server/java-server:v1.0
```

![docker-ruoyi1.webp](/upload/docker-ruoyi10.webp)

# 创建前端构建任务

![docker-ruoyi1.webp](/upload/docker-ruoyi11.webp)

![docker-ruoyi1.webp](/upload/docker-ruoyi12.webp)

![docker-ruoyi1.webp](/upload/docker-ruoyi13.webp)

```ini
前端脚本
#环境变量
echo $PATH
#进入jenkins workspace的项目目录
cd ${WORKSPACE}
#镜像选择淘宝的镜像
npm install --unsafe-perm --registry=https://registry.npm.taobao.org
#开始打包
npm run build:prod

#进入到打包目录
cd dist/
#删除上次打包生成的压缩文件
rm -rf *.tar.gz
#把生成的项目打包成压缩包方便传输到远程服务器
tar -zcvf `date +%F`.tar.gz *
#回到上层工作目录
cd ../
```

# 配置构建后操作

![docker-ruoyi1.webp](/upload/docker-ruoyi14.webp)

![docker-ruoyi1.webp](/upload/docker-ruoyi15.webp)

`保存返回面板，开始构建`

# 部署后端java服务

```ini
下载jocker
[root@java-server ~]# yum install -y yum-utils device-mapper-persistent-data lvm2
[root@java-server ~]# yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
[root@java-server ~]# yum install -y docker-ce
[root@java-server ~]# systemctl start docker && systemctl enable docker

配置连接harbor仓库地址
[root@java-server ~]# vim /etc/docker/daemon.json
{
"insecure-registries": ["10.31.162.124"]
}
[root@java-server ~]# systemctl restart docker

登陆仓库
[root@java-server ~]# docker login -u admin -p Harbor12345 10.31.162.124
下载镜像
[root@java-server ~]# docker pull 10.31.162.124/java-server/java-server:v1.0
[root@java-server ~]# docker images
REPOSITORY                                TAG       IMAGE ID       CREATED                  SIZE
192.168.209.166/java-server/java-server   v1.0      23d4017d23fc   Less than a second ago   725MB

[root@java-server ~]# docker run -itd --name java-server --restart=always --net host 10.31.162.124/java-server/java-server:v1.0
```

# 查看nginx服务器端口有没有起来

```ini
[root@nginx-server ~]# ss -lnpt		#查看80端口有没有起来
```

# 登入web测试

`访问 10.31.162.25`会出来偌依的界面

