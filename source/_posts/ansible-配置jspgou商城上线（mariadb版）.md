---
title: ansible 配置jspgou商城上线（mariadb版）
author: Mr.xu
date: 2025-11-06 20:58:35
tags:
---

## 准备实验环境，准备两台电脑

10.31.162.24----10.31.162.25
此实验配置的是----mariadb

关闭防火墙，关闭setenforce 0

## hosts解析

```shell
[root@ansible-server ~]# vim /etc/hosts
10.31.162.24    ansible-server
10.31.162.25    ansible-web
```

## 更改主机名

```shell
10.31.162.24
[root@ansible-server ~]# hostnamectl set-hostname ansible-server

10.31.162.25
[root@ansible-web ~]# hostnamectl set-hostname ansible-web
```

## 安装ansible

```shell
10.31.162.24
安装：控制节点
 1. 配置EPEL网络yum源
 [root@ansible-server ~]# yum install -y epel*
 2. 安装ansible
 [root@ansible-server ~]# yum install -y ansible
 3.查看版本
 [root@ansiable-server ~]# ansible --version
 4.查看配置文件：
[root@ansible-server ~]# rpm  -qc ansible
---1.主配置文件：/etc/ansible/ansible.cfg  #主要设置一些ansible初始化的信息，比如日志存放路径、模块、插件等配置信息
---2.主机清单文件:默认位置/etc/ansible/hosts
```

## 安装nginx

```shell
# 配置nginx源
[root@ansible-server ~]# vim /etc/yum.repos.d/nginx.repo
[nginx-stable]
name=nginx stable repo
baseurl=http://nginx.org/packages/centos/$releasever/$basearch/
gpgcheck=1
enabled=1
gpgkey=https://nginx.org/keys/nginx_signing.key
module_hotfixes=true
# 下载nginx
[root@ansible-server ~]# yum install -y nginx
[root@ansible-server ~]# systemctl start nginx
```

## 上传压缩包

```shell
将下载好的jdk、tomcat、jspgou，上传到server机器上
# 也可以直接官网下载
apache-tomcat-9.0.83.tar.gz
jdk-8u321-linux-x64.tar.gz
jspgouV6.1-ROOT.zip

# jspgou包是gz的包，需要解压重新压缩才可以用，只能用tar包
[root@ansible-server ~]# yum -y install unzip
[root@ansible-server ~]# unzip jspgouV6.1-ROOT.zip
[root@ansible-server ~]# ls
DB ROOT
[root@ansible-server ~]# tar zcvf jspgouv6.1.tar.gz DB ROOT
jspgouv6.1.tar.gz
```

## 添加主机

```shell
# 添加主机清单
[root@ansible-server ~]# vim /etc/ansible/hosts
[jspgou]
ansible-web

# 其他语法
1.添加主机或者主机组：
[root@ansible-server ~]# vim /etc/ansible/hosts  #在最后追加被管理端的机器
ansible-web1                      #单独指定主机，可以使用主机名称或IP地址
2.添加主机组：
[webservers]        #使用[]标签指定主机组 ----标签自定义
192.168.10.11        #如果未解析添加ip
ansible-web2      #解析添加主机名
3.组可以包含其他组：
[webservers1]     #组一
ansible-web1
[webservers2]     #组二
ansible-web2
[weball:children]      #caildren-照写 #weball包括两个子组
webservers1        #组一
webservers2        #组二
4.为一个组指定变量，组内每个主机都可以使用该变量：
[weball:vars]         #设置变量,vars--照写
ansible_ssh_port=22     
ansible_ssh_user=root   
ansible_ssh_private_key_file=/root/.ssh/id_rsa  
#ansible_ssh_pass=1      #也可以定义密码，如果没有互传秘钥可以使用密码。
```

## 配置ssh密钥

```shell
配置ssh公钥认证：控制节点需要发送ssh公钥给所有非被控制节点
[root@ansible-server ~]# ssh-keygen
[root@ansible-server ~]# ssh-copy-id -i 10.31.126.25  #所有机器
```

## 配置ansible剧本

