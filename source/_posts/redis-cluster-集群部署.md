---
title: redis-cluster 集群部署
author: Mr.xu
date: 2025-11-06 21:00:56
tags:
---

**redis-cluster集群**

准备环境

**准备3台机器，关闭防火墙和selinux**

```shell
# 注:规划架构两种方案，一种是单机多实例，这里我们采用多机器部署:
三台机器，每台机器上面两个redis实例，一个master一个slave，第一列做主库，第二列做备库
#记得选出控制节点

[root@localhost ~]# vim /etc/hosts
redis-cluster1 192.168.116.111 7000 7001
redis-cluster2 192.168.116.131 7002 7003
redis-cluster3 192.168.116.132 7004 7005

# 修改主机名
[root@localhost ~]# hostnamectl set-hostname redis-cluster1
[root@localhost ~]# hostnamectl set-hostname redis-cluster2
[root@localhost ~]# hostnamectl set-hostname redis-cluster3
```

**三台机器相同的操作**

```shell
# 安装redis依赖环境
[root@redis-cluster1 ~]# yum -y install gcc automake autoconf libtool make
# 官方下载redis，这里用的是6.2的版本
[root@redis-cluster1 ~]# wget https://download.redis.io/releases/redis-6.2.0.tar.gz
# 创建目录、并指定路径解压软件包
[root@redis-cluster1 ~]# mkdir /data
[root@redis-cluster1 ~]# tar xzvf redis-6.2.0.tar.gz -C /data/
# 切换目录
[root@redis-cluster1 ~]# cd /data/
# 修改目录名
[root@redis-cluster1 data]# mv redis-6.2.0/ redis
# 进入redis目录
[root@redis-cluster1 data]# cd redis/
# 编译
[root@redis-cluster1 redis]# make
# 创建存放数据的目录
[root@redis-cluster1 redis]# mkdir /data/redis/data 
```

**创建节点目录**

```shell
# 创建节点目录:按照规划在每台redis节点的安装目录中创建对应的目录（以端口号命名）

# redis-cluster1
[root@redis-cluster1 redis]# pwd
/data/redis
[root@redis-cluster1 redis]# mkdir cluster #创建集群目录
[root@redis-cluster1 redis]# cd cluster/
[root@redis-cluster1 cluster]# mkdir 7000 7001 #创建节点目录

# redis-cluster2
[root@redis-cluster2 redis]# mkdir cluster
[root@redis-cluster2 redis]# cd cluster/
[root@redis-cluster2 cluster]# mkdir 7002 7003

# redis-cluster3
[root@redis-cluster3 redis]# mkdir cluster
[root@redis-cluster3 redis]# cd cluster/
[root@redis-cluster3 cluster]# mkdir 7004 7005
```

**修改集群每个redis配置文件**

```shell
# redis-cluster1
[root@redis-cluster1 cluster]# cp /data/reids/redis.conf ./7000
[root@redis-cluster1 cluster]# ls
7000  7001
[root@redis-cluster1 cluster]# vim ./7000/redis.conf
[root@redis-cluster1 cluster]# cp ./7000/redis.conf ./7001/
[root@redis-cluster1 cluster]# vim ./7001/redis.conf

# 修改内容如下
bind 192.168.116.172  #每个实例的配置文件修改为对应节点的ip地址
protected-mode no	#关闭密码服务
port 7000   #监听端口，运行多个实例时，需要指定规划的每个实例不同的端口号
daemonize yes #redis后台运行
pidfile /var/run/redis_7000.pid #pid文件，运行多个实例时，需要指定不同的pid文件
logfile /var/log/redis_7000.log #日志文件位置，运行多实例时，需要将文件修改的不同。
dir /data/redis/data #存放数据的目录
appendonly yes #开启AOF持久化，redis会把所接收到的每一次写操作请求都追加到appendonly.aof文件中，当redis重新启动时，会从该文件恢复出之前的状态。
appendfilename "appendonly.aof"  #AOF文件名称
appendfsync everysec #表示对写操作进行累积，每秒同步一次
以下为打开注释并修改
cluster-enabled yes #启用集群
cluster-config-file nodes-7000.conf #集群配置文件，由redis自动更新，不需要手动配置，运行多实例时请注修改为对应端口
cluster-node-timeout 5000 #单位毫秒。集群节点超时时间，即集群中主从节点断开连接时间阈值，超过该值则认为主节点不可以，从节点将有可能转为master
cluster-replica-validity-factor 10 #在进行故障转移的时候全部slave都会请求申请为master，但是有些slave可能与master断开连接一段时间了导致数据过于陈旧，不应该被提升为master。该参数就是用来判断slave节点与master断线的时间是否过长。
cluster-migration-barrier 1 #一个主机将保持连接的最小数量的从机，以便另一个从机迁移到不再被任何从机覆盖的主机
cluster-require-full-coverage yes #集群中的所有slot（16384个）全部覆盖，才能提供服务

#注：
所有节点配置文件全部修改切记需要修改的ip、端口、pid文件...避免冲突。确保所有机器都修改。
```

