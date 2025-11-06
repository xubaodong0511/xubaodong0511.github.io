---
title: zabbix-proxy配置及邮件配置
author: Mr.xu
date: 2025-11-06 20:59:39
tags:
---

# 一、下载配置server，agent端

# 下载zabbix-server，server客户端

```shell
# 备注：zabbix源不能和epel源同时存在，要给epel源注释了
# 更新下载zabbix源
[root@zabbix-server ~]# rpm -Uvh https://repo.zabbix.com/zabbix/5.0/rhel/7/x86_64/zabbix-release-5.0-1.el7.noarch.rpm

# 更新yum仓库
[root@zabbix-server ~]# yum clean all
[root@zabbix-server ~]# yum repolist

# 安装
安装 zabbix rpm 源,鉴于国内网络情况，使用阿里云 zabbix 源
# 更换源
[root@zabbix-server ~]# sed -i 's#http://repo.zabbix.com#https://mirrors.aliyun.com/zabbix#' /etc/yum.repos.d/zabbix.repo

# 下载软件包--用的时5.0版本的
# 如果有冲突用  yum -y remove `rpm -qa zabbix6.0*` 
[root@zabbix-server ~]# yum install zabbix-server-mysql zabbix-web-mysql zabbix-agent -y
[root@zabbix-server ~]# yum install -y zabbix-get.x86_64  #安装zabbix命令工具
```

# 安装数据库

```shell
# 1、安装数据库
# 安装 mariadb.repo
[root@zabbix-server ~]# yum install -y mariadb mariadb-server
# 2、启动数据库
[root@zabbix-server ~]# systemctl restart mariadb
[root@zabbix-server ~]# systemctl enable mariadb
[root@zabbix-server ~]# mysqladmin -u root password 'zabbix'    #设置root密码

# 3、创建数据库并授权账号
[root@zabbix-server ~]# mysql -uroot -p'zabbix'
MariaDB [(none)]> create database zabbix character set utf8 collate utf8_bin;  # 创建zabbix数据库
MriaDB [(none)]> grant all privileges on zabbix.* to 'zabbix'@'localhost' identified by 'zabbix';										# 注意授权网段
MariaDB [(none)]> flush privileges;           # 刷新授权
MariaDB [(none)]> \q   #退出

# 4、导入数据
[root@zabbix-server ~]# zcat /usr/share/doc/zabbix-server-mysql*/create.sql.gz | mysql -uzabbix -p zabbix
Enter password:                   #输入密码
```

# 配置 server 端

```shell
[root@zabbix-server ~]# cd /etc/zabbix/
[root@zabbix-server zabbix]# ls
web  zabbix_agentd.conf  zabbix_agentd.d  zabbix_server.conf
#为了方便我们以后恢复，我们把配置文件备份一下
[root@zabbix-server zabbix]# cp zabbix_server.conf zabbix_server.conf.bak
[root@zabbix-server zabbix]# vim zabbix_server.conf
 DBHost=localhost            #数据库对外的主机
 DBName=zabbix               #数据库名称
 DBUser=zabbix               #数据库用户
 DBPassword=zabbix           #数据库密码
 
 # 启动zabbix-server
 [root@zabbix-server zabbix]# systemctl start zabbix-server
[root@zabbix-server zabbix]# systemctl enable zabbix-server

# 验证10051端口有没有起来
[root@zabbix-server zabbix]# netstat -lntp | grep 10051
tcp        0      0 0.0.0.0:10051           0.0.0.0:*               LISTEN      1574/zabbix_server  
tcp6       0      0 :::10051                :::*                    LISTEN      1574/zabbix_server

# 配置 web GUI
1.启用zabbix前端源，修改vim /etc/yum.repos.d/zabbix.repo，将[zabbix-frontend]下的 enabled 改为 1
[root@zabbix-server zabbix]# vim /etc/yum.repos.d/zabbix.repo
[zabbix-frontend]     #修改第二个【frontend】
...
enabled=1    #改为1
gpgcheck=0   #改为0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-ZABBIX-A14FE591
...
gpg--》都改成0

2.安装 Software Collections，便于后续安装高版本的 php，默认 yum 安装的 php 版本为 5.4 过低
[root@zabbix-server zabbix]# yum install centos-release-scl -y
3.安装 zabbix 前端和相关环境
[root@zabbix-server zabbix]# yum install zabbix-web-mysql-scl zabbix-apache-conf-scl -y

# 为Zabbix前端配置PHP
[root@zabbix-server ~]# vim /etc/opt/rh/rh-php72/php-fpm.d/zabbix.conf   #设置时区
#里面基本不用动。只需要添加一行时区即可
php_value[date.timezone] = Asia/Shanghai       ---添加如下

# 启动`httpd`服务
[root@zabbix-server ~]# systemctl restart zabbix-server zabbix-agent httpd rh-php72-php-fpm
[root@zabbix-server ~]# systemctl enable zabbix-server zabbix-agent httpd rh-php72-php-fpm
```

