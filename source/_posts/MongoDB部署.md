---
title: MongoDB部署
author: Mr.xu
date: 2025-11-06 16:11:37
tags:
---

### MongoDB

#### 作用

MongoDB 是一种开源的文档型 NoSQL 数据库，采用 BSON（二进制 JSON）格式存储数据。以下是 MongoDB 的主要作用和用途：

1. **灵活的数据模型**:
   - MongoDB 使用文档存储数据，文档之间可以有不同的结构。这种灵活性使得 MongoDB 非常适合处理不规则和变化频繁的数据。

2. **大数据和实时分析**:
   - MongoDB 的高性能和扩展性使其适合处理大数据和实时分析应用。它能够快速存储和查询大量数据，并支持实时数据处理。

3. **内容管理和目录服务**:
   - MongoDB 常用于内容管理系统（CMS）和目录服务，适合存储和管理大量的文档、图像、视频等非结构化数据。

4. **物联网（IoT）和传感器数据**:
   - 由于 MongoDB 可以高效地存储和处理大量的时间序列数据，它非常适合物联网应用中的传感器数据存储和分析。

5. **移动应用和社交网络**:
   - MongoDB 的灵活性和高性能使其成为移动应用和社交网络的理想选择，能够处理用户生成的内容、用户个人资料、消息和活动流等数据。

6. **电子商务**:
   - 在电子商务平台中，MongoDB 可以用于存储产品目录、用户数据、订单信息等，并支持复杂的查询和数据分析。

7. **日志和事件存储**:
   - MongoDB 可以用于存储和分析日志数据和事件数据，适用于日志管理、监控和审计等场景。

8. **地理空间数据**:
   - MongoDB 提供了强大的地理空间查询功能，可以存储和查询地理位置数据，适用于地图服务、定位服务等应用。

9. **分布式文件存储**:
   - MongoDB 的 GridFS 功能允许存储和检索大文件，如图像、视频和音频文件，适合作为分布式文件存储系统。

10. **高可用性和扩展性**:
    - MongoDB 支持复制集和分片机制，能够实现数据的高可用性和水平扩展，适合大规模分布式系统。

11. **快速开发和迭代**:
    - 由于 MongoDB 的模式灵活性，开发人员可以快速进行数据模型的修改和应用程序的迭代，适合敏捷开发和快速原型设计。

MongoDB 的文档存储模型、灵活性、高性能和扩展性使其成为现代应用程序中处理多样化和大规模数据的理想选择。

#### 资源需求

- **CPU**:  4 核 
- **内存**: 32GB 
- **存储**: 500G
- **节点**：1

#### 网络端口

- **默认端口**

  - **端口号**: 27017

  - **用途**: MongoDB 默认的客户端连接端口，用于应用程序和用户连接到 MongoDB 数据库进行数据操作。

- **副本集成员之间的通信端口**
  - **端口号**: 27017（默认）
  - **用途**: 副本集成员之间通过该端口进行数据同步和心跳检测。
- **分片集群配置服务器端口**
  - **端口号**: 27019
  - **用途**: 分片集群中的配置服务器使用的默认端口。
- **分片服务器端口**
  - **端口号**: 27018

#### 安装部署
```
# 下载安装包
wget https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel70-4.0.6.tgz
curl -O https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel70-3.4.24.tgz

[root@localhost ~]# ls
anaconda-ks.cfg  mongodb-linux-x86_64-rhel70-4.0.6.tgz
[root@localhost ~]# systemctl stop friewalld
Failed to stop friewalld.service: Unit friewalld.service not loaded.
[root@localhost ~]# setenforce 0
[root@localhost ~]# systemctl disable firewalld
Removed symlink /etc/systemd/system/multi-user.target.wants/firewalld.service.
Removed symlink /etc/systemd/system/dbus-org.fedoraproject.FirewallD1.service.

[root@localhost ~]# ulimit -n
1024
[root@localhost ~]# ulimit -n 65535
[root@localhost ~]# ulimit -n
65535
[root@localhost ~]# ulimit -u
63447
[root@localhost ~]# ulimit -u 65535
[root@localhost ~]# ulimit -u
65535
[root@localhost ~]# vim  /etc/rc.local 
[root@localhost ~]# ls
anaconda-ks.cfg  mongodb-linux-x86_64-rhel70-4.0.6.tgz

[root@worker02 ~]# mkdir /data/mongodb
[root@worker02 ~]# tar xzf mongodb-linux-x86_64-rhel70-4.0.6.tgz -C /data/mongodb/
[root@worker02 mongodb]# mv mongodb-linux-x86_64-rhel70-4.0.6/ mongodb

[root@worker02 mongodb]# ln -s /data/mongodb/mongodb/bin/* /bin/

[root@worker02 mongodb]# mkdir  data
[root@worker02 mongodb]# mkdir logs
[root@worker02 mongodb]# touch logs/mongodb.log

[root@worker02 mongodb]# ls
data  logs  mongodb
[root@worker02 mongodb]# mkdir conf
[root@worker02 mongodb]# vim conf/mongodb.conf
# 添加以下内容
port=27017
dbpath=/data/mongodb/data
logpath=/data/mongodb/logs/mongodb.log
logappend=true
fork=true
maxConns=5000
# 将存储引擎切换为 WiredTiger
storageEngine=wiredTiger  
# 绑定到所有 IP 地址
bind_ip=0.0.0.0  
# 启用访问控制
auth=true

# 启动
[root@worker02 mongodb]# /data/mongodb/mongodb/bin/mongod -f /data/mongodb/conf/mongodb.conf 
about to fork child process, waiting until server is ready for connections.
forked process: 1834
[root@localhost mongodb]#  netstat -lnpt | grep mongod
tcp        0      0 127.0.0.1:27017         0.0.0.0:*               LISTEN      1834/mongod
[root@localhost mongodb]# ps aux | grep mongod | grep -v grep
root      1834 24.7  0.5 1502384 96948 ?       Sl   5月27   1:41 /usr/local/mongodb/bin/mongod -f /usr/local/mongodb/conf/mongodb1.conf
设置开机自动启动
[root@mongodb mongodb]# vim /etc/rc.local
rm -f /data/mongodb1/mongod.lock
mongod -f /usr/local/mongodb/conf/mongodb1.conf
[root@localhost mongodb]# mongo
MongoDB shell version v4.0.6
connecting to: mongodb://127.0.0.1:27017/?gssapiServiceName=mongodb
Implicit session: session { "id" : UUID("be032cef-e2b3-4856-927c-0a560a40d1fd") }
MongoDB server version: 4.0.6
Welcome to the MongoDB shell.


> show dbs
admin   0.078GB
config  0.078GB
local   0.078GB
> exit
```
```
报错处理：
dmesg | grep -i watchdog
journalctl -k | grep -i watchdog
vim /etc/sysctl.conf
添加以下内容
kernel.watchdog_thresh = 60
#使其生效
 sysctl -p
#启动
/data/mongodb/mongodb/bin/mongod -f /data/mongodb/conf/mongodb.conf 

# 可做可不做--作用是禁用透明大页
vim /etc/default/grub
添加以下内容
GRUB_CMDLINE_LINUX="... transparent_hugepage=never"
