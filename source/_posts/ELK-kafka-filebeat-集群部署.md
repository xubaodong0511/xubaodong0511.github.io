---
title: ELK+kafka+filebeat 集群部署
author: Mr.xu
date: 2025-11-06 20:59:05
tags:
---

## 版本说明

```shell
Elasticsearch: 7.13.2 #wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.13.2-linux-x86_64.tar.gz
Logstash: 7.13.2 #wget https://artifacts.elastic.co/downloads/logstash/logstash-7.13.2-linux-x86_64.tar.gz
Kibana: 7.13.2 #wget https://artifacts.elastic.co/downloads/kibana/kibana-7.13.2-linux-x86_64.tar.gz
Kafka: 2.11-2.1  #wget https://archive.apache.org/dist/kafka/2.1.0/kafka_2.11-2.1.0.tgz
Filebeat: 7.13.2
相应的版本最好下载对应的插件
```

**相关地址：**

官网地址：[https://www.elastic.co](https://www.elastic.co/)

官网搭建：https://www.elastic.co/guide/index.html

## 实施部署

关闭防火墙，关闭setenforce

## 1、安装配置jdk8

```shell
三台机器都操作，安装jdk（java）
[root@mes-1 ~]# tar xzf jdk-8u191-linux-x64.tar.gz -C /usr/local/
[root@mes-1 ~]# cd /usr/local/
[root@mes-1 local]# mv jdk1.8.0_191/ java
[root@mes-1 local]# echo '
JAVA_HOME=/usr/local/java
PATH=$JAVA_HOME/bin:$PATH
export JAVA_HOME PATH
' >>/etc/profile
[root@mes-1 ~]# source /etc/profile
[root@mes-1 ~]# java -version
```

## 2、安装配置ES----只在第一台操作操作下面的部分

```shell
创建运行ES的普通用户
[root@mes-1 ~]# useradd elsearch
[root@mes-1 ~]# echo "123456" | passwd --stdin "elsearch"
================

#如果是集群三台机器都操作
```

## 安装配置ES--如果是集群三台机器都操作

```shell
[root@mes-1 ~]# tar xzf elasticsearch-6.5.4.tar.gz -C /usr/local/
[root@mes-1 ~]# cd /usr/local/elasticsearch-6.5.4/config/
[root@mes-1 config]# ls
elasticsearch.yml  log4j2.properties  roles.yml  users_roles
jvm.options        role_mapping.yml   users
[root@mes-1 config]# cp elasticsearch.yml elasticsearch.yml.bak
[root@mes-1 config]# vim elasticsearch.yml    ----找个地方添加如下内容
cluster.name: elk
cluster.initial_master_nodes: ["192.168.246.234","192.168.246.231","192.168.246.235"]	#写所有的IP地址
node.name: elk01	#修改，自定义名字
node.master: true
node.data: true
path.data: /data/elasticsearch/data
path.logs: /data/elasticsearch/logs
bootstrap.memory_lock: false
bootstrap.system_call_filter: false
network.host: 0.0.0.0
http.port: 9200
transport.tcp.port: 9300
discovery.seed_hosts: ["192.168.246.234", "192.168.246.235"]	#改自己的另外两台IP
discovery.zen.minimum_master_nodes: 2
discovery.zen.ping_timeout: 150s
discovery.zen.fd.ping_retries: 10
client.transport.ping_timeout: 60s
http.cors.enabled: true
http.cors.allow-origin: "*"


单节点配置
cluster.name: elk
cluster.initial_master_nodes: ["10.36.153.131"] 	#单机只写本机ip
node.name: elk01	#自定义名字
node.master: true
node.data: true
path.data: /data/elasticsearch/data
path.logs: /data/elasticsearch/logs
bootstrap.memory_lock: false
bootstrap.system_call_filter: false
network.host: 10.36.153.131 	#单机只写本机ip
http.port: 9200
transport.tcp.port: 9300
discovery.seed_hosts: ["10.36.153.131"] #单机只写本机ip
#discovery.zen.minimum_master_nodes: 2
#discovery.zen.ping_timeout: 150s
#discovery.zen.fd.ping_retries: 10
#client.transport.ping_timeout: 60s
http.cors.enabled: true
http.cors.allow-origin: "*"
```

## 设置JVM堆大小---#如果是集群三台机器都操作

```shell
[root@mes-1 config]# vim jvm.options     ----配置文件里修改
-Xms1g    ----修改成 -Xms2g
-Xmx1g    ----修改成 -Xms2g

或者:
推荐设置为4G，请注意下面的说明：
sed -i 's/-Xms1g/-Xms4g/' /usr/local/elasticsearch-6.5.4/config/jvm.options
sed -i 's/-Xmx1g/-Xmx4g/' /usr/local/elasticsearch-6.5.4/config/jvm.options

堆内存大小不要超过系统内存的50%
```

## 创建ES数据及日志存储目录

```shell
[root@mes-1 ~]# mkdir -p /data/elasticsearch/data       (/data/elasticsearch)
[root@mes-1 ~]# mkdir -p /data/elasticsearch/logs       (/log/elasticsearch)
```

## 修改安装目录及存储目录权限

```shell
[root@mes-1 ~]# chown -R elsearch:elsearch /data/elasticsearch
[root@mes-1 ~]# chown -R elsearch:elsearch /usr/local/elasticsearch-7.13.2
```

## 3、系统优化

```shell
增加最大文件打开数
永久生效方法：----`看情况做，可不做`
echo "* - nofile 65536" >> /etc/security/limits.conf
```
## 增加最大进程数

```shell
[root@mes-1 ~]# vim /etc/security/limits.conf    ---在文件最后面添加如下内容
* soft nofile 65536
* hard nofile 131072
* soft nproc 2048
* hard nproc 4096
* hard nofile 65536
* hard nofile 65536
更多的参数调整可以直接用这个
```

## 增加最大内存映射数

```shell
[root@mes-1 ~]# vim /etc/sysctl.conf   ---添加如下
vm.max_map_count=262144
vm.swappiness=0
[root@mes-1 ~]# sysctl -p	#看情况做，可不做

# 设置内存权限大小
[root@mes-1 ~]# sysctl -w vm.max_map_count=262144
```

## 4、启动ES

```shell
#如果是集群三台机器都启动
# 切换到不同用户启动 
`启动的时候一台机器一台机器的启动`
[root@mes-1 ~]# su - elsearch
Last login: Sat Aug  3 19:48:59 CST 2019 on pts/0

[root@mes-1 ~]$ cd /usr/local/elasticsearch-6.5.4/
[root@mes-1 elasticsearch-6.5.4]$ ./bin/elasticsearch  #先启动看看报错不，需要多等一会

`ctrl+c终止之后,启动后台运行`
[root@mes-1 elasticsearch-6.5.4]$ nohup ./bin/elasticsearch &  #放后台启动
[1] 11462
nohup: ignoring input and appending output to ‘nohup.out’

# 查看9200、9300端口有没有起来
[root@mes-1 elasticsearch-6.5.4]$ netstat -lnpt
# 查看日志
[root@mes-1 elasticsearch-6.5.4]$ tail -f nohup.out   #看一下是否启动
或者:
su - elsearch -c "cd /usr/local/elasticsearch-6.5.4 && nohup bin/elasticsearch &"
```

## 测试
`以上步骤三台机器都操作`

```shell
浏览器访问http://172.16.246.234:9200
# 三台机器都可以访问，加端口9200
```

## 5.安装配置head监控插件（Web前端）----只需要安装一台就可以了

192.168.246.235

安装node

```shell
[root@es-3-head-kib ~]# wget https://npm.taobao.org/mirrors/node/v14.15.3/node-v14.15.3-linux-x64.tar.gz
[root@es-3-head-kib ~]# tar xzvf node-v14.15.3-linux-x64.tar.gz -C /usr/local/
[root@es-3-head-kib ~]# vim /etc/profile   #添加如下变量
NODE_HOME=/usr/local/node-v14.15.3-linux-x64
PATH=$NODE_HOME/bin:$PATH
export NODE_HOME PATH
[root@es-3-head-kib ~]# source /etc/profile
[root@es-3-head-kib ~]# node --version  #检查node版本号
v14.15.3
```

## 下载head插件

```shell
[root@es-3-head-kib ~]# wget https://github.com/mobz/elasticsearch-head/archive/master.zip
[root@es-3-head-kib ~]# unzip -d /usr/local/ master.zip
[root@es-3-head-kib ~]# cd /usr/local
或者
unzip –d /usr/local elasticsearch-head-master.zip
```

## 安装grunt

```shell
[root@es-3-head-kib ~]# cd elasticsearch-head-master/
[root@mes-3-head-kib elasticsearch-head-master]# npm config set registry https://registry.npm.taobao.org  #更换一个镜像，如果不更换下载会很慢
[root@mes-3-head-kib elasticsearch-head-master]# npm install -g grunt-cli  #时间会很长
[root@es-3-head-kib elasticsearch-head-master]# grunt --version  #检查grunt版本号
```

## 修改head源码

```shell
[root@es-3-head-kib elasticsearch-head-master]# vim /usr/local/elasticsearch-head-master/Gruntfile.js    #（95左右）
添加--hostname: '*'
# 注意在上一行末尾添加逗号,hostname 不需要添加逗号

[root@es-3-head-kib elasticsearch-head-master]# vim /usr/local/elasticsearch-head-master/_site/app.js        	#(4359左右)
原本是http://localhost:9200--http://192.168.116.111:9200
# 如果head和ES不在同一个节点，注意修改成ES的IP地址
```

## 下载head必要的文件

```shell
[root@es-3-head-kib ~]# wget https://github.com/Medium/phantomjs/releases/download/v2.1.1/phantomjs-2.1.1-linux-x86_64.tar.bz2
[root@es-3-head-kib ~]# yum -y install bzip2
[root@es-3-head-kib ~]# tar -jxf phantomjs-2.1.1-linux-x86_64.tar.bz2 -C /tmp/  #解压
```

## 运行head

```shell
[root@es-3-head-kib ~]# cd /usr/local/elasticsearch-head-master/
[root@es-3-head-kib elasticsearch-head-master]# npm config set registry https://registry.npm.taobao.org  #先执行这条命令更换一个镜像
[root@es-3-head-kib elasticsearch-head-master]# npm install
...
grunt-contrib-jasmine@1.0.3 node_modules/grunt-contrib-jasmine
├── sprintf-js@1.0.3
├── lodash@2.4.2
├── es5-shim@4.5.13
├── chalk@1.1.3 (escape-string-regexp@1.0.5, supports-color@2.0.0, ansi-styles@2.2.1, strip-ansi@3.0.1, has-ansi@2.0.0)
├── jasmine-core@2.99.1
├── rimraf@2.6.3 (glob@7.1.4)
└── grunt-lib-phantomjs@1.1.0 (eventemitter2@0.4.14, semver@5.7.0, temporary@0.0.8, phan

如果报错执行：npm install phantomjs-prebuilt@2.1.16 --ignore-scripts

# 后台运行
[root@es-3-head-kib elasticsearch-head-master]# nohup grunt server &

# 清理缓存
echo 3 > /proc/sys/vm/drop_caches
```

## 测试

```
# web访问安装node，head，grunt的机器IP地址
访问http://172.16.246.235:9100
```

## Kibana部署

系统类型：Centos7.5
节点IP：192.168.246.235 D
软件版本：nginx-1.14.2、kibana-6.5.4-linux-x86_64.tar.gz

## 1. 安装配置Kibana

## （1）安装

```shell
[root@es-3-head-kib ~]# tar zvxf kibana-6.5.4-linux-x86_64.tar.gz -C /usr/local/
```

## （2）配置

```
[root@es-3-head-kib ~]# cd /usr/local/kibana-7.13.2-linux-x86_64/config/
[root@es-3-head-kib config]# vim kibana.yml
server.port: 5601
server.host: "192.168.246.235"	#本机的IP
elasticsearch.hosts: ["http://192.168.246.234:9200"]	#节点的IP（随便哪个都可以）
kibana.index: ".kibana"
i18n.locale: "zh-CN"
```

## 启动

```shell
[root@es-3-head-kib config]# cd ..
# 启动后台运行
[root@es-3-head-kib kibana-7.13.2-linux-x86_64]# nohup ./bin/kibana --allow-root &
[1] 12054
[root@es-3-head-kib kibana-7.13.2-linux-x86_64]# nohup: ignoring input and appending output to ‘nohup.out’	#此为显示内容
```

## 2. 安装配置Nginx反向代理

## 配置YUM源：

```shell
[root@es-3-head-kib ~]# rpm -ivh http://nginx.org/packages/centos/7/noarch/RPMS/nginx-release-centos-7-0.el7.ngx.noarch.rpm
```

## 安装：

```shell
[root@es-3-head-kib ~]# yum install -y nginx 
```

## 配置反向代理

```shell
[root@es-3-head-kib ~]# cd /etc/nginx/conf.d/
[root@es-3-head-kib conf.d]# cp default.conf nginx.conf
[root@es-3-head-kib conf.d]# mv default.conf default.conf.bak
[root@es-3-head-kib conf.d]# vim nginx.conf
# 配置文件内容
[root@es-3-head-kib conf.d]# cat nginx.conf
server {
        listen       80;
        server_name  192.168.246.235;

        #charset koi8-r;

       # access_log  /var/log/nginx/host.access.log  main;
       # access_log off;

         location / {  
             proxy_pass http://192.168.246.235:5601;
             proxy_set_header Host $host:5601;  
             proxy_set_header X-Real-IP $remote_addr;  
             proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  
             proxy_set_header Via "nginx";  
                     }

         location /head/{
             proxy_pass http://192.168.246.235:9100;
             proxy_set_header Host $host:9100;
             proxy_set_header X-Real-IP $remote_addr;
             proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
             proxy_set_header Via "nginx";
                         }  
}
```

## 配置nginx

```shell
1.将原来的log_format注释掉，添加json格式的配置信息，如下：
[root@es-3-head-kib conf.d]# vim /etc/nginx/nginx.conf
log_format  json '{"@timestamp":"$time_iso8601",'
                           '"@version":"1",'
                           '"client":"$remote_addr",'
                           '"url":"$uri",'
                           '"status":"$status",'
                           '"domain":"$host",'
                           '"host":"$server_addr",'
                           '"size":$body_bytes_sent,'
                           '"responsetime":$request_time,'
                           '"referer": "$http_referer",'
                           '"ua": "$http_user_agent"'
               '}';
2.引用定义的json格式的日志：
access_log  /var/log/nginx/access_json.log  json;	#在nginx.conf配置文件里
```

## 启动nginx

```shell
root@es-3-head-kib ~]# systemctl start nginx
```

## 测试--访问当前机器IP

`浏览器访问http://192.168.246.235 刚开始没有任何数据，会提示你创建新的索引`

##  Logstash部署----192.168.246.231

系统类型：Centos7.5
节点IP：192.168.246.231   E
软件版本：jdk-8u121-linux-x64.tar.gz、logstash-6.5.4.tar.gz

## 1.安装配置Logstash

## 安装

```shell
[root@es-2-zk-log ~]# tar xvzf logstash-6.5.4.tar.gz -C /usr/local/
```

## 配置

创建目录，我们将所有input、filter、output配置文件全部放到该目录中。

```shell
1.安装nginx:
[root@es-2-zk-log ~]# rpm -ivh http://nginx.org/packages/centos/7/noarch/RPMS/nginx-release-centos-7-0.el7.ngx.noarch.rpm
[root@es-2-zk-log ~]# yum install -y nginx
将原来的日志格式注释掉定义成json格式：
[root@es-2-zk-log conf.d]# vim /etc/nginx/nginx.conf
log_format  json '{"@timestamp":"$time_iso8601",'
                           '"@version":"1",'
                           '"client":"$remote_addr",'
                           '"url":"$uri",'
                           '"status":"$status",'
                           '"domain":"$host",'
                           '"host":"$server_addr",'
                           '"size":$body_bytes_sent,'
                           '"responsetime":$request_time,'
                           '"referer": "$http_referer",'
                           '"ua": "$http_user_agent"'
               '}';
2.引用定义的json格式的日志：
access_log  /var/log/nginx/access_json.log  json;	#在配置文件里改

# 启动
[root@es-2-zk-log ~]# systemctl start nginx 
[root@es-2-zk-log ~]# systemctl enable nginx
浏览器多访问几次
[root@es-2-zk-log ~]# mkdir -p /usr/local/logstash-7.13.2/etc/conf.d
[root@es-2-zk-log ~]# cd /usr/local/logstash-6.5.4/etc/conf.d/       
[root@es-2-zk-log conf.d]# vim input.conf       #---在下面添加
input{                        #让logstash可以读取特定的事件源。

    file{                                       #从文件读取

   path => ["/var/log/nginx/access_json.log"]        #要输入的文件路径

   type => "shopweb"                       #定义一个类型，通用选项. 

    }

}


[root@es-2-zk-log conf.d]# vim output.conf
output{           #输出插件，将事件发送到特定目标
    elasticsearch {            #输出到es
    hosts => ["192.168.246.234:9200","192.168.246.231:9200","192.168.246.235:9200"]       #指定es服务的ip加端口
    index => ["%{type}-%{+YYYY.MM.dd}"]     #引用input中的type名称，定义输出的格式
    }
}

`启动：`
[root@es-2-zk-log conf.d]# cd /usr/local/logstash-7.13.2/
[root@es-2-zk-log logstash-7.13.2]# nohup bin/logstash -f etc/conf.d/  --config.reload.automatic & 


# 查看日志出现:
[root@es-2-zk-log logstash-7.13.2]# tail -f nohup.out
```

在浏览器中访问本机的nginx网站

```shell
随便刷新，主要刷新点数据，进行测试
web浏览器访问http://IP地址
```

## Kafka部署

## 1.安装配置jdk8

## （1）Kafka、Zookeeper（简称：ZK）运行依赖jdk8

```
tar zxvf /usr/local/package/jdk-8u121-linux-x64.tar.gz -C /usr/local/
echo '
JAVA_HOME=/usr/local/jdk1.8.0_121
PATH=$JAVA_HOME/bin:$PATH
export JAVA_HOME PATH
' >>/etc/profile
source /etc/profile
```

## 2.安装配置ZK

Kafka运行依赖ZK，Kafka官网提供的tar包中，已经包含了ZK，这里不再额下载ZK程序。

配置相互解析---三台机器

```shell
[root@es-2-zk-log ~]# vim /etc/hosts
192.168.246.234 mes-1
192.168.246.231 es-2-zk-log
192.168.246.235 es-3-head-kib
```

## （1）安装

```shell
# 安装kafka软件包，也可在官网搜索下载
[root@es-2-zk-log ~]# tar xzvf kafka_2.11-2.1.0.tgz -C /usr/local/
```

## （2）配置

```shell
[root@mes-1 ~]# sed -i 's/^[^#]/#&/' /usr/local/kafka_2.11-2.1.0/config/zookeeper.properties
[root@mes-1 ~]# vim /usr/local/kafka_2.11-2.1.0/config/zookeeper.properties  #添加如下配置
dataDir=/opt/data/zookeeper/data 
dataLogDir=/opt/data/zookeeper/logs
clientPort=2181 
tickTime=2000 
initLimit=20 
syncLimit=10 
server.1=192.168.246.231:2888:3888       //kafka集群IP:Port
server.2=192.168.246.234:2888:3888
server.3=192.168.246.235:2888:3888
# 直接添加

#创建data、log目录
[root@mes-1 ~]# mkdir -p /opt/data/zookeeper/{data,logs}
#创建myid文件
[root@mes-1 ~]# echo 1 > /opt/data/zookeeper/data/myid     #myid号按顺序排
```

```shell
[root@es-2-zk-log ~]# sed -i 's/^[^#]/#&/' /usr/local/kafka_2.11-2.1.0/config/zookeeper.properties
[root@es-2-zk-log ~]# vim /usr/local/kafka_2.11-2.1.0/config/zookeeper.properties
dataDir=/opt/data/zookeeper/data 
dataLogDir=/opt/data/zookeeper/logs
clientPort=2181 
tickTime=2000 
initLimit=20 
syncLimit=10 
server.1=192.168.246.231:2888:3888
server.2=192.168.246.234:2888:3888
server.3=192.168.246.235:2888:3888
# 以上内容直接添加

#创建data、log目录
[root@es-2-zk-log ~]# mkdir -p /opt/data/zookeeper/{data,logs}
#创建myid文件
[root@es-2-zk-log ~]# echo 2 > /opt/data/zookeeper/data/myid
```

```shell
[root@es-3 ~]# sed -i 's/^[^#]/#&/' /usr/local/kafka_2.11-2.1.0/config/zookeeper.properties
[root@es-3-head-kib ~]# vim /usr/local/kafka_2.11-2.1.0/config/zookeeper.properties
dataDir=/opt/data/zookeeper/data 
dataLogDir=/opt/data/zookeeper/logs
clientPort=2181 
tickTime=2000 
initLimit=20 
syncLimit=10 
server.1=192.168.246.231:2888:3888
server.2=192.168.246.234:2888:3888
server.3=192.168.246.235:2888:3888
# 直接添加

#创建data、log目录
[root@es-3-head-kib ~]# mkdir -p /opt/data/zookeeper/{data,logs}
#创建myid文件
[root@es-3-head-kib ~]# echo 3 > /opt/data/zookeeper/data/myid
```

##  配置Kafka

## (1）配置

```shell
[root@mes-1 ~]# sed -i 's/^[^#]/#&/' /usr/local/kafka_2.11-2.1.0/config/server.properties
[root@mes-1 ~]# vim /usr/local/kafka_2.11-2.1.0/config/server.properties  #在最后添加
broker.id=1		#需修改
listeners=PLAINTEXT://192.168.246.231:9092	#需修改本机IP
num.network.threads=3
num.io.threads=8
socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600
log.dirs=/opt/data/kafka/logs
num.partitions=6
num.recovery.threads.per.data.dir=1
offsets.topic.replication.factor=2
transaction.state.log.replication.factor=1
transaction.state.log.min.isr=1
log.retention.hours=168
log.segment.bytes=536870912
log.retention.check.interval.ms=300000
zookeeper.connect=192.168.246.231:2181,192.168.246.234:2181,192.168.246.235:2181	#修改集群的IP
zookeeper.connection.timeout.ms=6000
group.initial.rebalance.delay.ms=0
[root@mes-1 ~]# mkdir -p /opt/data/kafka/logs
```

```shell
[root@es-2-zk-log ~]# sed -i 's/^[^#]/#&/' /usr/local/kafka_2.11-2.1.0/config/server.properties
[root@es-2-zk-log ~]# vim /usr/local/kafka_2.11-2.1.0/config/server.properties
broker.id=2		#修改的
listeners=PLAINTEXT://192.168.246.234:9092
num.network.threads=3
num.io.threads=8
socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600
log.dirs=/opt/data/kafka/logs
num.partitions=6
num.recovery.threads.per.data.dir=1
offsets.topic.replication.factor=2
transaction.state.log.replication.factor=1
transaction.state.log.min.isr=1
log.retention.hours=168
log.segment.bytes=536870912
log.retention.check.interval.ms=300000
zookeeper.connect=192.168.246.231:2181,192.168.246.234:2181,192.168.246.235:2181
zookeeper.connection.timeout.ms=6000
group.initial.rebalance.delay.ms=0
[root@es-2-zk-log ~]# mkdir -p /opt/data/kafka/logs
```

```shell
[root@es-3-head-kib ~]# sed -i 's/^[^#]/#&/' /usr/local/kafka_2.11-2.1.0/config/server.properties
[root@es-3-head-kib ~]# vim /usr/local/kafka_2.11-2.1.0/config/server.properties
broker.id=3
listeners=PLAINTEXT://192.168.246.235:9092
num.network.threads=3
num.io.threads=8
socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600
log.dirs=/opt/data/kafka/logs
num.partitions=6
num.recovery.threads.per.data.dir=1
offsets.topic.replication.factor=2
transaction.state.log.replication.factor=1
transaction.state.log.min.isr=1
log.retention.hours=168
log.segment.bytes=536870912
log.retention.check.interval.ms=300000
zookeeper.connect=192.168.246.231:2181,192.168.246.234:2181,192.168.246.235:2181
zookeeper.connection.timeout.ms=6000
group.initial.rebalance.delay.ms=0
[root@es-3-head-kib ~]# mkdir -p /opt/data/kafka/logs
```

## 启动、验证ZK集群

## （1）启动

在三个节点依次执行：

```shell
[root@mes-1 ~]# cd /usr/local/kafka_2.11-2.1.0/
[root@mes-1 kafka_2.11-2.1.0]# nohup bin/zookeeper-server-start.sh config/zookeeper.properties &
```

## （2）验证

```shell
# 查看端口有没有起来
[root@mes-1 ~]# netstat -lntp | grep 2181
tcp6       0      0 :::2181                 :::*                    LISTEN      1226/java

```

## 6、启动、验证Kafka

## （1）启动

在三个节点依次执行：

```shell
[root@mes-1 ~]# cd /usr/local/kafka_2.11-2.1.0/
[root@mes-1 kafka_2.11-2.1.0]# nohup bin/kafka-server-start.sh config/server.properties &
```

## （2）验证

在192.168.246.231上创建topic

```shell
[root@es-2-zk-log kafka_2.11-2.1.0]# bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic testtopic
Created topic "testtopic".

参数解释：
–zookeeper指定zookeeper的地址和端口，
–partitions指定partition的数量，
–replication-factor指定数据副本的数量
```

在246.235上面查询192.168.246.231上的topic

```shell
[root@es-3-head-kib kafka_2.11-2.1.0]# bin/kafka-topics.sh --zookeeper 192.168.246.231:2181 --list
testtopic
```

模拟消息生产和消费
发送消息到192.168.246.231

```shell
[root@mes-1 kafka_2.11-2.1.0]# bin/kafka-console-producer.sh --broker-list 192.168.246.231:9092 --topic testtopic
>hello
```

从192.168.246.234接受消息

```shell
[root@es-2-zk-log kafka_2.11-2.1.0]# bin/kafka-console-consumer.sh --bootstrap-server  192.168.246.234:9092 --topic testtopic --from-beginning
hello
```

## 修改logstash配置文件

```shell
# 先关闭logstash，再修改配置文件---关闭进程
[root@es-2-zk-log ~]# ps -ef |grep logstash
[root@es-2-zk-log ~]# kill -9 进程号

kafka没有问题之后，回到logstash服务器：
#安装完kafka之后的操作：
[root@es-2-zk-log ~]# cd /usr/local/logstash-6.5.4/etc/conf.d/
[root@es-2-zk-log conf.d]# cp input.conf input.conf.bak
[root@es-2-zk-log conf.d]# vim input.conf
input {
kafka {               #指定kafka服务
    type => "nginx_log"
    codec => "json"        #通用选项，用于输入数据的编解码器
    topics => "nginx"        #这里定义的topic
    decorate_events => true  #会将当前topic信息也带到message中
    bootstrap_servers => "192.168.246.234:9092, 192.168.246.231:9092, 192.168.246.235:9092"
  }
}  

`启动 logstash`
[root@es-2-zk-log conf.d]# cd /usr/local/logstash-6.5.4/
[root@es-2-zk-log logstash-6.5.4]# nohup bin/logstash -f etc/conf.d/  --config.reload.automatic &
```

## Filebeat 部署

## （1）下载

```ini
#wget https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-7.13.2-linux-x86_64.tar.gz
```

## （2）解压

```ini
[root@es-3-head-kib ~]# tar xzvf filebeat-6.5.4-linux-x86_64.tar.gz -C /usr/local/
[root@es-3-head-kib ~]# cd /usr/local/
[root@es-3-head-kib local]# mv filebeat-6.5.4-linux-x86_64 filebeat
[root@es-3-head-kib local]# cd filebeat/
```

## （3）修改配置

修改 Filebeat 配置，支持收集本地目录日志，并输出日志到 Kafka 集群中

```shell
[root@es-3-head-kib filebeat]# mv filebeat.yml filebeat.yml.bak
[root@es-3-head-kib filebeat]# vim filebeat.yml
filebeat.inputs:
- type: log   #指定输入类型
  enable: true
  paths:
    -  /var/log/nginx/*.log  #日志路径

output.kafka:   
  hosts: ["192.168.246.234:9092","192.168.246.231:9092","192.168.246.235:9092"]   #kafka服务器
  topic: 'nginx'        #输出到kafka中的topic
```

## （4）启动

```shell
[root@es-3-head-kib filebeat]# nohup ./filebeat -e -c filebeat.yml & 
[root@es-3-head-kib filebeat]# tail -f nohup.out 
2019-08-04T16:55:54.708+0800	INFO	kafka/log.go:53	kafka message: client/metadata found some partitions to be leaderless
2019-08-04T16:55:54.708+0800	INFO	kafka/log.go:53	client/metadata retrying after 250ms... (2 attempts remaining)
...

验证kafka是否生成topic
[root@es-3-head-kib filebeat]# cd /usr/local/kafka_2.11-2.1.0/
[root@es-3-head-kib kafka_2.11-2.1.0]# bin/kafka-topics.sh --zookeeper 192.168.246.231:2181 --list
__consumer_offsets
nginx     #已经生成topic
testtopic
```

## 测试

```shell
浏览filebeat机器的IP地址，和浏览filebeat机器的IP地址+9100端口

web界面步骤
点击发现--创建索引模式--创建索引--再点左上角的3横杠里面的发现--这时候就可以看到创建好的索引了
```

