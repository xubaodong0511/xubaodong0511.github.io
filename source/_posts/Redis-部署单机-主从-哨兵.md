---
title: Redis 部署单机-主从-哨兵模式
author: Mr.xu
date: 2025-11-06 21:01:27
tags:
---

**Redis**

**1、安装单机版redis**

**官网下载redis**

```shell
https://redis.io/
```

**点击download，往下拉，找到以下内容**

```shell
List of all releases and hash digests
You can find a listing of all previous Redis releases on the releases page. SHA-256 digests for these downloads are available in the redis-hashes git repository.

 listing of all previous Redis releases --> 点击此内容-->进入选取想要的版本（学习实验用的7.0.9版本）
```

**下载**

```shell
[root@localhost ~]# wget https://download.redis.io/releases/redis-7.0.9.tar.gz		//7.0.9版本的
# 指定解压路径
[root@localhost ~]# tar zxvf redis-7.0.9.tar.gz -C /usr/loval
# cd到/usr/loval/redis，改名
[root@localhost redis]# mv redis-7.0.9 redis
# 下载编译工具
[root@localhost redis]# yum -y install gcc make
# 编译
[root@localhost redis]# make
# 注：如果报错请将刚才解压的安装包删除掉，再次重新解压并进行make安装即可
#编辑配置文件，vim redis.conf
[root@localhost redis]# vim redis.conf
bind 192.168.246.202　　#只监听内网IP
daemonize yes　　　　　#开启后台模式将no改为yes
port 6379                      #端口号
dir /usr/local/redis/data　　#本地数据库存放持久化数据的目录该目录-----需要存在
protected-mode yes 	//开启密码，默认是yes，可以改no
requirepass 1122334 #设置密码
logfile "/var/log/redis.log"  #设置日志存放路径与日志名
创建存放数据的目录
# 创建持久化目录
[root@localhost redis]# mkdir data
# 启动redis
[root@localhost redis]# src/redis-server redis.conf
# 查看端口
[root@localhost redis]# netstat -lnpt
# 登入redis
[root@localhost redis]# src/redis-cli -h 192.168.116.111 -p 6379
192.168.116.111:6379> ping		// ---测试redis是否可以用
PONG
192.168.116.111:6379>
## 单机版redsi已经部署完成。将ip和端口发给开发就可以了。
```

**2、数据持久化**

```shell
# 关闭redis
[root@localhost redis]# pkill redis
# 查看端口
[root@localhost redis]# netstat -lnpt
# 启动
[root@localhost redis]# src/redis-server redis.conf
# 登入
[root@localhost redis]# src/redis-cli -h 192.168.116.111 -p 6379
192.168.116.111:6379> keys *
(empty array)
192.168.116.111:6379> set name qingfeng
OK
192.168.116.111:6379> set age 18
OK
192.168.116.111:6379> keys *	//查看所有
1) "age"
2) "name"
192.168.116.111:6379> bgsave	//数据持久化命令
Background saving started
192.168.116.111:6379> exit
[root@localhost redis]# cd data
[root@localhost data]# ls		//在data目录下会生成一个数据文件
dump.rdb

# 此时在另一台机器上下载号redis，把数据复制到另一台机器上
# 注意 redis下载好先不要启动，把数据复制过来在启动
scp dump.rdb 192.168.116.131:/usr/local/redis/data
# 此时启动，数据持久化完成了
```

**3、主从配置**

> 配置主从配置要保证所有机器的数据一样
>
> ##### 设置主机名
>
> redis-master----192.168.116.111
> redis-slave-1-----192.168.116.131
> redis-slave-2-----192.168.116.132

**设置配置文件**

```shell
master
[root@redis-master ~]# cd /usr/local/redis/
[root@redis-master redis]# vim redis.conf
#bind 192.168.116.111注释了
bind 0.0.0.0

# 关闭，并重启服务
[root@redis-master redis]# pkill redis
[root@redis-master redis]# src/redis-server redis.conf
# 登入，bind设置的0.0.0.0，所以命令不用跟IP和端口
[root@redis-master redis]# src/redis-cli
127.0.0.1:6379> ping
PONG
127.0.0.1:6379> set name qingfeng
OK
127.0.0.1:6379> get name
"qingfeng"
127.0.0.1:6379> info replication	//查看复制状态，详细信息
# Replication
role:master
connected_slaves:2
slave0:ip=192.168.116.131,port=6379,state=online,offset=564,lag=1
slave1:ip=192.168.116.132,port=6379,state=online,offset=564,lag=1
master_failover_state:no-failover
master_replid:4111015d2d43dfe9b0553c0bb19389c95c7976c7
master_replid2:0000000000000000000000000000000000000000
master_repl_offset:564
second_repl_offset:-1
repl_backlog_active:1
repl_backlog_size:1048576
repl_backlog_first_byte_offset:1
repl_backlog_histlen:564
127.0.0.1:6379> exit
```

