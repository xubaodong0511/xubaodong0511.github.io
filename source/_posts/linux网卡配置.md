---
title: linux网卡配置
author: Mr.xu
date: 2025-01-08 19:45:48
tags: [linux, network]
---

**永久设置网卡**
> `另外也可以在终端上输入nmtui，进入网卡设置界面`

**1、Centos 7 配置**
```shell
Centos 7
# vim	/etc/sysconfig/network-scripts/ifcfg-ens33 		//网卡配置文件的路径
TYPE=Ethernet			//网卡类型
BOOTPROTO=dhcp 			//网卡模式
     -->  dhcp 			//自动获取
     -->  static 		//手动获取
     -->  none 			//手动获取
NAME=ens33 				//网卡名称（可以修改的）
DEVICE=ens33 			//设备名称
ONBOOT=yes 				//网卡开关
IPADDR=192.168.10.104	//IP地址
PREFIX=24				//子网掩码
NETMASK=255.255.255.0 	//子网掩码
GATEWAY=192.168.10.2 	//网关
DNS1=192.168.10.2 		//DNS
```
**重启**
```shell
systemctl restart network 		//重启网卡生效配置
```

**2、Centos 9 配置**
```shell
Centos9
# vim /etc/NetworkManager/system-connections/ens33.nmconnection  //修改如下选项即可
address=192.168.10.120/24,192.168.26.2 	 //ip地址，子网掩码，网关
dns=192.168.10.2       //DNS
method=manual 						
   --> manual          //手动
   --> auto            //自动
```
**重启**
```shell
nmcli c reload      //重启网络服务 
nmcli c down ens33  //开启网络 
nmcli c up ens33    //关闭网络
```

**3、当network和networkmanager 网卡冲突**
```
systemctl stop NetworkManager 

systemctl disabled NetworkManager   //将NetworkManger停止

ifup ens33          //输入此命令即可查看ens33网卡

systemctl restart network          //重启网卡服务

# 此时应该就可以看到ens33的IP地址了
```