# 验证：打开游览器访问
`192.168.246.228/zabbix`，第一次访问时需要进行一些初始化的设置
# 初始账户及密码
`user=Admin`
`password=zabbix`

# 配置agent端

```shell
# agent端可以是多台
[root@zabbix-node1 ~]# rpm -Uvh https://repo.zabbix.com/zabbix/5.0/rhel/7/x86_64/zabbix-release-5.0-1.el7.noarch.rpm
[root@zabbix-node1 ~]# yum install zabbix-agent zabbix-sender -y

# 备份配置文件
[root@zabbix-node1 ~]# cd /etc/zabbix/
[root@zabbix-node1 zabbix]# ls
zabbix_agentd.conf  zabbix_agentd.d
[root@zabbix-node1 zabbix]# cp zabbix_agentd.conf{,.bak}
[root@zabbix-node1 zabbix]# ls
zabbix_agentd.conf  zabbix_agentd.conf.bak  zabbix_agentd.d

# 修改配置文件
[root@zabbix-node1 zabbix]# vim zabbix_agentd.conf   ----修改如下
Server=192.168.246.228 zabbix服务器的地址 
ServerActive=192.168.246.228 主动模式 zabbix-server-ip 
Hostname=zabbix-node1 
UnsafeUserParameters=1 是否限制用户自定义 keys 使用特殊字符 1是可以启用特殊字符 0是不可以启用特殊字符，是否允许别人执行远程操作命令，默认是禁用的，打开的话会有安全风险.

# 启动agent服务
[root@zabbix-node1 zabbix]# systemctl start zabbix-agent
[root@zabbix-node1 zabbix]# systemctl enable zabbix-agent

# 验证10050端口有没有起来
[root@zabbix-node1 zabbix]# netstat -lntp | grep 10050
tcp        0      0 0.0.0.0:10050           0.0.0.0:*               LISTEN      9000/zabbix_agentd  
tcp6       0      0 :::10050                :::*                    LISTEN      9000/zabbix_agentd
```

``配置完成，此时可以在网址上做配置设置了``

# 修改语言--中文版

```shell
点开Administration-->Users-->Admin-->Language(选择chinese)
# 现在界面是中文版的了
```
# 修改监控项字体
```shell
[root@zabbix-server ~]# cd /usr/share/zabbix/assets/fonts/
[root@zabbix-server fonts]# ls
graphfont.ttf
[root@zabbix-server fonts]# mv graphfont.ttf graphfont.ttf.bak
将本机上的simkai.ttf下载好，传到linunx
[root@zabbix-server fonts]# ls
graphfont.ttf.bak  simkai.ttf
[root@zabbix-server fonts]# mv simkai.ttf graphfont.ttf
[root@zabbix-server fonts]# ls
graphfont.ttf  graphfont.ttf.bak
这个时候监控项里面的字体就已经改好了
```
# 界面创建流程

