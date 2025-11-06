---
title: RocketMQ消息队列
author: Mr.xu
date: 2025-11-05 22:13:50
tags:
---

### RocketMQ--集群

#### 作用

Apache RocketMQ 是一个分布式消息中间件，主要用于消息的发布与订阅（Pub/Sub）和消息队列（Message Queue）模式。它在高性能、高可靠性和高可扩展性方面有着显著的优势。以下是 RocketMQ 的主要作用和应用场景：

1. **消息发布与订阅（Pub/Sub）**：
   - RocketMQ 支持发布/订阅模式，允许消息生产者将消息发布到一个主题（Topic），然后多个消费者可以订阅这个主题以接收消息。这种模式适用于广播消息和事件通知。
2. **消息队列（Message Queue）**：
   - 在消息队列模式下，消息生产者将消息发送到队列，消费者从队列中读取并处理消息。消息队列模式适用于任务分发和负载均衡。
3. **异步通信**：
   - RocketMQ 支持异步消息传递，允许系统组件之间进行松耦合的通信，从而提高系统的响应速度和处理能力。
4. **削峰填谷**：
   - 在高并发场景下，RocketMQ 可以通过消息队列的缓冲作用来平滑流量，防止系统在短时间内被大量请求压垮。
5. **事件驱动架构**：
   - RocketMQ 支持事件驱动架构，系统可以通过事件通知机制来触发后续操作，实现松耦合的系统设计。
6. **数据同步**：
   - RocketMQ 可以用于分布式系统中的数据同步，确保不同系统或组件之间的数据一致性。

#### 资源需求

- **CPU**: 4 核 
- **内存**:  8 GB 
- **存储**: 100G
- **节点**：2

#### 网络端口

1. **Nameserver 端口**：
   - 默认端口：9876
   - 用于 Nameserver 服务，负责管理和发现 Broker。
2. **Broker 端口**：
   - 默认端口：10911
   - 用于 Broker 服务，负责消息存储和转发。
3. **Broker HA 端口**：
   - 默认端口：10912
   - 用于 Broker 高可用（HA）复制。
4. **Console 端口**（可选）：
   - 默认端口：8080
   - 用于 RocketMQ 控制台管理界面。