**redis-cluster2----redis-cluster3**

```shell
redis-cluster2----redis-cluster3
重复redis-cluster1步骤操作
```

**启动三台机器上面的每个节点(三台机器相同操作)**

```shell
[root@redis-cluster1 ~]# cd /data/redis/src/
[root@redis-cluster1 src]# ./redis-server ../cluster/7000/redis.conf 
[root@redis-cluster1 src]# ./redis-server ../cluster/7001/redis.conf

[root@redis-cluster2 7003]# cd /data/redis/src/
[root@redis-cluster2 src]# ./redis-server ../cluster/7002/redis.conf 
[root@redis-cluster2 src]# ./redis-server ../cluster/7003/redis.conf

[root@redis-cluster3 7005]# cd /data/redis/src/
[root@redis-cluster3 src]# ./redis-server ../cluster/7004/redis.conf 
[root@redis-cluster3 src]# ./redis-server ../cluster/7005/redis.conf

# 注意 如果没有报错，但是就是启动不了，看不到端口，把配置文件里的dir路径写相对路径
```

**查看端口**

```shell
# 每个机器上都可以看下端口有没有起来
[root@redis-cluster1 reids]# netstat -lnpt
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
tcp        0      0 192.168.116.111:7000    0.0.0.0:*               LISTEN      16191/src/redis-ser
tcp        0      0 192.168.116.111:7001    0.0.0.0:*               LISTEN      16197/src/redis-ser
tcp        0      0 127.0.0.1:25            0.0.0.0:*               LISTEN      1137/master
tcp        0      0 192.168.116.111:17000   0.0.0.0:*               LISTEN      16191/src/redis-ser
tcp        0      0 192.168.116.111:17001   0.0.0.0:*               LISTEN      16197/src/redis-ser
```

**创建集群：在其中一个节点操作就可以**

```shell
redis节点搭建起来后，需要完成redis cluster集群搭建，搭建集群过程中，需要保证6个redis实例都是运行状态。
Redis是根据IP和Port的顺序，确定master和slave的，所以要排好序，再执行。

参数:
--cluster-replicas 1:表示为集群中的每个主节点创建一个从节点.书写流程:主节点ip+port 对应一个从节点ip+port（正常是前面三个节点为主节点，后面的为从节点）

[root@redis-cluster1 src]# cd /data/redis/src/
[root@redis-cluster1 src]# ./redis-cli --cluster create --cluster-replicas 1 192.168.116.111:7000 192.168.116.111:7001 192.168.116.131:7002 192.168.116.131:7003 192.168.116.132:7004 192.168.116.132:7005

# Can I set the above configuration? (type 'yes' to accept): yes  #写yes同意
```

**查看集群状态可连接集群中的任一节点**

```shell
#此处连接了集群中的节点--192.168.116.111
#登录集群客户端，-c标识以集群方式登录
[root@redis-cluster1 src]# ./redis-cli -h 192.168.116.172 -c -p 7000
192.168.116.172:7000> ping
PONG
192.168.116.173:7002> cluster info  #查看集群信息
cluster_state:ok  #集群状态
cluster_slots_assigned:16384 #分配的槽
cluster_slots_ok:16384
cluster_slots_pfail:0
cluster_slots_fail:0
cluster_known_nodes:6 #集群实例数
......

192.168.116.172:7000> cluster nodes  #查看集群实例

参数解释：
runid: 该行描述的节点的id。
ip:prot: 该行描述的节点的ip和port
flags: 分隔的标记位，可能的值有：
1.master: 该行描述的节点是master
2.slave: 该行描述的节点是slave
3.fail?:该行描述的节点可能不可用
4.fail:该行描述的节点不可用（故障）
master_runid: 该行描述的节点的master的id,如果本身是master则显示-
ping-sent: 最近一次发送ping的Unix时间戳，0表示未发送过
pong-recv：最近一次收到pong的Unix时间戳，0表示未收到过
config-epoch: 主从切换的次数
link-state: 连接状态，connnected 和 disconnected
hash slot: 该行描述的master中存储的key的hash的范围
```