```shell
监控方面，先创建一个主机（host），在创建一个监控项(item)用于采集数据。告警方面，在监控项里创建触发器（trigger），通过触发器（trigger）来触发告警动作（action）
```

# 二、自定义key

```shell
# 修改配置文件，把查找参数的命令设为用户参数
[root@zabbix-node1 ~]# cd /etc/zabbix/zabbix_agentd.d/
[root@zabbix-node1 zabbix_agentd.d]# vim memory_usage.conf
UserParameter=memory.used,free | awk '/^Mem/{print $3}'
UserParameter=定义的key，查看的命令语句

# 重启agent服务
[root@zabbix-node1 zabbix_agentd.d]# systemctl restart zabbix-agent.service

# 在zabbix-server 端，查询验证
[root@zabbix-server fonts]# zabbix_get -s 192.168.246.226 -p 10050 -k "memory.used"
如果可以验证到结果，就可以到web界面去设置参数，启动监控了
```
`web界面先在设置里创建主机组--模板--创建主机----配置应用集--监控项--设置自定义监控项`
```shell
# 也可以指定参数--传参
[root@zabbix-node1 ~]# cd /etc/zabbix/zabbix_agentd.d/
[root@zabbix-node1 zabbix_agentd.d]# vim memory_usage.conf
UserParameter=memory.stats[*],cat /proc/meminfo | awk '/^$1/{print $$2}'     --添加到文件中注意去掉反斜杠

# 重启agent服务
[root@zabbix-node1 zabbix_agentd.d]# systemctl restart zabbix-agent.service

# 在zabbix-server 端，查询使用这个用户参数的key
传参:
[root@zabbix-server fonts]# zabbix_get -s 192.168.246.226 -p 10050 -k "memory.stats[MemTotal]"
999696
[root@zabbix-server fonts]# zabbix_get -s 192.168.246.226 -p 10050 -k "memory.stats[Cache]"
243832
[root@zabbix-server fonts]# zabbix_get -s 192.168.246.226 -p 10050 -k "memory.stats[Buffer]"
2108
```

# 三、网络发现(自动发现)

```shell
# 安装agent 段的包
[root@zabbix-node2 ~]# yum -y install zabbix-agent zabbix-sender

# 设置agent 配置，可以把之前设置好的node1的配置传过来
[root@zabbix-node2 ~]# vim /etc/zabbix/zabbix_agentd.conf
Hostname=zabbix-node2 #只需修改hostname

# visudo赋予权限
[root@zabbix-node2 ~]# visudo       #修改sudo的配置,添加如下信息
#Defaults !visiblepw

93 zabbix ALL=(ALL) NOPASSWD: ALL

# 启动服务
[root@zabbix-node2 ~]# systemctl start zabbix-agent

# 在server端验证
[root@zabbix-server ~]# zabbix_get -s 192.168.246.227 -p 10050 -k "system.hostname"
zabbix-agent-none2

# 到web网址界面操作
配置--自动发现--自动发现规则--。。。
```

# 四、zabbix-proxy分布式监控

