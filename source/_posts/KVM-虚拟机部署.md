---
title: KVM 虚拟机部署
author: Mr.xu
date: 2025-11-06 20:53:28
tags:
---

## 什么是虚拟化:

```ini
vmm、Hypervisor 是提供真正虚拟机管理程序的，---创建，删除-开关机。

Hypervisor是属于内核功能的，操作系统内核的一个模块。把和内核交互的工具称之为用户肽工具：比如：virsh命令行、virt-manager图形界面，
```

## 虚拟化产品分类:
`桌面级虚拟化`
`企业级虚拟机化`

## 虚拟化产品分类：

```ini
1.Kvm（redhat-----企业级）
2.Vmware:
Vmware-workstation(windows和linux)----桌面级
Vmware-fusion(mac)
Vmware-esxi-----(企业级别)本身就是一个操作系统。
3.hyper-v(微软）
4.Ovm（oracle公司--Windows linux） virtulbox
5.Xen（rhel6之前所有版本默认用的虚拟化产品）
```

## 部署

**第一步先在VMware上创建一个虚拟机（内存能多大就做多大）**

`虚拟机安装好，打开设置--处理器--虚拟化引擎--勾选第一个`


![kvm1.webp](/upload/kvm1.webp)

**打开虚拟机，查看cpu是否支持虚拟化**

```ini
[root@kvm-server ~]# cat /proc/cpuinfo | grep -E 'vmx|svm'
cmx|svm支持其中一个就可以
```

## 构建环境

`关闭防火墙和selinux`

```ini
清理环境，卸载机器自带的kvm
[root@kvm-server ~]# yum -y remove `rpm -qa | egrep 'qemu|virt|kvm'`
#删除储存虚拟机的介质、虚拟机配置文件
[root@kvm-server ~]# rm -rf /var/lib/libvirt  /etc/libvirt/
#升级所有包同时也升级软件和系统内核
[root@kvm-server ~]# yum upgrade -y
#安装软件
[root@kvm-server ~]# yum install *qemu*  *virt*  librbd1-devel -y
其实下载的是下面几款软件
# qemu-kvm libvirt virt-manager  librbd1-devel
qemu-kvm ： 主包
libvirt：api接口
virt-manager：图形化界面

#在所谓的kvm技术中，应用到的其实有2个东西：qemu+kvm
kvm负责cpu虚拟化+内存虚拟化，实现了cpu和内存的虚拟化，但kvm不能模拟其他设备；
qemu是模拟IO设备（网卡，磁盘），kvm加上qemu之后就能实现真正意义上服务器虚拟化。
因为用到了上面两个东西，所以一般都称之为qemu-kvm。
libvirt则是调用kvm虚拟化技术的接口用于管理的，用libvirt管理方便，直接用qemu-kvm的接口太繁琐。

#启动服务
[root@kvm-server ~]# systemctl start libvirtd
#查看kvm模块加载
[root@kvm-server ~]# lsmod | grep kvm
kvm_intel             188644  0 
kvm                   621480  1 kvm_intel
irqbypass              13503  1 kvm
如果看到有这两行，说明支持kvm模块
```

**下面就可以在VMware里面再安装虚拟机了**

## 图形添加虚拟机

```ini
在终端输入virt-manager--点击电脑图标创建--本地安装介质--选择使用ISO映像，另外
```