**查看redis-cluster1，和连通性**

```shell
[root@redis-cluster1 src]# ./redis-cli -h 192.168.116.132 -c -p 7004
192.168.116.132:7004> ping
PONG
192.168.116.132:7004> cluster info
cluster_state:ok
cluster_slots_assigned:16384
cluster_slots_ok:16384
cluster_slots_pfail:0
cluster_slots_fail:0
cluster_known_nodes:6
cluster_size:3
cluster_current_epoch:6
cluster_my_epoch:5
cluster_stats_messages_ping_sent:837
cluster_stats_messages_pong_sent:962
cluster_stats_messages_meet_sent:1
cluster_stats_messages_sent:1800
cluster_stats_messages_ping_received:962
cluster_stats_messages_pong_received:838
cluster_stats_messages_received:1800
192.168.116.132:7004> cluster nodes
e1784e05bc7220db5155e80787b4cc6af12ab0c5 192.168.116.131:7003@17003 slave 462577d2fbc035e6584f9ce7177d9e0df72e3c16 0 1702369829000 1 connected
bcbfcc14d0cad0d5d00738cd403a4aee52b446f9 192.168.116.132:7004@17004 myself,master - 0 1702369827000 5 connected 10923-16383
c81d083a6b36882c955e76ed026b3d90c5ac61eb 192.168.116.131:7002@17002 master - 0 1702369830266 3 connected 5461-10922
462577d2fbc035e6584f9ce7177d9e0df72e3c16 192.168.116.111:7000@17000 master - 0 1702369829262 1 connected 0-5460
4cbe431c64d21483dd004b18207f647145e0c6fb 192.168.116.132:7005@17005 slave c81d083a6b36882c955e76ed026b3d90c5ac61eb 0 1702369830000 3 connected
9c5e3e52773043d74a01b8ebbe7f2b63f56dd8b0 192.168.116.111:7001@17001 slave bcbfcc14d0cad0d5d00738cd403a4aee52b446f9 0 1702369829000 5 connected

# 验证--查看
# 可以数据联通--属于集群操作
redis-cluster1
192.168.116.132:7004> set name qingfeng
-> Redirected to slot [5798] located at 192.168.116.131:7002
OK
192.168.116.131:7002>

redis-cluster3
192.168.116.111:7000> get name
-> Redirected to slot [5798] located at 192.168.116.131:7002
"qingfeng"
192.168.116.131:7002>
```

**主从切换**

