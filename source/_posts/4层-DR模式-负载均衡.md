---
title: 4层--DR模式--负载均衡实验
author: Mr.xu
date: 2025-11-06 21:05:12
tags:
---

环境准备

`准备3台纯洁的虚拟机，2台web服务器`

安装lvs管理软件

```shell
yum -y install ipvsadm
```

```ini
程序包：ipvsadm（LVS管理工具）

主程序：/usr/sbin/ipvsadm

规则保存工具：/usr/sbin/ipvsadm-save  > /path/to/file

配置文件：/etc/sysconfig/ipvsadm-config
```

LVS/DR 模式

```ini
DR模式的组网要求LVS和Real server在同一网段二层互通。因为LVS DR模式在负载均衡转发报文时，只修改目的mac为real server的mac，lvs要能将报文转发给real server，就必须满足LVS和real server是同网段二层互通。
```

实验说明：
`1.网络使用NAT模式`
`2.DR模式要求Director DIP 和 所有RealServer RIP必须在同一个网段及广播域`

1、关闭防火墙

```shell
[root@lvs-server ~]# systemctl stop firewalld
[root@lvs-server ~]# setenforce 0
```

2、负载均衡器的配置

```shell
[root@lvs-server ~]# ip addr add dev ens33 192.168.246.160/32 #设置VIP
[root@lvs-server ~]# yum install -y ipvsadm   #RHEL确保LoadBalancer仓库可用
[root@lvs-server ~]# service ipvsadm start  #启动
注意:启动如果报错: /bin/bash: /etc/sysconfig/ipvsadm: 没有那个文件或目录
需要手动生成文件
[root@lvs-server ~]# ipvsadm --save > /etc/sysconfig/ipvsadm

为什么RS上lo配置的VIP掩码为32位
这是由于lo设备的特殊性导致， 如果lo绑定VIP/24，则该设备会响应该网段所有IP(192.168.246.0-254)的请求，而不是只响应192.168.246.160这一个地址。,就算是不设置为32也是可以的，只不过会影响访问
```

定义LVS分发策略

```shell
-A：添加VIP
-t：用的是tcp协议
-a：添加的是lo的vip地址
-r：转发到real-serve rip
-s：算法
-L|-l –list #显示内核虚拟服务器表
--numeric, -n：#以数字形式输出地址和端口号
-g --gatewaying #指定LVS工作模式为直接路由器模式（也是LVS默认的模式）
-S -save #保存虚拟服务器规则到标准输出，输出为-R 选项可读的格式
rr：轮循
如果添加ip错了，删除命令如下:
# ip addr del 192.168.246.193 dev ens33
```

```shell
[root@lvs-server ~]# ipvsadm -C  #清除内核虚拟服务器表中的所有记录。
[root@lvs-server ~]# ipvsadm -A -t 192.168.246.160:80 -s rr 
[root@lvs-server ~]# ipvsadm -a -t 192.168.246.160:80 -r 192.168.246.161 -g
[root@lvs-server ~]# ipvsadm -a -t 192.168.246.160:80 -r 192.168.246.162 -g 
[root@lvs-server ~]# service ipvsadm save #保存方式一，使用下面的保存方式，版本7已经不支持了
[root@lvs-server ~]# ipvsadm -S > /etc/sysconfig/ipvsadm  #保存方式二，保存到一个文件中
[root@lvs-server ~]# ipvsadm -ln
IP Virtual Server version 1.2.1 (size=4096)
Prot LocalAddress:Port Scheduler Flags
  -> RemoteAddress:Port           Forward Weight ActiveConn InActConn
TCP  192.168.246.160:80 rr
  -> 192.168.246.161:80           Route   1      0          0         
  -> 192.168.246.162:80           Route   1      0          0         
[root@lvs-server ~]# ipvsadm -L -n
```

3、配置RS后端机器

```shell
[root@real-server1 ~]# yum install -y nginx
[root@real-server1 ~]# echo "real-server1" >> /usr/share/nginx/html/index.html
两台机器都安装，按顺序添加不同的主机名以示区分
[root@real-server1 ~]# ip addr add dev lo 192.168.246.160/32   #在lo接口上绑定VIP
[root@real-server1 ~]# echo 1 > /proc/sys/net/ipv4/conf/all/arp_ignore  #忽略arp广播
[root@real-server1 ~]# echo 2 > /proc/sys/net/ipv4/conf/all/arp_announce #匹配精确ip地址回包
[root@real-server1 ~]# systemctl start nginx 
[root@real-server1 ~]# systemctl enable  nginx 

#关闭65秒的控制刷新
[root@real-server1 ~]# vim /etc/nginx/nginx.conf
65--改成--0
[root@real-server1 ~]# systemctl restart nginx 
=============================================================================
因为：realServer的vip有了，接着就是同一个网段中拥有两个vip, 客户端在网关发送arp广播需找vip时需要让realServer不接受响应.  
解决：
echo 1 >/proc/sys/net/ipv4/conf/eth0/arp_ignore 
arp_ignore 设置为1，意味着当别人的arp请求过来的时候，如果接收的设备没有这个ip，就不做出响应(这个ip在lo上，lo不是接收设备的进口)
echo 2 >/proc/sys/net/ipv4/conf/eth0/arp_announce   
使用最好的ip来回应，什么是最好的ip？同一个网段内子网掩码最长的
```

4、测试

```
测试一
在游览器上输入vip地址

测试二
[root@client ~]# elinks -dump http://192.168.246.160
-dump:非交互式模式
```