![kvm2.png](https://xbd666.cn/upload/kvm2.webp)

![kvm3.png](https://xbd666.cn/upload/kvm3.webp)

![kvm4.png](https://xbd666.cn/upload/kvm4.webp)

![kvm5.png](https://xbd666.cn/upload/kvm5.webp)

![kvm6.png](https://xbd666.cn/upload/kvm6.webp)

![kvm7.png](https://xbd666.cn/upload/kvm7.webp)

## 文本添加虚拟机

```ini
#安装ftp，并配置最后将镜像上传到ftp中
[root@kvm-server ~]# yum install -y vsftpd
[root@kvm-server ~]# mkdir /var/ftp/centos7u4
[root@kvm-server ~]# mount /root/CentOS-7-x86_64-DVD-1708.iso /var/ftp/centos7u4/
[root@kvm-server ~]# virt-install --connect qemu:///system -n vm10 -r 2050 --disk path=/var/lib/libvirt/images/vm10.img,size=5  --os-type=linux --os-variant=centos7.0 --vcpus=1  --location=ftp://10.0.111.182/centos7u4 -x console=ttyS0 --nographics

注意:
virt-install 
bash: virt-install: 未找到命令...
# yum install libguestfs-tools -y
# yum install virt-install.noarch -y

如果还是有问题没办法安装，需要vsftp匿名授权，添加以下内容
vim /etc/vsftpd/vsftpd.conf		//配置文件
anonymous_enable=YES 		 	//开启匿名登录
anon_upload_enable=YES 			//匿名读
anon_mkdir_write_enable=YES 	//匿名写

# 重启下vsftp
[root@kvm-server ~]# systemctl restart vsftpd

参数解释：
-n name
-r  以M为单位指定分配给虚拟机的内存大小
--disk 指定作为客户机存储的媒介 size以G为单位的存储
--os-type   系统类型
--os-variant 系统类型版本
--vcpus 指定核数，不能超过物理cpu
--location  客户虚拟机安装源下载，必须为镜像挂载在ftp目录下
-x console=ttyS0 执行终端0
--nographics 无图形，文本模式

#以下就是进入命令安装
1、选2，进入use text mode
2、将所有的！进行编辑，编辑好的状态是×
3、更改时间选2 -- 1 set timezone-- 2 Asia -- 65 Shanghai
4、设置磁盘5 -- c to continue -- 2 Use All Space -- c to continue -- 3 LVM -- c to continue 
5、设置密码8 -- 自己设定一个密码 -- yes
6、设置完成-- b
7、开始创建，大概20分钟左右
8、出现installation complete. press return to quit--按回车退出--下面的操作根据提示点点就可以了
```

## 模板镜像+配置文件 方式安装虚拟机---重点

```ini
1.虚拟机配置文件
[root@kvm-server ~]# ls /etc/libvirt/qemu
networks  vm2.xml
2.储存虚拟机的介质
[root@kvm-server ~]# ls /var/lib/libvirt/images/
vm2.img
==============================
define方式创建好，不会启动
create方式创建好，会启动

# 拷贝模板镜像和配置文件
[root@kvm-server ~]# cp /etc/libvirt/qemu/vm2.xml /etc/libvirt/qemu/vm3.xml(自定义名字)
[root@kvm-server ~]# cp /var/lib/libvirt/images/vm2.img /var/lib/libvirt/images/vm3.img (自定义名字)
# 修改配置文件
[root@kvm-server ~]# vim /etc/libvirt/qemu/vm3.xml
domain type='kvm'>
  <name>vm3</name>  #名字不能一样需要修改
  <uuid>2e3fa6db-ff7f-41c3-bc8f-0428e81ebb57</uuid> #uuid不能一样需要修改
  <memory unit='KiB'>1024000</memory>  #内存，可选
  <currentMemory unit='KiB'>1024000</currentMemory>  #当前内存与上面定义一样
  <vcpu placement='static'>2</vcpu>  #cpu可选
  <os>
  。。。
  。。。
  。。。
    <devices>
    <emulator>/usr/libexec/qemu-kvm</emulator>
    <disk type='file' device='disk'>
      <driver name='qemu' type='qcow2'/>
      <source file='/var/lib/libvirt/images/vm3.img'/>   #磁盘镜像需要修改
      <target dev='vda' bus='virtio'/>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x07' function='0x0'/>
    </disk>
 。。。
 。。。
 。。。
     </controller>
    <interface type='network'>
      <mac address='52:54:00:82:d6:3c'/>  #mac地址不能一样需要修改，只能修改后三段。
      <source network='default'/>
      <model type='virtio'/>

#必须修改name，uuid,mac地址,磁盘文件名字,其余可选

用vim修改完之后需要define一下配置文件
[root@kvm-server ~]# virsh define /etc/libvirt/qemu/vm3.xml
重启一下：
[root@kvm-server ~]# systemctl restart libvirtd
宿主机开启路由转发：
[root@kvm-server ~]# vim /etc/sysctl.conf 
[root@kvm-server ~]# sysctl -p
net.ipv4.ip_forward = 1
查看虚拟机列表：
[root@kvm-server ~]# virsh list --all
 Id    名称                         状态
----------------------------------------------------
 -     vm2                            关闭
 -     vm3                            关闭
```

## KVM虚拟机管理

```ini
[root@kvm-server ~]# virsh list  #列出在运行状态中的虚拟机
[root@kvm-server ~]# virsh list --all  #列出所有虚拟机
查看kvm虚拟机配置文件：
#语法：virsh dumpxml vm_name
[root@kvm-server ~]# virsh dumpxml vm3

启动
[root@kvm-server ~]# virsh start vm2
域 vm2 已开始

暂停虚拟机：
[root@kvm-server ~]# virsh suspend vm_name
域 vm2 被挂起

恢复虚拟机：
[root@kvm-server ~]# virsh resume vm_name
域 vm2 被重新恢复

关闭：
方法1：
[root@kvm-server ~]# virsh shutdown vm3
域 vm3 被关闭

重启：
[root@kvm-server ~]# virsh reboot vm3
域 vm3 正在被重新启动

重置:
[root@kvm-server ~]# virsh reset vm3
vm3   #断电重启。速度快
Domain vm3 was reset

删除虚拟机:
[root@kvm-server ~]# virsh undefine vm2
Domain vm2 has been undefined
注意:虚拟机在开启的情况下undefine是无法删除的只是将配置文件删除了，不能删除磁盘文件。需要手动rm，最好还是在virt-manager里面右击删除

虚拟机开机自动启动:
#如果虚拟机开机自启，里面的服务应该设置的有开机自启，不然没有意义
[root@kvm-server ~]# virsh autostart vm_name
域 vm3标记为自动开始

[root@kvm-server ~]# ls /etc/libvirt/qemu/autostart/     //此目录默认不存在，在有开机启动的虚拟机时自动创建
vm3.xml

关闭开机启动
[root@kvm-server ~]# virsh autostart --disable vm_name
域 vm3取消标记为自动开始
[root@kvm-server ~]# ls /etc/libvirt/qemu/autostart/

如何查看已启动的虚拟机ip地址
假如vm3虚拟机已启动
[root@kvm-server ~]# virsh domifaddr vm3
 名称     MAC 地址           Protocol     Address
-------------------------------------------------------------------------------
 vnet0      52:54:00:82:d6:3c    ipv4         192.168.122.85/24
```

## 虚拟机添加设备

1、图像方式添加

```ini
输入virt-manager--右击点击你想要添加设备的虚拟机--查看--详情--左下角--添加硬件--安装需求添加就可以了
```

2、修改配置文件方式添加

```ini
[root@kvm-server ~]# qemu-img create -f qcow2 /var/lib/libvirt/images/vm4-1.qcow2 5G
[root@kvm-server ~]# cd /etc/libvirt/qemu/
[root@kvm-server qemu]# vim vm3.xml
```

![kvm8.png](https://xbd666.cn/upload/kvm8.webp)

```ini
加好之后，启动虚拟机
[root@kvm-server qemu]# systemctl restart libvirtd
[root@kvm-server qemu]# virsh list --all
 Id    名称                         状态
----------------------------------------------------
 6     centos7.0                      running
 -     vm3                            关闭
[root@kvm-server qemu]# virsh start vm3

可以看到我们新添加的磁盘vdb
#然后可以正常分区，制作文件系统，进行挂载
```


![kvm9.png](https://xbd666.cn/upload/kvm9.webp)

## 虚拟机克隆

1.图形界面：Applications （左上角）-----> System Tools ------>Virtual Machine Manager
   `关闭要克隆的虚拟机，右键点击虚拟机选择Clone`


![kvm10.png](https://xbd666.cn/upload/kvm10.webp)

2.在终端执行命令克隆

```ini
[root@kvm-server ~]# virt-clone -o vm2 -n vm5 --auto-clone
正在分配 'vm5.qcow2'                                    | 5.0 GB  00:00     
成功克隆 'vm5'。
-o      origin-原始
-n :指定新客户机的名字

[root@kvm-server ~]# virsh list --all
 Id    名称                         状态
----------------------------------------------------
 -     vm2                            关闭
 -     vm5		                      关闭
```
## kvm高级命令

磁盘镜像文件的格式：`raw  qcow2`

- raw：立刻分配空间，不管你有没有用到那么多空间
- qcow2：只是承诺给你分配空间，但是只有当你需要用空间的时候，才会给你空间。最多只给你承诺空间的大小，避免空间浪费

## 建立qcow2格式磁盘文件

```ini
[root@kvm-server images]# pwd
/var/lib/libvirt/images
#创建qcow2格式磁盘格式文件（vm1.qcow2是自定义的磁盘名字）
[root@kvm-server images]# qemu-img create -f qcow2 vm1.qcow2 5G
Formatting 'vm1.qcow2', fmt=qcow2 size=5368709120 encryption=off cluster_size=65536 lazy_refcounts=off 

#创建raw格式磁盘格式文件（vm2.raw是自定义的磁盘名字）
[root@kvm-server images]# qemu-img create -f raw vm2.raw 5G
Formatting 'vm2.raw', fmt=raw size=5368709120 

#查看已经创建的虚拟磁盘文件
[root@kvm-server images]# qemu-img info vm1.qcow2
[root@kvm-server images]# qemu-img info vm2.raw
```

## 挂载磁盘

```ini
# 将虚拟机先关闭
查看vm2磁盘镜像分区信息--（需要等一会会）
[root@kvm-server images]# virt-df -h -d vm2
文件系统                                  大小      已用空间    可用空间     使用百分比%
vm2:/dev/sda1                            1014M        92M       922M         10%
vm2:/dev/centos/root                      3.5G       863M       2.6G         25%

# 创建一个挂载目录
[root@kvm-server ~]# mkdir /test
#挂载虚拟机的根分区到test目录
[root@kvm-server ~]# guestmount -d vm2 -m /dev/centos/root --rw /test/
[root@kvm-server ~]# ll /test
bin   dev  home  lib64  mnt  proc  run   srv  tmp  var
boot  etc  lib   media  opt  root  sbin  sys  usr

# 取消挂载
[root@kvm-server ~]# guestunmount /test
```

## KVM存储配置

```ini
#kvm默认存储池的位置：
    /var/lib/libvirt/images/    
```

1、图形方式创建存储池

![kvm2.png](https://xbd666.cn/upload/kvm11.webp)

![kvm2.png](https://xbd666.cn/upload/kvm12.webp)

![kvm2.png](https://xbd666.cn/upload/kvm13.webp)

![kvm2.png](https://xbd666.cn/upload/kvm14.webp)

2、命令方式创建存储池

```ini
1.创建基于文件夹的存储池（目录，可自定义）
[root@kvm-server ~]# mkdir -p /data/vmfs

2.定义存储池与其目录--（vm1是存储池名字，自己自定义）
[root@kvm-server ~]# virsh pool-define-as vm1 --type dir --target /data/vmfs
Pool vm1 defined

3.创建已定义的存储池
(1)构建已定义的存储池
[root@kvm-server ~]# virsh pool-build vm1
Pool vm1 built

(2)查看已定义的存储池，存储池不激活无法使用。
[root@kvm-server ~]# virsh pool-list --all
Name                 State      Autostart 
-------------------------------------------
 default             active       yes       
 ISO                 active       yes       
 vm1              inactive     no     
 
4.激活并自动启动已定义的存储池
[root@kvm-server ~]# virsh pool-start vm1
Pool vm1 started
[root@kvm-server ~]# virsh pool-autostart vm1
Pool vm1 marked as autostarted

#此时查看都是在运行中，并且是开机自启
[root@kvm-server ~]# virsh pool-list --all
 Name                 State      Autostart 
-------------------------------------------
 default              active     yes       
 ISO                 active     yes       
 vm1               active     yes   
这里vm1存储池就已经创建好了，可以直接在这个存储池中创建虚拟磁盘文件了。

5.在存储池中创建虚拟机存储卷--（vm1-1.qcow2是自定义存储卷的名字，2G是自定义的大小）
[root@kvm-server ~]# virsh vol-create-as vm1 vm1-1.qcow2 2G --format qcow2 
Vol vm1-1.qcow2 created


[root@kvm-server ~]# ll /data/vmfs/ -h
总用量 196K
-rw------- 1 root root 193K 10月 25 16:04 vm1-1.qcow2

6.存储池相关管理命令
(1)在存储池中删除虚拟机存储卷
[root@kvm-server ~]# virsh vol-delete --pool vm1 vm1-1.qcow2
Vol vm1-1.qcow2 deleted

(2)取消激活存储池
[root@kvm-server ~]# virsh pool-destroy vm1
Pool vm1 destroyed

(3)删除存储池定义的目录/data/vmfs
[root@kvm-server ~]# virsh pool-delete vm1
Pool vm1 deleted

(4)取消定义存储池
[root@kvm-server ~]# virsh pool-undefine vm1
Pool vm1 has been undefined

到此kvm存储池配置与管理操作完毕。 
```

## kvm快照

1、图形方式创建快照

![kvm2.png](https://xbd666.cn/upload/kvm15.webp)

2、命令方式创建快照

```ini
为虚拟机vm2创建一个快照（磁盘格式必须为qcow2）
[root@kvm-server ~]# virsh snapshot-create-as vm2 vm2.snap1

注意：如果在创建快照的时候报错：
error: unsupported configuration: internal snapshot for disk vda unsupported for storage type raw

#raw不支持snapshot--可以将raw格式转换成qcow2格式

查看磁盘文件格式
[root@kvm-server images]# qemu-img info /var/lib/libvirt/images/vm2.qcow2
image: /var/lib/libvirt/images/vm2.qcow2
file format: qcow2
virtual size: 5.0G (5368709120 bytes)
disk size: 5.0G
cluster_size: 65536
Format specific information:
    compat: 1.1
    lazy refcounts: true
```

```ini
# 查看某台虚拟机设备的快照
[root@kvm-server ~]# virsh snapshot-list  vm2   
 Name                 Creation Time             State
------------------------------------------------------------

# 创建一块磁盘
创建--格式为raw，名字为vm2-1.raw，大小为2G的磁盘
[root@kvm-server ~]# qemu-img create -f raw /var/lib/libvirt/images/vm2-1.raw 2G
Formatting '/var/lib/libvirt/images/vm2-1.raw', fmt=raw size=2147483648 
# 查看
[root@kvm-server ~]# ll -h /var/lib/libvirt/images/vm2-1.raw
-rw-r--r-- 1 root root 2.0G 10月 25 16:25 /var/lib/libvirt/images/vm2-1.raw

# 将其添加到vm2虚拟机上面
[root@kvm-server ~]# cd /etc/libvirt/qemu/
[root@kvm-server qemu]# vim vm2.xml 
```

![kvm2.png](https://xbd666.cn/upload/kvm16.webp)

```ini
# 定义配置文件
[root@kvm-server images]# virsh define /etc/libvirt/qemu/vm2.xml
[root@kvm-server images]# virsh start vm2

# 验证raw格式是不能拍快照的
[root@kvm-server qemu]# virsh snapshot-create-as vm2 vm2.snap1
错误：不支持的配置：存储类型 vdb 不支持磁盘 raw 的内部快照


# 磁盘格式的转换
由于raw的磁盘格式，不支持快照功能，我们需要将其转换为qcow2的格式
[root@kvm-server qemu]# qemu-img convert -O qcow2 /var/lib/libvirt/images/vm2-1.raw  /var/lib/libvirt/images/vm2-1.qcow2

[root@kvm-server qemu]# cd /var/lib/libvirt/images/
[root@kvm-server images]# ll -h 
总用量 21G
-rw------- 1 root root 5.1G 10月 24 18:59 centos7.0.qcow2
-rw-r--r-- 1 root root 193K 10月 25 16:44 vm2-1.qcow2
-rw-r--r-- 1 root root 2.0G 10月 25 16:25 vm2-1.raw
-rw------- 1 root root 5.1G 10月 25 16:13 vm2.qcow2

# 查看
[root@kvm-server images]# qemu-img info /var/lib/libvirt/images/vm2-1.qcow2
image: /var/lib/libvirt/images/vm2-1.qcow2
file format: qcow2
virtual size: 2.0G (2147483648 bytes)
disk size: 196K
cluster_size: 65536
Format specific information:
    compat: 1.1
    lazy refcounts: false
    
# 然后去修改vm2虚拟机的磁盘格式和名称
[root@kvm-server images]# vim /etc/libvirt/qemu/vm2.xml
```

![kvm2.png](https://xbd666.cn/upload/kvm17.webp)

```ini
[root@kvm-server images]# virsh define /etc/libvirt/qemu/vm2.xml

# 创建快照
[root@kvm-server qemu]# virsh snapshot-create-as vm2 vm2.snap2
已生成域快照 vm2.snap2
# 此时raw格式转换成qcow2格式，并快照成功

以下操作为回溯快照
# 开机并再次创建快照-- 选择一台虚拟机进行快照，此时处于关闭状态
[root@kvm-server ~]# virsh snapshot-create-as vm3 vm3-snap1
已生成域快照 vm3-snap1

#此时开启vm3虚拟机，并进行快照
[root@kvm-server ~]# virsh start vm3
[root@kvm-server ~]# virsh snapshot-create-as vm3 vm3-snap2
已生成域快照 vm3-snap2

查看快照
[root@kvm-server ~]# virsh snapshot-list vm3 
 名称               生成时间              状态
------------------------------------------------------------
 vm3-snap1            2019-10-30 15:27:15 +0800 running
 vm3-snap2            2019-10-30 15:29:37 +0800 shutoff


# 恢复到快照vm3-snap1，现在虚拟机处于开启状态
[root@kvm-server ~]# virsh snapshot-revert vm3 vm3-snap1
此时你再看虚拟机状态，是处于关闭状态

删除虚拟机快照操作：--需要先关闭虚拟机
[root@kvm-server ~]# virsh shutdown vm3
[root@kvm-server ~]# virsh snapshot-list vm3
 名称               生成时间              状态
------------------------------------------------------------
 vm3-snap1            2019-10-30 15:27:15 +0800 running
 vm3-snap2            2019-10-30 15:29:37 +0800 shutoff

# 删除快照
[root@kvm-server ~]# virsh snapshot-delete --snapshotname vm3-snap2 vm3
已删除域快照 vm2-snap3

# 查看验证
[root@kvm-server ~]# virsh snapshot-list vm3
 名称               生成时间              状态
------------------------------------------------------------
 vm3-snap1            2019-10-30 15:27:15 +0800 running
```

## 自动化脚本管理kvm

`运行脚本需要先更改好配置文件内容`

```ini
#!/bin/bash
#kvm batch create vm tool
#version:0.1
#time:2024-1-7
#author:清风
#需要事先准备模板镜像和配置文件模板

batch_self_define() {

        kvmname=`openssl rand -hex 5`

        sourceimage=/var/lib/libvirt/images/vmmodel.img
        sourcexml=/etc/libvirt/qemu/vmmodel.xml

        newimg=/var/lib/libvirt/images/${kvmname}.img
        newxml=/etc/libvirt/qemu/${kvmname}.xml

        cp $sourceimage  $newimg
        cp $sourcexml $newxml

        kvmuuid=`uuidgen`
        kvmmem=${1}000000
        kvmcpu=$2
        
        
        kvmimg=$newimg
        kvmmac=`openssl rand -hex 3 | sed -r 's/..\B/&:/g'`

        sed -i "s@kvmname@$kvmname@;s@kvmuuid@$kvmuuid@;s@kvmmem@$kvmmem@;s@kvmcpu@$kvmcpu@;s@kvmimg@$kvmimg@;s@kvmmac@$kvmmac@" $newxml
        virsh define $newxml
        virsh list --all
}

self_define() {
        read -p "请输入新虚机名称:" newname
        read -p "请输入新虚机内存大小(G):" newmem
        read -p "请输入新虚机cpu个数:" newcpu

        sourceimage=/var/lib/libvirt/images/vmmodel.img
        sourcexml=/etc/libvirt/qemu/vmmodel.xml

        newimg=/var/lib/libvirt/images/${newname}.img
        newxml=/etc/libvirt/qemu/${newname}.xml

        cp $sourceimage  $newimg
        cp $sourcexml $newxml

        kvmname=$newname
        kvmuuid=`uuidgen`
        kvmmem=${newmem}000000
        kvmcpu=$newcpu
        kvmimg=$newimg
        kvmmac=`openssl rand -hex 3 | sed -r 's/..\B/&:/g'`

        sed -i "s@kvmname@$kvmname@;s@kvmuuid@$kvmuuid@;s@kvmmem@$kvmmem@;s@kvmcpu@$kvmcpu@;s@kvmimg@$kvmimg@;s@kvmmac@$kvmmac@" $newxml
        virsh define $newxml
        virsh list --all
}

delete_kvm(){
        virsh list
        while true;do
        read -p "是否需要关闭lvm或退出（Y/N/T）" ynt
        if [ $ynt = y ];then
                read -p "请输入你要关闭的kvm：" numb
                virsh shutdown $numb
        elif [ $ynt = n ];then
                virsh list --all
                read -p "请输入你要删除的kvm：" num
                virsh undefine $num
                #rm -rf /etc/libvirt/qemu/$num.xml
                rm -rf /var/lib/libvirt/images/$num*
                echo "$num 虚拟机已被删除！"
        else
                echo "再见！"
                break
        fi
        done
}  

exit_menu(){
    green "再见！！！"
    break
}     

red(){
    echo -e "\033[31m\033[01m$1\033[0m"
}
green(){
    echo -e "\033[32m\033[01m$1\033[0m"
}
yellow(){
    echo -e "\033[33m\033[01m$1\033[0m"
}
blue(){
    echo -e "\033[34m\033[01m$1\033[0m"
}

# 主菜单选择
main_menu() {
    while true; do
red      "==============================================="
green   "||  ____    _____  _______  _________  _______||"
yellow  "|| / __ \  /  _/ |/ / ___/ / __/ __/ |/ / ___/||"
blue    "||/ /_/ / _/ //    / (_ / / _// _//    / (_ / ||"
yellow  "||\___\_\/___/_/|_/\___/ /_/ /___/_/|_/\___/  ||"
green   "||                                            ||"
red     "==============================================="
blue    "||            >>>>> 清风徐来 <<<<<            ||"
red     "==============================================="
echo "1.创建自定义配置单个虚拟机"
echo "2.批量创建自定义配置虚拟机"
echo "3.批量创建默认配置虚拟机"
echo "4.删除虚拟机"
echo "5.退出"
red "==============================================="

read -p "选取你的操作(1/2/3/4/5):" op

case $op in
1)self_define;;
2)
        read -p "请输入要创建的虚拟机的个数:" num
        read -p "请输入新虚机内存大小(G):" newmem
        read -p "请输入新虚机cpu个数:" newcpu

        for((i=1;i<=$num;i++))
        do
                batch_self_define $newmem $newcpu
        done;;

3)
        read -p "请输入要创建的虚拟机的个数:" num

        for((i=1;i<=$num;i++))
        do
                batch_self_define 1 1
        done;;
4)
        delete_kvm
        ;;
5)      
        exit_menu
        ;;
*)
        echo "输入错误，请重新执行脚本"
        exit
        ;;
esac

red "==============================================="
read -p "按任意键返回主菜单" any_key
clear
done

}

#运行
main_menu
```

## 配置文件模板

```ini
# vim /etc/libvirt/qemu/vmmodel.xml
<domain type='kvm'>
  <name>kvmname</name>
  <uuid>kvmuuid</uuid>
  <memory unit='KiB'>kvmmem</memory>
  <currentMemory unit='KiB'>kvmmem</currentMemory>
  <vcpu placement='static'>kvmcpu</vcpu>
  <os>
    <type arch='x86_64' machine='pc-i440fx-rhel7.0.0'>hvm</type>
    <boot dev='hd'/>
  </os>
  <features>
    <acpi/>
    <apic/>
  </features>
  <cpu mode='custom' match='exact' check='partial'>
    <model fallback='allow'>Haswell-noTSX</model>
  </cpu>
  <clock offset='utc'>
    <timer name='rtc' tickpolicy='catchup'/>
    <timer name='pit' tickpolicy='delay'/>
    <timer name='hpet' present='no'/>
  </clock>
  <on_poweroff>destroy</on_poweroff>
  <on_reboot>restart</on_reboot>
  <on_crash>destroy</on_crash>
  <pm>
    <suspend-to-mem enabled='no'/>
    <suspend-to-disk enabled='no'/>
  </pm>
  <devices>
    <emulator>/usr/libexec/qemu-kvm</emulator>
    <disk type='file' device='disk'>
      <driver name='qemu' type='qcow2'/>
      <source file='kvmimg'/>
      <target dev='vda' bus='virtio'/>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x06' function='0x0'/>
    </disk>
    <controller type='usb' index='0' model='ich9-ehci1'>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x04' function='0x7'/>
    </controller>
    <controller type='usb' index='0' model='ich9-uhci1'>
      <master startport='0'/>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x04' function='0x0' multifunction='on'/>
    </controller>
    <controller type='usb' index='0' model='ich9-uhci2'>
      <master startport='2'/>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x04' function='0x1'/>
    </controller>
    <controller type='usb' index='0' model='ich9-uhci3'>
      <master startport='4'/>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x04' function='0x2'/>
    </controller>
    <controller type='pci' index='0' model='pci-root'/>
    <controller type='virtio-serial' index='0'>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x05' function='0x0'/>
    </controller>
    <interface type='network'>
      <mac address='52:54:00:kvmmac'/>
      <source network='default'/>
      <model type='virtio'/>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x03' function='0x0'/>
    </interface>
    <serial type='pty'>
      <target type='isa-serial' port='0'>
        <model name='isa-serial'/>
      </target>
    </serial>
    <console type='pty'>
      <target type='serial' port='0'/>
    </console>
    <channel type='unix'>
      <target type='virtio' name='org.qemu.guest_agent.0'/>
      <address type='virtio-serial' controller='0' bus='0' port='1'/>
    </channel>
    <input type='mouse' bus='ps2'/>
    <input type='keyboard' bus='ps2'/>
    <memballoon model='virtio'>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x07' function='0x0'/>
    </memballoon>
  </devices>
</domain>
```

## 随机生成mac地址

```ini
B:字母数字与字母数字分割，非字母数字与非字母数字分割
&:表示原来的内容

其中方式如下：
# echo `openssl rand -hex 1`:`openssl rand -hex 1`:`openssl rand -hex 1`
99:6e:67

# openssl rand -hex 3 | sed -r 's/(..)(..)(..)/\1:\2:\3/g'
94:89:e3

# openssl rand -hex 3 | sed -r 's/..\B/&:/g'
c5:66:90

参数解释：
openssl rand -hex 5
openssl rand  #用来生成随机数的
-hex #表示为16进制的数
5  #表示长度
```
## KVM网络配置

## 四种网络

`1.NAT default方式：`支持主机与虚拟机互访，虚拟机访问外界网络，但不支持外界访问虚拟机。
`2.isolated隔离，vmware--host-only：仅主机模式。`外网不能访问虚拟机，虚拟机也不能访问外网
`3.bridge ` ----桥接模式属于桥接口
`4.路由模式`

**nat网络**

![kvm2.png](https://xbd666.cn/upload/kvm18.webp)

**桥接网络**

![kvm2.png](https://xbd666.cn/upload/kvm19.webp)

**隔离网络**

![kvm2.png](https://xbd666.cn/upload/kvm20.webp)

```ini
#查看管理接口对应的网卡
[root@kvm-server ~]# brctl show 
bridge name	bridge id		STP enabled	interfaces
virbr0		8000.525400831963	yes		virbr0-nic
							           vnet0
							           vnet1

注意：这里vnet网卡，是每台启动的虚拟机正在使用的网卡设备，每台虚拟机使用的不同			     
# 从交换机上把vnet网卡删除：
[root@kvm-server ~]# brctl delif virbr0 vnet0

来到vm2的虚拟机，ping不通百度
[root@kvm-server ~]# ping baidu.com
ping:baidu.com:Name or service not known

# 添加vnet网卡添加到交换机上：
[root@kvm-server ~]# brctl addif virbr0 vnet0
	
来到vm2的虚拟机，恢复正常
[root@kvm-server ~]# ping baidu.com
PING www.a.shifen.com (61.135.169.125)56(84) bytes of data.
64  bytes from 61.135.169.125(61.135.169.125): icmp_seq=1 ttl=55 time=2.24 ms
```

## 配置文件方式配置`桥接`：在宿主机上

```ini
配置文件方式配置桥接：在宿主机上
[root@kvm-server ~]# ip a   #先找出宿主机用的哪个网卡设备，我的是enp0s25
[root@kvm-server ~]# cd /etc/sysconfig/network-scripts/
1.定义网卡配置文件
[root@kvm-server network-scripts]# vim ifcfg-br0    #创建该桥接网卡，默认没有此文件需要新建
[root@kvm-server network-scripts]# cat ifcfg-br0
TYPE=Bridge  #定义类型
NAME=br0  #设备的名字
DEVICE=br0
ONBOOT="yes"
BOOTPROTO=static
IPADDR=10.31.162.90   #要和宿主机在一个网络，这里我用的是宿主机的ip
GATEWAY=10.31.162.1   #宿主的网关，nat的是.2,桥接是.1
NETMASK=255.255.255.0
DNS1=114.144.144.144
DNS2=8.8.8.8

然后看清楚宿主机正在使用的网卡，修改配置文件,(将物理机网卡桥到桥接网卡)
[root@kvm-server network-scripts]# cp ifcfg-enp0s25 ifcfg-enp0s25.back
[root@kvm-server network-scripts]# vim ifcfg-enp0s25
NAME=enp0s25   #定义网卡设备名称
DEVICE=enp0s25   #宿主机正在使用的网卡设备
ONBOOT=yes
BRIDGE=br0     #和ifcfg-br0文件里面的设备对应，新添加
  
2.重启libvirtd服务
[root@kvm-server network-scripts]# systemctl restart libvirtd 
3.重启network服务 
[root@kvm-server network-scripts]# systemctl restart network     
```

**然后去查看有没有新设备生成**

![kvm2.png](https://xbd666.cn/upload/kvm21.webp)

**可以看到，我们先添加的网卡设备**

![kvm2.png](https://xbd666.cn/upload/kvm22.webp)
`添加完成后，运行虚拟机查看IP地址，就可以看到添加的桥接网卡了`


## 移除`桥接网卡`操作

![kvm2.png](https://xbd666.cn/upload/kvm23.webp)

```ini
删除桥接网卡步骤：
1.删除br0的配置文件
[root@localhost ~]# cd /etc/sysconfig/network-scripts/
[root@localhost network-scripts]# rm -rf ifcfg-br0 
[root@localhost network-scripts]# rm -rf ifcfg-ens33

2.修改正常网卡的配置文件
# 将之前备份的恢复
[root@localhost network-scripts]# cp ifcfg-ens33.bak ifcfg-ens33
3.重启系统
[root@localhost network-scripts]# systemctl restart network
[root@localhost network-scripts]# systemctl restart libvirtd
```

## 通过配置文件方式创建nat网络：

```ini
配置文件方式创建nat网络：
1.首先需要一个模板文件，通过这个模板文件创建自定义的nat网络。
[root@kvm-server ~]# cd /etc/libvirt/qemu/networks
[root@kvm-server networks]# ls
autostar default.xml
[root@kvm-server networks]# cp default.xml nat1.xml
[root@kvm-server networks] # vim nat1.xml  
```

![kvm2.png](https://xbd666.cn/upload/kvm24.webp)

**重启服务**

```ini
[root@kvm-server netwoeks]# systemctl  restart libvirtd

#然后选择一个虚拟机进行添加
在某个（比如vm3）虚拟机去添加此设备测试
```

![kvm2.png](https://xbd666.cn/upload/kvm25.webp)

![kvm2.png](https://xbd666.cn/upload/kvm26.webp)

![kvm2.png](https://xbd666.cn/upload/kvm27.webp)

![kvm2.png](https://xbd666.cn/upload/kvm28.webp)

## 创建isolated网络，隔离网络

```ini
配置文件方式创建isolated网络隔离网络：
[root@kvm-server ~]# cd /etc/libvirt/qemu/networks
[root@kvm-server networks]# cp default.xml isolated200.xml
[root@kvm-server networks]# vim isolated200.xml
```

![kvm2.png](https://xbd666.cn/upload/kvm29.webp)

**启动：**

```ini
[root@kvm-server networks]# systemctl restart libvirtd
开机自启动:
[root@kvm-server networks]# virsh net-autostart  isolated200

查看所有的网络：
[root@kvm-server networks]# virsh net-list
```

![kvm2.png](https://xbd666.cn/upload/kvm30.webp)

## 图文方式创建nat网络

![kvm2.png](https://xbd666.cn/upload/kvm31.webp)

![kvm2.png](https://xbd666.cn/upload/kvm32.webp)

![kvm2.png](https://xbd666.cn/upload/kvm33.webp)

![kvm2.png](https://xbd666.cn/upload/kvm34.webp)

