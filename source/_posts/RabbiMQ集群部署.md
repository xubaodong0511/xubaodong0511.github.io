---
title: RabbiMQ集群部署
author: Mr.xu
date: 2025-11-06 21:04:38
tags:
---

### 普通集群准备环境

**注意，这⾥三台服务器都关闭防火墙和selinux**

```shell
192.168.50.138 	rabbitmq-1
192.168.50.139	rabbitmq-2
192.168.50.140	rabbitmq-3
```

三台机器都操作:

#### 1、配置hosts⽂件

更改三台MQ节点的计算机名分别为rabbitmq-1、rabbitmq-2 和rabbitmq-3，然后修改hosts配置⽂件

```shell
[root@rabbitmq-1 ~]# vim /etc/hosts
127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4
::1         localhost localhost.localdomain localhost6 localhost6.localdomain6
192.168.50.138 rabbitmq-1
192.168.50.139 rabbitmq-2
192.168.50.140 rabbitmq-3

# 主机的名字也要改了，不然后面命令匹配不到
[root@rabbitmq-1 ~]#	//磁盘节点
[root@rabbitmq-2 ~]#	//内存节点
[root@rabbitmq-3 ~]#	//内存节点
```

#### 2、三个节点配置安装rabbitmq软件

```shell
安装依赖
[root@rabbitmq-1 ~]# yum install -y *epel* gcc-c++ unixODBC unixODBC-devel openssl-devel ncurses-devel
yum安装erlang
[root@rabbitmq-1 ~]# curl -s https://packagecloud.io/install/repositories/rabbitmq/erlang/script.rpm.sh | sudo bash
[root@rabbitmq-1 ~]# yum install erlang-21.3.8.21-1.el7.x86_64
测试；
[root@rabbitmq-1 ~]# erl
Erlang/OTP 20 [erts-9.3] [source] [64-bit] [smp:1:1] [ds:1:1:10] [async-threads:10] [hipe] [kernel-poll:false]

Eshell V9.3  (abort with ^G)
1>		//这里按两次ctrl+c

安装rabbitmq
https://github.com/rabbitmq/rabbitmq-server/releases/tag/v3.7.10 ---选择版本
下载下来将其上传到服务器中，三台机器相同操作
https://github.com/rabbitmq/rabbitmq-server/releases/download/v3.7.10/rabbitmq-server-3.7.10-1.el7.noarch.rpm	//这个包在电脑笔记里有

[root@rabbitmq-1 ~]# yum install -y rabbitmq-server-3.7.10-1.el7.noarch.rpm

`注意：erlang 和 rabbitmq 两个版本配置要一样，不然不兼容`
# erlang 版本选择
https://packagecloud.io/rabbitmq/erlang
# rabbitmq 和erlang兼容版本
https://www.rabbitmq.com/which-erlang.html

# 需要下载的可以在以上两个网站分别下载，但要选好版本，保证要两个软件兼容
```

```shell
3.启动方式一：
[root@rabbitmq-1 ~]# systemctl daemon-reload
[root@rabbitmq-1 ~]# systemctl start rabbitmq-server
[root@rabbitmq-1 ~]# systemctl enable rabbitmq-server
启动方式二:
[root@rabbitmq-1 ~]# /sbin/service rabbitmq-server status  ---查看状态
[root@rabbitmq-1 ~]# /sbin/service rabbitmq-server start   ---启动
4、每台都操作开启rabbitmq的web访问界面：
[root@rabbitmq-1 ~]# rabbitmq-plugins enable rabbitmq_management
```

#### 3、创建用户

```shell
注意:在一台机器操作
添加用户和密码
[root@rabbitmq-1 ~]# rabbitmqctl add_user soho soso
Creating user "soho"
...done.
设置为管理员
[root@rabbitmq-1 ~]# rabbitmqctl set_user_tags soho administrator
Setting tags for user "soho" to [administrator] ...
...done.
查看用户
[root@rabbitmq-1 ~]# rabbitmqctl list_users
Listing users ...
guest	[administrator]
soho	[administrator]
...done.

此处设置权限时注意'.*'之间需要有空格 三个'.*'分别代表了conf权限，read权限与write权限 例如：当没有给
soho设置这三个权限前是没有权限查询队列，在ui界面也看不见
[root@rabbitmq-1 ~]# rabbitmqctl set_permissions -p "/" soho ".*" ".*" ".*"
Setting permissions for user "soho" in vhost "/" ...
...done.
```