```shell
测试：
# 1.将节点cluster1的主节点7000端口的redis关掉
[root@redis-cluster1 src]# ./redis-cli -h 192.168.116.132 -c -p 7004
192.168.116.132:7004> cluster nodes		#此时查看7000在线
e1784e05bc7220db5155e80787b4cc6af12ab0c5 192.168.116.131:7003@17003 slave 462577d2fb
bcbfcc14d0cad0d5d00738cd403a4aee52b446f9 192.168.116.132:7004@17004 myself,master -
c81d083a6b36882c955e76ed026b3d90c5ac61eb 192.168.116.131:7002@17002 master - 0 17023
462577d2fbc035e6584f9ce7177d9e0df72e3c16 192.168.116.111:7000@17000 master - 0 17023
4cbe431c64d21483dd004b18207f647145e0c6fb 192.168.116.132:7005@17005 slave c81d083a6b
9c5e3e52773043d74a01b8ebbe7f2b63f56dd8b0 192.168.116.111:7001@17001 slave bcbfcc14d0
192.168.116.132:7004> exit
[root@redis-cluster1 src]# ps -ef |grep redis
root      16191      1  0 15:50 ?        00:00:07 src/redis-server 192.168.116.111:7
root      16197      1  0 15:50 ?        00:00:07 src/redis-server 192.168.116.111:7
root      16246   1538  0 16:39 pts/0    00:00:00 grep --color=auto redis
[root@redis-cluster1 src]# kill -9 16191
[root@redis-cluster1 src]# ps -ef |grep redis
root      16197      1  0 15:50 ?        00:00:07 src/redis-server 192.168.116.111:7
root      16248   1538  0 16:39 pts/0    00:00:00 grep --color=auto redis
[root@redis-cluster1 src]# netstat -lnpt		#7000的端口关闭了，看不到
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
tcp        0      0 192.168.116.111:7001    0.0.0.0:*               LISTEN      16197/src/redis-ser
tcp        0      0 127.0.0.1:25            0.0.0.0:*               LISTEN      1137/master
tcp        0      0 192.168.116.111:17001   0.0.0.0:*               LISTEN      16197/src/redis-ser
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      938/sshd
tcp6       0      0 ::1:25                  :::*                    LISTEN      1137/master
tcp6       0      0 :::22                   :::*                    LISTEN      938/sshd


# 查看集群信息：--在132的机器上输入命令查看
192.168.116.131:7002> cluster nodes  #此时查看7000显示fail，下线了
c81d083a6b36882c955e76ed026b3d90c5ac61eb 192.168.116.131:7002@17002 myself,master - 0 1702370394000 3 connected 5461-10922
462577d2fbc035e6584f9ce7177d9e0df72e3c16 192.168.116.111:7000@17000 master,fail - 1702370373573 1702370371564 1 disconnected		#显示fail，下线了
e1784e05bc7220db5155e80787b4cc6af12ab0c5 192.168.116.131:7003@17003 master - 0 1702370394653 7 connected 0-5460
4cbe431c64d21483dd004b18207f647145e0c6fb 192.168.116.132:7005@17005 slave c81d083a6b36882c955e76ed026b3d90c5ac61eb 0 1702370395055 3 connected
bcbfcc14d0cad0d5d00738cd403a4aee52b446f9 192.168.116.132:7004@17004 master - 0 1702370395657 5 connected 10923-16383
9c5e3e52773043d74a01b8ebbe7f2b63f56dd8b0 192.168.116.111:7001@17001 slave bcbfcc14d0cad0d5d00738cd403a4aee52b446f9 0 1702370395156 5 connected


# 2.将该节点的7000端口redis启动在查看
[root@redis-cluster1 src]# cd ..
[root@redis-cluster1 reids]# src/redis-server cluster/7000/redis.conf
[root@redis-cluster1 reids]# netstat -lnpt		#此时7000的端口正常运行
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
tcp        0      0 192.168.116.111:7000    0.0.0.0:*               LISTEN      16257/src/redis-ser
tcp        0      0 192.168.116.111:7001    0.0.0.0:*               LISTEN      16197/src/redis-ser
tcp        0      0 127.0.0.1:25            0.0.0.0:*               LISTEN      1137/master
tcp        0      0 192.168.116.111:17000   0.0.0.0:*               LISTEN      16257/src/redis-ser
tcp        0      0 192.168.116.111:17001   0.0.0.0:*               LISTEN      16197/src/redis-ser
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      938/sshd
tcp6       0      0 ::1:25                  :::*                    LISTEN      1137/master
tcp6       0      0 :::22                   :::*                    LISTEN      938/sshd

# 查看节点信息：-- 用132的机器查看，此时7000的状态恢复正常，但是变成了从节点
192.168.116.131:7002> cluster nodes
c81d083a6b36882c955e76ed026b3d90c5ac61eb 192.168.116.131:7002@17002 myself,master - 0 1702370727000 3 connected 5461-10922
462577d2fbc035e6584f9ce7177d9e0df72e3c16 192.168.116.111:7000@17000 slave e1784e05bc7220db5155e80787b4cc6af12ab0c5 0 1702370728000 7 connected
e1784e05bc7220db5155e80787b4cc6af12ab0c5 192.168.116.131:7003@17003 master - 0 1702370728580 7 connected 0-5460
4cbe431c64d21483dd004b18207f647145e0c6fb 192.168.116.132:7005@17005 slave c81d083a6b36882c955e76ed026b3d90c5ac61eb 0 1702370728000 3 connected
bcbfcc14d0cad0d5d00738cd403a4aee52b446f9 192.168.116.132:7004@17004 master - 0 1702370727000 5 connected 10923-16383
9c5e3e52773043d74a01b8ebbe7f2b63f56dd8b0 192.168.116.111:7001@17001 slave bcbfcc14d0cad0d5d00738cd403a4aee52b446f9 0 1702370728581 5 connected
```

到此--主从切换完成
![image-20231212171231961](https://xbd666.cn/upload/redis-cluster1.png)
![image-20231212171504750](https://xbd666.cn/upload/redis-cluster2.png)