```shell
slave-1
# 拷贝
scp 192.168.116.111:/root/redis-7.0.9.tar.gz /root
# 指定解压路径
[root@localhost ~]# tar zxvf redis-7.0.9.tar.gz -C /usr/loval
# cd到/usr/loval/redis，改名
[root@localhost redis]# mv redis-7.0.9 redis
[root@localhost redis]# yum -y install gcc make
# 编译
[root@localhost redis]# make
# 编辑配置文件
[root@redis-master redis]# vim redis.conf
#bind 192.168.116.111注释了
bind 0.0.0.0
protected-mode no	//yes改no，设置密码的
replicaof 192.168.116.111 	//添加master的内网和端口

# 启动，如果已经启动过了，需要关闭redis重新启动
[root@redis-slave-1 redis]# src/redis-server redis.conf
# 登入，bind设置的0.0.0.0，所以命令不用跟IP和端口
[root@redis-slave-1 redis]# src/redis-cli

# 此时输入命令可以看到master创建的数据了
127.0.0.1:6379> get name
"qingfeng"
127.0.0.1:6379> info replication
# Replication
role:slave
master_host:192.168.116.111
master_port:6379
master_link_status:up
master_last_io_seconds_ago:10
master_sync_in_progress:0
slave_read_repl_offset:802
slave_repl_offset:802
slave_priority:100
slave_read_only:1
replica_announced:1
connected_slaves:0
master_failover_state:no-failover
master_replid:4111015d2d43dfe9b0553c0bb19389c95c7976c7
master_replid2:0000000000000000000000000000000000000000
master_repl_offset:802
second_repl_offset:-1
repl_backlog_active:1
repl_backlog_size:1048576
repl_backlog_first_byte_offset:15
repl_backlog_histlen:788
127.0.0.1:6379> exit
```

```shell
slave-2
# 拷贝
scp 192.168.116.111:/root/redis-7.0.9.tar.gz /root
# 指定解压路径
[root@localhost ~]# tar zxvf redis-7.0.9.tar.gz -C /usr/loval
# cd到/usr/loval/redis，改名
[root@localhost redis]# mv redis-7.0.9 redis
[root@localhost redis]# yum -y install gcc make
# 编译
[root@localhost redis]# make
# 编辑配置文件
[root@redis-master redis]# vim redis.conf
#bind 192.168.116.111注释了
bind 0.0.0.0
protected-mode no	//yes改no，设置密码的
replicaof 192.168.116.111 	//添加master的内网和端口

# 启动，如果已经启动过了，需要关闭redis重新启动
[root@redis-slave-2 redis]# src/redis-server redis.conf
[root@redis-slave-2 redis]# src/redis-cli
127.0.0.1:6379> get name
"qingfeng"
127.0.0.1:6379> info replication
# Replication
role:slave
master_host:192.168.116.111
master_port:6379
master_link_status:up
master_last_io_seconds_ago:6
master_sync_in_progress:0
slave_read_repl_offset:816
slave_repl_offset:816
slave_priority:100
slave_read_only:1
replica_announced:1
connected_slaves:0
master_failover_state:no-failover
master_replid:4111015d2d43dfe9b0553c0bb19389c95c7976c7
master_replid2:0000000000000000000000000000000000000000
master_repl_offset:816
second_repl_offset:-1
repl_backlog_active:1
repl_backlog_size:1048576
repl_backlog_first_byte_offset:295
repl_backlog_histlen:522
127.0.0.1:6379> exit
```

`此时主从同步部署完成`

**4、redis-sentinel---哨兵模式**

```shell
# 每台机器上修改redis主配置文件redis.conf文件设置：bind 0.0.0.0

# 修改配置文件
[root@redis-master redis]# vim sentinel.conf
daemonize yes #设置哨兵放后台运行
logfile "/var/log/sentinel.log" #设置哨兵日志
sentinel monitor mymaster 10.0.0.137 6379 2 #当集群中有2个sentinel认为master死了时，才能真正认为该master已经不可用了。 (slave上面写的是master的ip，master写自己ip)
sentinel auth-pass mymaster 1122334 #如果设置了密码那就需要指定密码，否则不需要
sentinel down-after-milliseconds mymaster 3000   #单位毫秒
sentinel failover-timeout mymaster 10000   #若sentinel在该配置值内未能完成failover(故障转移)操作（即故障时master/slave自动切换），则认为本次failover失败。

protected-mode no  #关闭加密模式--新添加到sentinel配置文件中  ----老版本中需需要添加

# 启动
[root@redis-master redis]# pkill redis
[root@redis-master redis]# src/redis-sentinel sentinel.conf
[root@redis-master redis]# src/redis-server redis.conf
# 测试
[root@redis-slave-1 redis]# src/redis-cli
127.0.0.1:6379> ping
PONG
127.0.0.1:6379> info replication
# Replication
role:master
master_host:192.168.116.111
master_port:6379
master_link_status:up
master_last_io_seconds_ago:0
master_sync_in_progress:0
slave_read_repl_offset:25387
slave_repl_offset:25387
slave_priority:100
slave_read_only:1
replica_announced:1
connected_slaves:0
master_failover_state:no-failover
master_replid:d09a4de58ff9c3e7f5c4e9fe7c39f5a7f7b7861c
master_replid2:4111015d2d43dfe9b0553c0bb19389c95c7976c7
master_repl_offset:25387
second_repl_offset:4205
repl_backlog_active:1
repl_backlog_size:1048576
repl_backlog_first_byte_offset:15
repl_backlog_histlen:25373
```

`此时哨兵模式部署完成`