#### 4、所有机器都操作:开启用户远程登录:

```shell
[root@rabbitmq-1 ~]# cd /etc/rabbitmq/
[root@rabbitmq-1 rabbitmq]# cp /usr/share/doc/rabbitmq-server-3.7.5/rabbitmq.config.example /etc/rabbitmq/rabbitmq.config
[root@rabbitmq-1 rabbitmq]# ls
enabled_plugins  rabbitmq.config
[root@rabbitmq-1 rabbitmq]# vim rabbitmq.config
修改如下:
## {loopback_users, []}，--> {loopback_users, []}
# 把前面的注释去了，另外把最后的逗号去了，保存重启服务

三台机器都操作重启服务服务:
[root@rabbitmq-1 ~]# systemctl restart rabbitmq-server
```

#### 5、查看端口

```shell
4369 -- erlang端口
5672 --程序连接端口
15672 -- 管理界面ui端口
25672 -- server间内部通信口
```

**！注意如果是云服务器，切记添加安全组端口放行。**

```shell
# 输入网址访问
访问:192.168.50.138:15672	

# 用户名和密码
默认的是：guest	密码：guest
新添加的用户为:soho 密码:soso
```

### 开始部署集群三台机器都操作

#### 1.首先创建好数据存放目录和日志存放目录:

```shell
[root@rabbitmq-1 ~]# mkdir -p /data/rabbitmq/data
[root@rabbitmq-1 ~]# mkdir -p /data/rabbitmq/logs
[root@rabbitmq-1 ~]# chmod 777 -R /data/rabbitmq
[root@rabbitmq-1 ~]# chown rabbitmq.rabbitmq /data/ -R
创建配置文件:
[root@rabbitmq-1 ~]# vim /etc/rabbitmq/rabbitmq-env.conf
[root@rabbitmq-1 ~]# cat /etc/rabbitmq/rabbitmq-env.conf
RABBITMQ_MNESIA_BASE=/data/rabbitmq/data
RABBITMQ_LOG_BASE=/data/rabbitmq/logs
重启服务
[root@rabbitmq-1 ~]# systemctl restart rabbitmq-server
```

#### 2.拷⻉.erlang.cookie----覆盖

Rabbitmq的集群是依附于erlang的集群来⼯作的,所以必须先构建起erlang的集群景象。Erlang的集群中

各节点是经由⼀个cookie来实现的,这个cookie存放在/var/lib/rabbitmq/.erlang.cookie中，⽂件是400的权限。所以必须保证各节点cookie⼀致,不然节点之间就⽆法通信.

如果执行# rabbitmqctl stop_app 这条命令报错:需要执行

```shell
#如果执行# rabbitmqctl stop_app 这条命令报错:需要执行
#chmod 400 .erlang.cookie
#chown rabbitmq.rabbitmq .erlang.cookie
```

(官方在介绍集群的文档中提到过.erlang.cookie 一般会存在这两个地址：第一个是home/.erlang.cookie；第二个地方就是/var/lib/rabbitmq/.erlang.cookie。如果我们使用解压缩方式安装部署的rabbitmq，那么这个文件会在{home}目录下，也就是$home/.erlang.cookie。如果我们使用rpm等安装包方式进行安装的，那么这个文件会在/var/lib/rabbitmq目录下。)

```shell
# 覆盖副节点的cookie
[root@rabbitmq-1 ~]# cat /var/lib/rabbitmq/.erlang.cookie
HOUCUGJDZYTFZDSWXTHJ
⽤scp的⽅式将rabbitmq-1节点的.erlang.cookie的值复制到其他两个节点中。
[root@rabbitmq-1 ~]# scp /var/lib/rabbitmq/.erlang.cookie root@192.168.50.139:/var/lib/rabbitmq/
[root@rabbitmq-1 ~]# scp /var/lib/rabbitmq/.erlang.cookie root@192.168.50.140:/var/lib/rabbitmq/
```

#### 3.将mq-2、mq-3作为内存节点加⼊mq-1节点集群中

