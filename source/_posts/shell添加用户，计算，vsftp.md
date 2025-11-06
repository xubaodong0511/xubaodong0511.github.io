---
title: shell添加用户，计算，vsftp实验
author: Mr.xu
date: 2025-11-06 21:13:49
tags:
---

**vim user.sh（添加用户）**
```shell
#!/bin/bash
#该脚本为添加用户zhangsan，并给他设置密码
#date：2023-11-14
#author：xubaodong
#创建用户
useradd zhangsan
#变量
name=zhangsan
echo "qianfeng@123" | passwd --stdin $name && echo "密码设置完成"
```
**vim compute.sh（计算）**
```shell
#!/bin/bash
#该脚本用于计算
#date：2023-11-14
#author：xubaodong
read -p "请输入第一个数字" num1
read -p "请输入第二个数字" num2
echo $[num1 + num2] && echo $[num1 - num2] && echo $[num1 * num2] && echo $[num1 / num2]
```
**vsftp_client.sh（客户端）**
```shell
#!/bin/bash
#该脚本用于ftp客户端
#date：2023-11-14
#author：xubaodong
#关闭防火墙，文件防火墙
systemctl stop firewalld
systemctl disable firewalld
setenforce 0
#下载vsftp，lftp
yum -y install vsftpd
yum -y install lftp
#给pub满权限
chmod 777 /var/ftp/pub
#启动服务
systemctl start vsftpd
systemctl restart vsftpd
#连接服务端
lftp 10.21.162.172
cd /var/ftp/pub
put aaa
```


**vsftp_server.sh（服务端）**
```shell
#!/bin/bash
#该脚本用于ftp服务端
#date：2023-11-14
#author：xubaodong
#关闭防火墙，文件防火墙
systemctl stop firewalld
systemctl disable firewalld
setenforce 0
#下载vsftp,lftp
yum -y install vsftpd
#下载vsftp，lftp
#读写权限追加到配置文件
cat >> /etc/vsftpd/vsftpd.conf << EOF
anon_upload_enable=YES
anon_mkdir_write_enable=YES
EOF
#给pub满权限
chmod 777 /var/ftp/pub
#启动服务
systemctl start vsftpd
systemctl restart vsftpd`
```