```shell
# 需要对时，保证两台机器的时间一致
- ntpdate 192.168.198.156 制作时间服务器
[root@zabbix-server ~]# yum install -y ntp
[root@zabbix-server ~]# vim /etc/ntp.conf  #有4行server的位置，把那4行server行注释掉，填写以下两行
server 127.127.1.0 # local clock
fudge  127.127.1.0 stratum 10
[root@zabbix-server ~]#  systemctl start ntpd
[root@zabbix-server ~]#  systemctl enable ntpd
同步时间
[root@zabbix-proxy ~]# yum install -y ntpdate
[root@zabbix-proxy ~]# ntpdate 192.168.198.156

[root@zabbix-node2 ~]# yum install -y ntpdate
[root@zabbix-node2 ~]# ntpdate 192.168.198.156

- 关闭防火墙，selinux
- 设置主机名 hostnamectl set-hostname zabbix-proxy
[root@localhost ~]# hostnamectl set-hostname zabbix-proxy

- vim /etc/hosts 每个机器都设置hosts，以解析主机名；
监控端
[root@zabbix-server ~]# cat /etc/hosts
192.168.198.156 zabbix-server
192.168.198.158 zabbix-node2
192.168.198.159 zabbix-proxy

代理端
[root@zabbix-proxy ~]# cat /etc/hosts
192.168.198.156 zabbix-server
192.168.198.158 zabbix-node2
192.168.198.159 zabbix-proxy

被监控端
[root@zabbix-node2 ~]# cat /etc/hosts
192.168.198.156 zabbix-server
192.168.198.158 zabbix-node2
192.168.198.159 zabbix-proxy

| 机器名称      | IP配置          | 服务角色  |
| ------------- | --------------- | --------- |
| zabbix-server | 192.168.198.156 | 监控      |
| zabbix-node1  | 192.168.198.157 | 被监控端  |
| zabbix-node2  | 192.168.198.158 | 被监控端  |
| zabbix-proxy  | 192.168.198.159 | 代理proxy |

# 在 zabbix-proxy 上配置 mysql
[root@zabbix-proxy ~]# yum install -y mariadb mariadb-server
[root@zabbix-proxy ~]# systemctl start mariadb
[root@zabbix-proxy ~]# mysqladmin -uroot password 'zabbix'
[root@zabbix-proxy ~]# mysql -uroot -p'zabbix'
MariaDB [(none)]> create database proxydb character set 'utf8';
MariaDB [(none)]> grant all on proxydb.* to 'proxy'@'localhost' identified by 'zabbix';
MariaDB [(none)]> flush privileges;
MariaDB [(none)]> \q

# 在 zabbix-proxy上下载zabbix 相关的包，主要是代理proxy的包
[root@zabbix-server ~]# scp /etc/yum.repos.d/zabbix.repo 192.168.198.159:/etc/yum.repos.d/
编辑zabbix.repo源将里面的gpgcheck关闭
[root@zabbix-proxy ~]# yum -y install zabbix-proxy-mysql zabbix-get zabbix-agent zabbix-sender

# 将zabbix-proxy-mysql包里面的数据导入数据库中
[root@zabbix-proxy ~]# cp /usr/share/doc/zabbix-proxy-mysql-5.0.3（版本号）/schema.sql.gz ./
[root@zabbix-proxy ~]# ls
anaconda-ks.cfg  schema.sql.gz
[root@zabbix-proxy ~]# gzip -d schema.sql.gz 
[root@zabbix-proxy ~]# ls
anaconda-ks.cfg  schema.sql
[root@zabbix-proxy ~]# mysql -uroot -p proxydb < schema.sql 
Enter password:

# 配置proxy端
[root@zabbix-proxy ~]# vim /etc/zabbix/zabbix_proxy.conf
# proxyMode=0  #默认是主动模式（0是主动模式，1是被动模式）
Server=192.168.198.156        # server端 的IP
ServerPort=10051             # server端 的端口

Hostname=zabbix-proxy        # 主机名
ListenPort=10051             # proxy自己的监听端口
EnableRemoteCommands=1       # 允许远程命令
LogRemoteCommands=1          # 记录远程命令的日志

# 数据的配置
DBHost=localhost
DBName=proxydb
DBUser=proxy
DBPassword=zabbix

ConfigFrequency=30      # 多长时间，去服务端拖一次有自己监控的操作配置；为了实验更快的生效，这里设置30秒，默认3600s
DataSenderFrequency=1   # 每一秒向server 端发一次数据，发送频度

# 启动proxy服务
[root@zabbix-proxy ~]# systemctl start zabbix-proxy

[root@zabbix-proxy ~]# netstat -lntp | grep 10051
tcp        0      0 0.0.0.0:10051           0.0.0.0:*               LISTEN      15798/zabbix_proxy  
tcp6       0      0 :::10051                :::*                    LISTEN      15798/zabbix_proxy

# 配置agent端允许proxy代理监控
[root@zabbix-agent ~]#  vim /etc/zabbix/zabbix_agentd.conf---添加proxy的ip地址
Server=192.168.198.156,192.168.198.159
ServerActive=192.168.198.156,192.168.198.159
Hostname=zabbix-node2
[root@zabbix-agent ~]#  systemctl restart zabbix-agent #启动服务

# 在web网址上配置
管理--agent代理程序--agent代理程序（要与配置文件中应以的一样）--添加--配置--主机--选好主机名称--已启用那里打开zabbix proxy
```