```shell
# 停止stop_app会报错,在则之前查看下进程，杀死进程，重新启动服务
ps -ef |grep rabbitmq	//查看进程号
kill -9 [进程名]
systemctl start rabbitmq-server

在mq-2、mq-3执⾏如下命令：
[root@rabbitmq-2 ~]# rabbitmqctl stop_app  #停止节点，切记不是停止服务---需要杀进程重新启动
[root@rabbitmq-2 ~]# rabbitmqctl reset   #如果有数据需要重置，没有则不用
[root@rabbitmq-2 ~]# rabbitmqctl join_cluster --ram rabbit@rabbitmq-1  #添加到磁盘节点
Clustering node 'rabbit@rabbitmq-2' with 'rabbit@rabbitmq-1' ...
[root@rabbitmq-2 ~]# rabbitmqctl start_app  #启动节点
Starting node 'rabbit@rabbitmq-2' ...
======================================================================
[root@rabbitmq-3 ~]# rabbitmqctl stop_app
Stopping node 'rabbit@rabbitmq-3' ...
[root@rabbitmq-3 ~]# rabbitmqctl reset
Resetting node 'rabbit@rabbitmq-3' ...
[root@rabbitmq-3 ~]# rabbitmqctl join_cluster --ram rabbit@rabbitmq-1
Clustering node 'rabbit@rabbitmq-3' with 'rabbit@rabbitmq-1' ...
[root@rabbitmq-3 ~]# rabbitmqctl start_app
Starting node 'rabbit@rabbitmq-3' ...

（1）默认rabbitmq启动后是磁盘节点，在这个cluster命令下，mq-2和mq-3是内存节点，
mq-1是磁盘节点。
（2）如果要使mq-2、mq-3都是磁盘节点，去掉--ram参数即可。
（3）如果想要更改节点类型，可以使⽤命令rabbitmqctl change_cluster_node_type
disc(ram),前提是必须停掉rabbit应⽤
注:
#如果有需要使用磁盘节点加入集群
 [root@rabbitmq-2 ~]# rabbitmqctl join_cluster  rabbit@rabbitmq-1
 [root@rabbitmq-3 ~]# rabbitmqctl join_cluster  rabbit@rabbitmq-1
```

#### 4、查看集群状态

```shell
在 RabbitMQ 集群任意节点上执行 rabbitmqctl cluster_status来查看是否集群配置成功。
在mq-1磁盘节点上面查看
[root@rabbitmq-1 ~]# rabbitmqctl cluster_status
```

#### 5.登录rabbitmq web管理控制台，创建新的队列

打开浏览器输⼊http://192.168.50.138:15672, 输⼊默认的Username：guest，输⼊默认的

Password:guest 

### RabbitMQ镜像集群配置

**创建镜像集群**

rabbitmq set_policy ：设置策略

```shell
[root@rabbitmq-1 ~]# rabbitmqctl set_policy  ha-all "^" '{"ha-mode":"all"}'
Setting policy "ha-all" for pattern "^" to "{"ha-mode":"all"}" with priority "0" for vhost "/" ...

[root@rabbitmq-1 ~]# rabbitmqctl set_policy  ha-all(策略名) "^(队列名)" '{"ha-mode":"all"}'
[root@rabbitmq-1 ~]# rabbitmqctl set_policy  ha-all-1(策略名) "^(队列名)" '{"ha-mode":"all"}'
[root@rabbitmq-1 ~]# rabbitmqctl set_policy -p xu ha-all-1(策略名) "^(队列名)" '{"ha-mode":"all"}'

set_policy	指定策略
-p 指定虚拟主机名
ha-all	策略名
^	队列名
```

**"^"匹配所有的队列，策略名称为ha-all, '{"ha-mode":"all"}' 策略模式为 all 即复制到所有节点，包含新增节点。**

```shell
设置策略介绍:
rabbitmqctl set_policy [-p Vhost] Name Pattern Definition
-p Vhost： 可选参数，针对指定vhost下的queue进行设置
Name: policy的名称，可以定义
Pattern: queue的匹配模式(正则表达式),也就是说会匹配一组。
Definition：镜像定义，包括ha-mode,ha-params,ha-sync-mode
    ha-mode:指明镜像队列的模式
        all：表示在集群中所有的节点上进行镜像
        exactly：表示在指定个数的节点上进行镜像，节点的个数由ha-params指定
    ha-sync-mode：进行队列中消息的同步方式，有效值为automatic和manual
    ha-params：ha-mode模式需要用到的参数
案例:
例如，对队列名称以hello开头的所有队列进行镜像，并在集群的两个节点上完成镜像，policy的设置命令为： 
rabbitmqctl set_policy hello-ha “^hello” ‘{“ha-mode”:”exactly”,”ha-params”:2,”ha-sync-mode”:”automatic”}’
```

则此时镜像队列设置成功。已经部署完成