```shell
# 在vars目录里配置file.yml配置文件
[root@ansible-server ~]# vim /etc/ansible/vars/file.yml
src_gou_path: /root/jspgouv6.1.tar.gz
src_jdk_path: /root/jdk-8u321-linux-x64.tar.gz
src_tomcat_path: /root/apache-tomcat-9.0.83.tar.gz
dest_gou_path: /root
dest_jdk_path: /root
dest_tomcat_path: /root

# 在ansible目录里配置jspgou.yml配置文件
[root@ansible-server ~]# vim /etc/ansible/jspgou.yml
- hosts: jspgou
  user: root
  vars_files:
  - /etc/ansible/vars/file.yml
  
  tasks:
  - name: configure jdk1
    copy: src={{ src_jdk_path }} dest={{ dest_jdk_path }}

  - name: unzip jdk
    unarchive: src={{ dest_jdk_path }}/jdk-8u321-linux-x64.tar.gz dest=/usr/local/ copy=no

  - name: rename java
    shell: mv /usr/local/jdk1.8.0_321 /usr/local/java

  - name: configure jdk envirement1
    shell: echo "JAVA_HOME=/usr/local/java" >> /etc/profile

  - name: configure jdk envirement2
    shell: echo 'PATH=$JAVA_HOME/bin:$PATH' >> /etc/profile

  - name: copy tomcat
    copy: src={{ src_tomcat_path }} dest={{ dest_tomcat_path }}

  - name: unzip tomcat
    unarchive: src={{ dest_tomcat_path }}/apache-tomcat-9.0.83.tar.gz dest=/usr/local/ copy=no

  - name: rename tomcat
    shell: mv /usr/local/apache-tomcat-9.0.83 /usr/local/tomcat

  - name: rm -rf webapps
    shell: rm -rf /usr/local/tomcat/webapps/*

  - name: add /etc/profile
    shell: sed -i "2i source /etc/profile" /usr/local/tomcat/bin/startup.sh

  - name: add /etc/profile to shutdown.sh
    shell: sed -i "2i source /etc/profile" /usr/local/tomcat/bin/shutdown.sh

  - name: copy jspgou
    copy: src={{ src_gou_path }} dest={{ dest_gou_path }}

  - name: unzip jspgou
    unarchive: src={{ dest_gou_path }}/jspgouv6.1.tar.gz dest=/usr/local/tomcat/webapps copy=no

  - name: install mariadb
    shell: yum -y install mariadb mariadb-server

  - name: start mariadb
    shell: systemctl start mariadb && systemctl enable mariadb

  - name: start mysql1
    shell: mysqladmin -uroot password "666888"

  - name: enter mariadb
    shell: mysql -uroot -p'666888' -e "create database jspgou default charset=utf8;"

  - name: edit mysqld
    shell: sed -i 's/jdbc.password=/jdbc.password=666888/' /usr/local/tomcat/webapps/ROOT/WEB-INF/config/jdbc.properties

  - name: append mysql
    shell: echo "max_allowed_packet= 64m" >> /etc/my.cnf

  - name: append mysql1
    shell: echo "sql_mode=STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUB" >> /etc/my.cnf

  - name: append mysql2
    shell: echo "explicit_defaults_for_timestamp=1" >> /etc/my.cnf

  - name: restart mariadb
    shell: systemctl restart mariadb

  - name: Import data
    shell: mysql -uroot -p"666888" -D jspgou < /usr/local/tomcat/webapps/DB/jspgou.sql

  - name: restart mysql
    shell: systemctl restart mariadb
    notify: start jspgou
  handlers:

  - name: start jspgou
    shell: nohup /usr/local/tomcat/bin/startup.sh &
```

# 启动
```
[root@ansible ansible]# ansible-playbook jspgou.yml
```

# 配置nginx代理

```shell
# 备份原有配置文件
[root@ansible-server ~]#  cp default.conf default.conf.bak
# 添加jspgou.conf配置文件
[root@ansible-server ~]#  vim /etc/nginx/conf.d/jspgou.conf 
server {
    listen       80;
    server_name  localhost;

    location / {
        proxy_pass http://10.31.162.25:8080;
        proxy_set_header Host $host:$server_port;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

}
# 重启nginx
[root@ansible-server ~]#  systemctl restart nginx
```

## 测试

```shell
打开网址输入10.31.162.24----会出来jspgou商城界面
```

![jspgou1.png](https://xbd666.cn/upload/jspgou1.png)