# 五、配置发送邮件

```shell
##server服务器端
安装MUA软件：mailx
[root@zabbix-server ~]#  yum install mailx -y
[root@zabbix-server ~]# mailx -V 
12.5 7/5/10
注：使用新的方式--利用公网邮件服务器发送报警，需要关闭postfix服务
[root@zabbix-server ~]# systemctl stop postfix

# 配置公网邮箱信息：
[root@zabbix-server ~]# vim /etc/mail.rc  ---在最后添加如下：
set from=12345678@163.com（邮箱地址） 
 set smtp=smtp.163.com（smtp服务器） 
 set smtp-auth-user=12345678@163.com(用户名) 
 set smtp-auth-password=qf123456（这里是邮箱的授权密码） 
 set smtp-auth=login
 
 # 阿里云服务器--需要配置证书
 # 一、请求数字证书
mkdir -p /root/.certs/ ####创建目录，用来存放证书
echo -n | openssl s_client -connect smtp.163.com:465 | sed -ne '/-BEGIN CERTIFICATE-/,/-END CERTIFICATE-/p' > ~/.certs/163.crt ####向163请求证书
certutil -A -n "GeoTrust SSL CA" -t "C,," -d ~/.certs -i ~/.certs/163.crt ####添加一个SSL证书到证书数据库中
certutil -A -n "GeoTrust Global CA" -t "C,," -d ~/.certs -i ~/.certs/163.crt ####添加一个Global 证书到证书数据库中
certutil -L -d /root/.certs ####列出目录下证书

# 二、配置发件人
[root@zabbix-server ~]# vim /etc/mail.rc  ---在最后添加如下：
set bsdcompat
set from=xxxxxx@163.com
set smtp=smtps://smtp.163.com:465
set smtp-auth-user=xxxxxx@163.com
set smtp-auth-password=xxxxxxx #此密码为第三方登录密码
set smtp-auth=login
set ssl-verify=ignore
set nss-config-dir=/root/.certs

# 三、测试
echo “test” | mail -s “zabbix” xxxxxxx@qq.com
登陆收件人邮箱查看
看似成功但是linux中报错：证书不被信任

# 四、解决最后一个问题-----证书不被信任
cd /root/.certs/
certutil -A -n "GeoTrust SSL CA - G3" -t "Pu,Pu,Pu" -d ./ -i 163.crt

# 成功标志：
Notice: Trust flag u is set automatically if the private key is present.


## 发送邮箱方式
方式1：echo "正文内容" | mailx -s "邮件标题" 收件箱Email
方式2：mailx -s "邮件标题" 收件箱Email，回车按CTRL+D发送
参数：
-v ：显示发送的详细信息

手动发送邮件测试：
[root@zabbix-server ~]# mailx -v -s 'hello' 'zhangsan@163.com'
手写邮件内容 （回车，然后ctrl+D正常结束)
[root@zabbix-server ~]# mailx -v -s 'hello' 'zhangsan@163.com'
nihao
EOT
Resolving host smtp.163.com . . . done.
Connecting to 123.126.97.2:smtp . . . connected.
220 163.com Anti-spam GT for Coremail System (163com[20141201])
>>> EHLO zabbix-server
250-mail
250-PIPELINING
250-AUTH LOGIN PLAIN 
250-AUTH=LOGIN PLAIN
250-coremail 1Uxr2xKj7kG0xkI17xGrU7I0s8FY2U3Uj8Cz28x1UUUUU7Ic2I0Y2UFeF38eUCa0xDrUUUUj
250-STARTTLS
250 8BITMIME
>>> AUTH LOGIN
334 dXNlcm5hbWU6
>>> bHd4MTgzNjYwMTkzNTZAMTYzLmNvbQ==
334 UGFzc3dvcmQ6
>>> bHd4MTgzNjYwMTkzNTY=
235 Authentication successful
>>> MAIL FROM:<lwx18366019356@163.com>
250 Mail OK
>>> RCPT TO:<lwx18366019356@163.com>
250 Mail OK
>>> DATA
354 End data with <CR><LF>.<CR><LF>
>>> .
250 Mail OK queued as smtp2,GtxpCgDXkqTEFERdskSAAA--.825S2 1564742867
>>> QUIT
221 Bye

# 此时终端配置完成，在web网址上操作
配置 zabbix 的邮件报警功能需要以下三个角色的参与
注：脚本名称任意，存放于/usr/lib/zabbix/alertscripts ----路径可以改

名称：sendmail                   //名称任意
类型：脚本
脚本名称：sendmail.sh      
脚本参数：                          //一定要写，否则可能发送不成功
    {ALERT.SENDTO}              //照填，收件人变量
    {ALERT.SUBJECT}             //照填，邮件主题变量，变量值来源于‘动作’中的‘默认接收人’
    {ALERT.MESSAGE}           //照填，邮件正文变量，变量值来源于‘动作’中的‘默认信息’

配置完成后,不要忘记点击存档,保存你的配置。       

# 步骤
管理--报警媒介类型--名称（邮件报警）--类型（脚本）--脚本名字（要和终端上脚本名称的一致）--脚本参数（3个，上面模板）--添加

# 修改zabbix服务端配置文件＆编写脚本：指定脚本的存储路径:
[root@zabbix-server ~]# vim /etc/zabbix/zabbix_server.conf
AlertScriptsPath=/usr/lib/zabbix/alertscripts  #打开注释，核对路径，也可以修改路径

`编写邮件脚本:`
[root@zabbix-server ~]# cd /usr/lib/zabbix/alertscripts/
[root@zabbix-server alertscripts]# vim sendmail.sh   
#!/bin/sh 
#export.UTF-8
echo "$3" | sed s/'\r'//g | mailx -s "$2" $1

$1:接受者的邮箱地址：sendto
$2:邮件的主题：subject
$3:邮件内容：message

# 修改权限 及更用户和组：
[root@zabbix-server alertscripts]# chmod u+x sendmail.sh && chown zabbix.zabbix sendmail.sh

# 返回web界面操作
管理--用户--Admin--报警媒介--添加类型（邮件报警）--填写收件人--点击更新------触发器（填写名称，严重性，表达式）--点添加------动作--点触发动作--填写名称--触发条件（触发器）--点操作--选择时间--标题及内容（填写西面的模板）

默认信息：邮件的主题

Problem:{TRIGGER.NAME}

故障恢复: {TRIGGER.NAME}

主机: {HOST.NAME1}
时间: {EVENT.DATE} {EVENT.TIME}
级别: {TRIGGER.SEVERITY}
触发: {TRIGGER.NAME}
详情: {ITEM.NAME1}:{ITEM.KEY1}:{ITEM.VALUE1}
状态: {TRIGGER.STATUS}
项目：{TRIGGER.KEY1} 
事件ID：{EVENT.ID}
```

# 六、配置钉钉报警

```shell
# 钉钉需要创建公司名称，建团队群
```

