---
title: docker--harbor私有仓库部署
author: Mr.xu
date: 2025-11-06 20:52:23
tags:
---

## 部署harbor--方式一
`部署环境  关闭防火墙`
## 下载harbor包

```ini
wget https://a.xbd666.cn/d/Aliyun/Cloud_computing/Software_package/docker/harbor-online-installer-v2.10.0.tgz
```
## 下载docker-compose

```ini
curl -L https://github.com/docker/compose/releases/download/1.22.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
```
## 授权

```ini
[root@iZ8vb3lp570ckxi53yb66gZ ~]# chmod +x /usr/local/bin/docker-compose
```
## 解压

```ini
[root@kub-k8s-master ~]# tar xf harbor-offline-installer-v1.8.0.tgz
[root@kub-k8s-master ~]# cd harbor
```
## http访问方式的配置：

```ini
[root@kub-k8s-master harbor]# cp harbor.yml.tmpl  harbor.yml
[root@kub-k8s-master harbor]# vim harbor.yml #使用IP地址,需要修改的内容如下
hostname: 192.168.246.166  #改成自己的ip
注释443的模块

[root@kub-k8s-master harbor]# ./prepare  #需要等待下载镜像
						或   ./install.sh
```

## docker-compose 使用

```ini
[root@kub-k8s-master harbor]# docker-compose up -d  #放后台

[root@kub-k8s-master harbor]# docker-compose down #停止服务
```

## 浏览器访问测试：
`http://10.31.162.25`   
`账号admin  密码Harbor12345`

## 设置域名

```
配置域名，并通过反向代理docker客户端
1、网站--创建网站--定义域名
2、网站--证书--申请证书
3、网站--创建好的网站--HTTPS--启用 HTTPS
```

## 上传镜像

```ini
# 在终端上登入
docker login IP地址

推送
#在项目中标记镜像：
现在终端上给要上传的镜像打标记tag
[root@localhost ~]#docker tag mysql：5.7 har.xbd666.cn/qingfeng/mysql：5.7
#推送到仓库
[root@localhost ~]#docker push 120.27.128.132:81/qingfeng/REPOSITORY[:TAG]

# 备注
如果出现413
error parsing HTTP 413 response body: invalid character '<' looking for beginning of value
回到1panel上做设置
1panel网址--网站--设置--性能调优--client_max_body_size（这里改成0）
或者 在nginx配置文件里更改最大上传文件大小值
```

## 下载镜像
```
[root@localhost ~]# docker push har.xbd666.cn/qingfeng/mysql：5.7
```

![harbor1.webp](https://xbd666.cn/upload/harbor1.webp)

## 部署harbor--方式二

## 构建环境

```ini
systemctl stop firewalld
setenforce 0
yum -y install vim wget net-tools lrzsz 
```

## 下载docker

```ini
#删除已安装的Docker
[root@localhost ~]# yum remove docker \
docker-client \
docker-client-latest \
docker-common \
docker-latest \
docker-latest-logrotate \
docker-logrotate \
docker-selinux \
docker-engine-selinux \
docker-engine

#配置阿里云Docker Yum源
[root@localhost ~]# yum install -y yum-utils device-mapper-persistent-data lvm2
[root@localhost ~]# yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

#查看docker版本
[root@localhost ~]# yum list docker-ce --showduplicates
或
docker -v  或  dockers version

#安装Docker新版本或指定版本号
[root@localhost ~]# yum install -y docker-ce
或 
yum install docker-ce-18.03.0.ce  -y

#启动Docker服务：
[root@localhost ~]# systemctl start docker && systemctl enable docker
```

## 配置Docker 加速器 

```ini
[root@localhost ~]# vim /etc/docker/daemon.json
{
"registry-mirrors": ["https://br003st4.mirror.aliyuncs.com"]
}
[root@localhost ~]# systemctl daemon-reload
[root@localhost ~]# systemctl restart docker
```

## 部署私有仓库--harbor

```ini
cwget https://a.xbd666.cn/d/Aliyun/Cloud_computing/Software_package/docker/harbor-offline-installer-v1.8.0.tgz

#下载docker-compose
[root@localhost ~]# curl -L https://github.7boe.top/https://github.com/docker/compose/releases/download/1.22.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose

# 给予执行权限
#[root@localhost ~]# mv docker-compose-Linux-x86_64 docker-compose
[root@localhost ~]# chmod +x /usr/local/bin/docker-compose

# 解压harbor仓库
[root@localhost ~]# tar xf harbor-offline-installer-v1.8.0.tgz
[root@localhost ~]# cd harbor

# http访问方式的配置：
[root@localhost harbor]# vim harbor.yml		#使用IP地址,需要修改的内容如下
hostname: 10.31.162.39  #改成自己的ip
#注释443的模块

[root@localhost harbor]# ./install.sh  #需要等待下载镜像
							或  ./prepare 
							
# docker-compose 使用
#[root@localhost harbor]#docker-compose up -d  #放后台
#[root@localhost harbor]#docker-compose down #停止服务
```

## 浏览器访问测试：
`http://10.31.162.39`

然后在web界面新建项目，自定义名字

## 客户端配置连接仓库地址

```ini
[root@localhost ~]# vim /etc/docker/daemon.json
{
"insecure-registries": ["39.98.169.219"]  #仓库的ip地址 
}	#在镜像加速器下面添加时，要做镜像加速器代码后面添加逗号（,）作为分割

[root@localhost ~]# systemctl restart docker
[root@localhost ~]# docker-compose up -d #启动harbor仓库
```

## 终端登入仓库

```ini
[root@localhost ~]# docker login 10.31.162.39
Username: admin
Password: Hardor12345
Login Succeeded  	#代表登入成功

# 将生成的jspgou镜像上传到仓库中
先打标签
[root@localhost ~]# docker tag nginx:latest 10.31.162.39/qingfeng/nginx:1.1
上传镜像
[root@localhost ~]# docker push 10.31.162.39/qingfeng/nginx:1.1
```

![harbor2.webp](/upload/harbor2.webp)