#### 安装部署
```服务器
10.1.15.106
10.1.11.103
10.1.11.104

3台机器都操作
#下载安装包
wget https://archive.apache.org/dist/rocketmq/4.8.0/rocketmq-all-4.8.0-bin-release.zip
jdk 1.8


mkdir -p /data/rocketmq
chmod -R 755 /data/rocketmq

#添加环境变量
JAVA_HOME=/usr/local/java
JRE_HOME=/usr/local/java/jre
export CLASSPATH=.:\$JAVA_HOME/jre/lib:\$JAVA_HOME/lib:\$JAVA_HOME/lib/tools.jar
ROCKETMQ_HOME=/data/rocketmq/rocketmq-4.8
PATH=$PATH:$JAVA_HOME/bin:$JRE_HOME/bin:$ROCKETMQ_HOME/bin
export JAVA_HOME JRE_HOME CLASS_PATH PATH ROCKETMQ_HOME


#环境生效
source /etc/porfile

cd /data/rocketmq
#解压
upzip rocketmq-all-4.8.0-bin-release.zip
#修改文件夹
mv rocketmq-all-4.8.0-bin-release rocketmq-4.8
#创建日志目录
mkdir logs

10.1.15.106--nameserver
#编写脚本
[root@minio rocketmq]# cat start.sh
#!/bin/bash

JAVA_HOME=/usr/local/java
ROCKETMQ_HOME=/data/rocketmq/rocketmq-4.8
JAVA_OPT="-server -Xms4g -Xmx4g -Xmn2g -XX:+UseConcMarkSweepGC"

# 将 lib 目录中的所有 JAR 文件添加到 CLASSPATH 中
CLASSPATH=$(find ${ROCKETMQ_HOME}/lib -name '*.jar' | tr '\n' ':')

JAVA_OPT="${JAVA_OPT} -classpath ${CLASSPATH}"
java ${JAVA_OPT} org.apache.rocketmq.namesrv.NamesrvStartup -n 10.1.15.106:9876


#启动脚本
chmod +x start.sh
nohup ./start.sh &



10.1.11.103
部署broker
机器A配置
#创建文件夹store,store-s（store-a：master数据存储文件夹，store-b-s:salve数据存储文件夹）
mkdir /data/rocket/rocketmq-4.8/store-a

#机器A上修改master的broker-a.properties配置文件
cd /data/rocket/rocketmq-5.2/conf/2m-2s-async

vim broker-a.properties
配置内容如下面：
# 集群名称,这里要master和slave保持一样
brokerClusterName=cjsCluster
# broker名字
brokerName=broker-a
#0 表示 Master，>0 表示 Slave
brokerId=0
#删除文件时间点，默认凌晨 4点
deleteWhen=04
#文件保留时间，默认48小时，这里设置5天
fileReservedTime=120
#Broker 的角色 - ASYNC_MASTER 异步复制Master
brokerRole=ASYNC_MASTER
#刷盘方式 - ASYNC_FLUSH 异步刷盘
flushDiskType=ASYNC_FLUSH
#开启账号密码连接，需要配置plain_acl.yml文件里面的账号密码用于连接
aclEnable=false
 
# Broker 对外服务的监听端口
listenPort=10911
# nameserver地址，分号分割
namesrvAddr=10.1.15.106:9876
#在发送消息时，自动创建服务器不存在的topic，默认创建的队列数
defaultTopicQueueNums=4
#是否允许 Broker 自动创建Topic，建议线下开启，线上关闭
autoCreateTopicEnable=true
#是否允许 Broker 自动创建订阅组，建议线下开启，线上关闭
autoCreateSubscriptionGroup=true
#本机IP
brokerIP1=10.1.11.103
storePathRootDir=/data/rocketmq/rocketmq-4.8/store-a
storePathCommitLog=/data/rocketmq/rocketmq-4.8/store-a/commitlog
#消费队列存储路径存储路径
storePathConsumerQueue=/data/rocketmq/rocketmq-4.8/store-a/consumequeue
#消息索引存储路径
storePathIndex=/data/rocketmq/rocketmq-4.8/store-a/index
#checkpoint 文件存储路径
storeCheckpoint=/data/rocketmq/rocketmq-4.8/store-a/checkpoint
#abort文件存储路径
abortFile=/data/rocketmq/rocketmq-4.8/store-a/abort
# commitLog每个文件的大小默认1G
mapedFileSizeCommitLog=1073741824
#ConsumeQueue每个文件默认存30W条，根据业务情况调整
mapedFileSizeConsumeQueue=300000



10.1.11.104
机器B上修改slave的broker-a-slave.properties配置文件
mkdir -p /data/rocketmq/rocketmq-4.8/store-a-s

cd /data/rocket/rocketmq-4.8/conf/2m-2s-async
vim broker-a-s.properties
配置内容如下：
# 集群名称
brokerClusterName=cjsCluster
# broker名字
brokerName=broker-a
#0 表示 Master，>0 表示 Slave
brokerId=1
#删除文件时间点，默认凌晨 4点
deleteWhen=04
#文件保留时间，默认 48 小时，这里设置5天
fileReservedTime=120
brokerRole=SLAVE
flushDiskType=ASYNC_FLUSH
#开启账号密码连接
aclEnable=false
 
# Broker 对外服务的监听端口
listenPort=10922
# nameserver地址，分号分割
namesrvAddr=10.1.15.106:9876
#在发送消息时，自动创建服务器不存在的topic，默认创建的队列数
defaultTopicQueueNums=4
#是否允许 Broker 自动创建Topic，建议线下开启，线上关闭
autoCreateTopicEnable=true
#是否允许 Broker 自动创建订阅组，建议线下开启，线上关闭
autoCreateSubscriptionGroup=true
#master的IP
masterAddress=10.1.11.103
storePathRootDir=/data/rocketmq/rocketmq-4.8/store-a-s
storePathCommitLog=/data/rocketmq/rocketmq-4.8/store-a-s/commitlog
#消费队列存储路径存储路径
storePathConsumerQueue=/data/rocketmq/rocketmq-4.8/store-a-s/consumequeue
#消息索引存储路径
storePathIndex=/data/rocketmq/rocketmq-4.8/store-a-s/index
#checkpoint 文件存储路径
storeCheckpoint=/data/rocketmq/rocketmq-4.8/store-a-s/checkpoint
#abort文件存储路径
abortFile=/data/rocketmq/rocketmq-4.8/store-a-s/abort
# commitLog每个文件的大小默认1G
mapedFileSizeCommitLog=1073741824
#ConsumeQueue每个文件默认存30W条，根据业务情况调整
mapedFileSizeConsumeQueue=300000



#机器A上编写启动文件  
[root@rocketmq01 rocketmq]# cat mqbrokerStart-a.sh
#!/bin/sh

cd /data/rocketmq/rocketmq-4.8/bin

nohup sh mqbroker -c /data/rocketmq/rocketmq-4.8/conf/2m-2s-async/broker-a.properties > /data/rocketmq/logs/broker-a.log 2>&1 &




#slave启动文件mqbrokerStart-a-s.sh内容如下编写
vim mqbrokerStart-a-s.sh
#!/bin/sh
 
cd /data/rocketmq/rocketmq-4.8/bin
 
nohup sh mqbroker -c /data/rocketmq/rocketmq-4.8/conf/2m-2s-async/broker-a-s.properties > /data/rocketmq/logs/broker-a-s.log 2>&1 &
 
exit


#给与权限
chmod +x mqbrokerStart-a.sh
chmod +x mqbrokerStart-a-s.sh


启动broker--按顺序启动
机器A上启动master：broker-a
cd /data/rocketmq
./mqbrokerStart-a.sh


机器B上启动slave：broker-a-s
cd /data/rocketmq
./mqbrokerStart-a-s.sh


#验证机器信息
cd /data/rocketmq/rocketmq-4.8/bin/
./mqadmin clusterList -n 10.1.15.106:9876
