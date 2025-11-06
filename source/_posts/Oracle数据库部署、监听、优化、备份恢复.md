---
title: Oracle数据库部署、监听、优化、备份恢复
author: Mr.xu
date: 2025-11-06 20:44:46
tags:
---

## VM虚拟机安装oracle

# 安装

## 1.改操作系统核心参数

```shell
[root@localhost ~]# vim /etc/security/limits.conf

oracle soft nofile 65536
oracle hard nofile 65536
oracle soft nproc 16384
oracle hard nproc 16384
```

```shell
[root@localhost ~]# vim /etc/sysctl.conf

kernel.shmmax = 2147483648
kernel.shmmni = 4096
kernel.shmall = 2097152
kernel.sem = 510 32000 100 128
fs.file-max ingfeng@123= 65536
net.ipv4.ip_local_port_range = 1024 65000
net.core.rmem_default = 4194304
net.core.rmem_max = 4194304
net.core.wmem_max = 16777216
net.core.wmem_default = 266960
```

使/etc/sysctl.conf更改立即生效

```shell
[root@localhost ~]# sysctl -p
```

## 2.创建相关用户和用户组

```shell
[root@localhost ~]# groupadd oinstall
[root@localhost ~]# groupadd dba
[root@localhost ~]# useradd -g dba -G oinstall -m oracle
[root@localhost ~]# passwd oracle
```

## 3.创建数据库软件目录和数据文件存放目录

```shell
[root@localhost ~]# mkdir -p /opt/oracle/
[root@localhost ~]# mkdir -p /opt/oracle/oracle/product
[root@localhost ~]# mkdir -p /opt/oracle/oradata/
[root@localhost ~]# mkdir -p /opt/oracle/oralnventory
```

更改oracle目录的own

```shell
[root@localhost ~]# chown -R oracle:dba /opt/oracle
```

改变/home/oracle目录的拥有者

```shell
[root@localhost ~]# chown -R oracle:dba /home/oracle
```

下载依赖

```shell
[root@localhost ~]# yum -y install libXp.i686 libXp-devel.i686 libXt.i686 libXt-devel.i686 libXtst.i686 libXtst-devel.i686 make.x86_64 gcc.x86_64 libaio.x86_64 glibc-devel.i686 libgcc.i686 glibc* gcc* make* compat-db* libstdc* libXp* libXtst* compat-libstdc++* libaio libaio-devel sysstat unixODBC unixODBC-devel
```

## 4.配置环境变量

以root用户执行

su - oracle切换为oracle用户
**修改$HOME/.bash_profile文件**

```shell
[oracle@localhost ~]$ vim .bash_profile   #设置以下变量

export ORACLE_BASE=/opt/oracle/
export ORACLE_HOME=/opt/oracle/oracle/product/11.2.0/dbhome_1
export ORACLE_SID=orcl
export PATH=$PATH:$HOME/bin:$ORACLE_HOME/bin
export LD_LIBRARY_PATH=$ORACLE_HOME/lib:/usr/lib

[oracle@localhost ~]$ source .bash_profile
```

```shell
yum install unzip   #如果没有unzip命令要先下载

[oracle@localhost ~]$ unzip p13390677_112040_Linux-x86-64_1of7.zip
[oracle@localhost ~]$ unzip p13390677_112040_Linux-x86-64_2of7.zip
解压时会默认自动生成database目录
[oracle@localhost ~]$ ls
database                                p13390677_112040_Linux-x86-64_2of7.zip
p13390677_112040_Linux-x86-64_1of7.zip
[oracle@localhost ~]$ cd database/
[oracle@localhost database]$ ls
install  readme.html  response  rpm  runInstaller  sshsetup  stage  welcome.html
```

切换到root目录执行下列命令

```shell
[root@localhost ~]# export DISPLAY=:0.0
[root@localhost ~]# xhost +
access control disabled, clients can connect from any host
```

## 5.开始安装

安装（oracle用户）进入到database目录

```shell
[oracle@localhost database]$ export DISPLAY=:0.0
[oracle@localhost database]$ export DISPLAY
[oracle@localhost database]$ echo $SHELL
/bin/bash

当检查均通过，会出现oracle安装界面，如此时安装界面出现乱码，可能是系统语言为中文导致，需要临时修改系统语言
[oracle@localhost database]$ echo $LANG
[oracle@localhost database]$ export LANG='en_US'
#不进行以上操作，启动会报错

#验证环境变量是否生效，不然后续配置会出错
[oracle@localhost database]$ echo $ORACLE_HOME 
/opt/oracle/oracle/product/11.2.0/dbhome_1
[oracle@localhost database]$ echo $LD_LIBRARY_PATH
/opt/oracle/oracle/product/11.2.0/dbhome_1/lib:/usr/lib

#在database目录下启动
[oracle@localhost database]$ ./runInstaller
这时在vm上设置oracle
```

此时进入vm桌面进行操作

```basic
1、取消邮件的勾选，点yes，Next
2、选Skip software updates跳过软件更新，下一步Next
3、Create and configure a database创建和配置数据库，Next
4、Desktop ClassO Desktop类，Next
5、设置密码，Next
6、选择dba，Next----这时候会出现报错，将路径(/opt/oracle/oralnventory)重新选择下就好,另外如果时重新安装，需要将oralnventory目录下清空才可以重新安装，点yes，Next
7、Prerequis ite Checks前提条件检查,在root用户下执行（/tmp/CVU_11.2.0.4.0_oracle/runfixup.sh）脚本，做swap分区，安装需要安装的依赖包，然后再点检查，基本可以清空警告了---或者不重要的勾选Ignore All跳过，点yes，Next
注：需要安装pdksh-5.2.14---先root用户下卸载rpm -e ksh-20120801-144.el7_9.x86_64---安装rpm -ivh pdksh-5.2.14-37.el5.x86_64.rpm
8、点install---安装到70%左右会报错，更改以下参数就可以了
[oracle@localhost database]$ vim $ORACLE_HOME/sysman/lib/ins_emagent.mk
将$(MK_EMAGENT_NMECTL)改为$(MK_EMAGENT_NMECTL) -lnnz11
9、按照步骤点OK
```

用root用户执行如下两个语句之后，点击OK

```shell
[root@localhost ~]# /opt/oracle/oralnventory/orainstRoot.sh
[root@localhost ~]# /opt/oracle/oracle/product/11.2.0/dbhome_1/root.sh
```

## 6、测试

```shell
[oracle@localhost ~]$ sqlplus / as sysdba     登入数据库
create tablespace nk01 datafile '/home/oracle/app/oracle/oradata/meddate/nk01.dbf' size 200m autoextend on next 100m maxsize unlimited;		创建一个空表
create user nk01 identified bu admin；

# 创建用户、授权、创建表空间
创建uk01用户
CREATE USER uk01 IDENTIFIED BY password;

授予 nk01 用户对表 table_name 的查询权限
GRANT SELECT ON table_name TO nk01;
授予 nk01 用户创建表的权限
GRANT CREATE TABLE TO nk01;

创建表空间
CREATE TABLESPACE tablespace_name
DATAFILE 'file_path_and_name.dbf' SIZE size;

授权表空间给用户uk01
ALTER USER uk01 DEFAULT TABLESPACE tablespace_name;
```

最后把防火墙的端口打开

```shell
[root@localhost ~]# firewall-cmd --add-port=1521/tcp
[root@localhost ~]# firewall-cmd --add-port=1521/tcp --permanent
[root@localhost ~]# firewall-cmd --add-port=1158/tcp
[root@localhost ~]# firewall-cmd --add-port=1158/tcp --permanent
```

# 监听

```ini
1、netca监听
[oracle@oracle ~]$ netca
在oracle用户下执行 netca 命令
选择 Listener configuration，点击 Next
选择 Add 添加，点击 Next
输入监听程序名-可以自定义，点击 Next
选择TCP协议，点击 Next
选择端口号1521，点击 Next
是否需要配置另外一个监听器，选择 No，点击 Next
点击 Next，最后点击完成

示例：
[oracle@oracle ~]$ netca
Oracle Net Services Configuration:
Configuring Listener:LISTENER01
Listener configuration complete.
Configuring Listener:LISTENER02
Listener configuration complete.
Oracle Net Services configuration successful. The exit code is 0

2、netmgr监听
[oracle@oracle ~]$ netmgr
选择listeners---点+号---起个监听器的名字--点OK
监听的位置：点 Add Address---协议tcp--host主机名（自定义）---端口
点file---选择save network configuration 保存

3、修改配置文件方式监听
在/opt/oracle/oracle/product/11.2.0/dbhome_1/network/admin/listener.ora里修改
注：前面的路径为export定义的家目录
```

# 调优

```basic
增加swap分区
swapon -s
#创建swap文件 bs=2300的设置的值一般为内存的1.5倍以上 
dd if=/dev/zero of=/var/swap bs=2500 count=1000000
#需要更改swap文件的权限，确保只有root才可读
chmod 600 /var/swap
#告知系统将该文件用于swap
mkswap /var/swap
#开始使用该swap
swapon /var/swap
#使Swap文件永久生效,/etc/fstab加入配置
echo "/var/swap   swap    swap    sw  0   0" >> /etc/fstab

如果上面创建后发现，大小创建错误了。如何重置呢？
swapoff -a
rm /var/swap
上面命令就可以删除了，然后重新创建合适的swap文件就行了。
```

```basic
调整aio-max-nr内核参数，你可以按照以下步骤进行操作：
1. sudo vi /etc/sysctl.conf
2. fs.aio-max-nr = 65536  自己修改合适的参数例如65536
3. 加载新的内核参数配置 sudo sysctl -p
4. 验证参数设置  sysctl fs.aio-max-nr
5. 重新运行预安装检查 确保aio-max-nr参数设置已满足要求
直到yes

解决内核参数，调优
vim /etc/sysctl.conf

kernel.shmmax = 2147483648
kernel.shmmni = 4096
kernel.shmall = 2097152
kernel.sem = 510 32000 100 128
fs.file-max ingfeng@123= 65536
net.ipv4.ip_local_port_range = 1024 65000
net.core.rmem_default = 4194304
net.core.rmem_max = 4194304
net.core.wmem_max = 16777216
net.core.wmem_default = 266960
```

```basic
调优：
优化 SQL 查询：
- 分析和优化关键 SQL 查询的执行计划
	#查看 SQL 查询的执行计划
	EXPLAIN PLAN FOR <your_query>;
	#显示查询的执行计划
	SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
- 确保适当的索引被使用，以避免全表扫描
	#查看表的索引
	SELECT index_name, column_name FROM user_ind_columns WHERE table_name = '<table_name>';

合理配置数据库参数：
- 调整 SGA 大小需要根据系统的总内存和数据库负载情况来确定。一般建议将 SGA 大小设置为可用内存的 50% 到 80%
- 调整PGA，使用 PGA_AGGREGATE_TARGET 参数修改 PGA 大小
- 数据库缓存，调整 DB_CACHE_SIZE 参数来调整数据库缓冲区的大小
- 连接池用于管理数据库连接的分配和释放，PROCESSES 参数限制数据库的最大并发连接数，并通过设置 SESSIONS 参数限制连接数

优化索引：
- 确保表上存在适当的索引，以加快查询速度
	CREATE INDEX index_name ON table_name (column1, column2);
- 定期重建或重新组织索引，以减少索引碎片并提高查询性能
	ALTER INDEX index_name REBUILD;
	ALTER INDEX index_name REORGANIZE;
- 定期执行索引维护任务

使用分区表和分区索引：
- 可以使用分区表和分区索引来提高查询性能
- 示例：
分区示例：
CREATE TABLE sales (
    sales_id NUMBER,
    sales_date DATE,
    amount NUMBER
)
PARTITION BY RANGE (sales_date)
(
    PARTITION sales_2019 VALUES LESS THAN (TO_DATE('2020-01-01', 'YYYY-MM-DD')),
    PARTITION sales_2020 VALUES LESS THAN (TO_DATE('2021-01-01', 'YYYY-MM-DD')),
    PARTITION sales_future VALUES LESS THAN (MAXVALUE)
);
分区索引示例：
CREATE INDEX idx_sales_date ON sales (sales_date)
LOCAL
(
    PARTITION sales_2019,
    PARTITION sales_2020,
    PARTITION sales_future
);

利用 Oracle 提供的 AWK 和 ASH 性能监控工具：
- awk：
	#生成 AWR 报告（默认情况下，包含最近一小时的性能数据）
	SELECT * FROM TABLE(DBMS_WORKLOAD_REPOSITORY.AWR_REPORT_HTML);
	#生成 AWR 报告（默认情况下，包含最近一小时的性能数据）
	SELECT * FROM TABLE(DBMS_WORKLOAD_REPOSITORY.AWR_REPORT_HTML);
-ASH
	#查询当前活动会话信息
	SELECT * FROM V$ACTIVE_SESSION_HISTORY;
	#查询指定时间范围内的活动会话信息
	SELECT * FROM V$ACTIVE_SESSION_HISTORY WHERE SAMPLE_TIME BETWEEN start_time AND end_time;
	#查询特定会话 ID 的活动会话信息
#SELECT * FROM V$ACTIVE_SESSION_HISTORY WHERE SESSION_ID = session_id;


定期执行数据库统计和优化任务：
- 收集指定表的统计信息
	EXEC DBMS_STATS.GATHER_TABLE_STATS('schema_name', 'table_name');
- 收集指定索引的统计信息
	EXEC DBMS_STATS.GATHER_INDEX_STATS('schema_name', 'index_name');
- 查询 SQL Tuning Advisor 的优化建议
	SELECT dbms_sqltune.report_tuning_task('task_name_here') AS recommendations FROM dual;

硬件和操作系统层面的优化：
- 确保数据库服务器具有足够的内存、CPU 和磁盘空间
- 使用 RAID 和 SSD 等高性能存储来提高磁盘 I/O 性能
- 调整操作系统参数，以优化数据库的整体性能
```

# 备份

```basic
1. 逻辑备份：
适用情况：逻辑备份通过导出数据库对象的逻辑结构来创建备份文件，适用于需要备份和恢复特定表、模式或数据库对象的情况。逻辑备份可以跨平台和跨版本使用。
操作时机：可以在数据库运行时或离线时执行逻辑备份。
2. 物理备份：
适用情况：物理备份是通过备份数据库文件（如数据文件、控制文件和日志文件）来创建备份文件，适用于整个数据库或大部分数据库的备份和恢复。物理备份可以更快速地恢复整个数据库。
操作时机：通常在数据库处于归档模式下时执行物理备份，以确保备份文件包含了所有的数据文件和日志文件。
3. 快照备份：
适用情况：快照备份是通过创建数据库的快照来创建备份文件，适用于需要在数据库处于运行状态下快速恢复到以前状态的情况。
操作时机：可以在数据库运行时创建快照备份。
4. 文件系统备份：
适用情况：文件系统备份是通过备份数据库文件所在的文件系统来创建备份文件，适用于需要完整备份数据库且数据库可以停机的情况。
操作时机：通常在数据库停机时执行文件系统备份。

1、物理备份：
创建全量备份：RMAN> BACKUP DATABASE;
创建增量备份：RMAN> BACKUP INCREMENTAL LEVEL 1 DATABASE;
导出数据：exp username/password@db_name file=export_file.dmp
导入数据：imp username/password@db_name file=export_file.dmp

2、逻辑备份：
1. 使用 EXP 和 IMP 工具进行逻辑备份和还原：
	导出数据：exp username/password@db_name file=backup_file.dmp
	导入数据：imp username/password@db_name file=export_file.dmp
2. 使用 EXPDP 和 IMPDP 工具进行逻辑备份和还原：
	导出数据：expdp username/password@db_name dumpfile=export_file.dmp
	导入数据：impdp username/password@db_name dumpfile=export_file.dmp

3、快照备份：
登录存储设备管理界面：
打开浏览器，输入存储设备的管理界面地址，输入用户名和密码登录，选择要备份的存储卷或 LUN
，在存储设备管理界面中，找到要备份的存储卷或 LUN，选择该存储卷或 LUN，并查看相关操作选项
创建快照：
在存储设备管理界面中，找到快照功能或选项，根据提示，在选择的存储卷或 LUN 上创建一个快照，在创建快照时，确保数据库处于一致性状态，可以选择使用数据库的快照功能来确保一致性
备份快照：
在存储设备管理界面中，找到备份或复制功能，选择要备份的快照，并指定备份的目标位置（可以是备份设备、备份服务器等），根据提示完成备份操作。有些存储设备支持将快照直接复制到备份设备上，而有些需要通过网络复制到备份服务器上
恢复备份：
如果需要恢复数据库，可以在存储设备管理界面中找到快照恢复或还原功能，选择要恢复的快照，并指定恢复的目标位置（通常是一个新的存储卷或 LUN），根据提示完成恢复操作

4、文件系统备份：
备份控制文件：SQL> ALTER DATABASE BACKUP CONTROLFILE TO '<目标路径>';
备份归档日志：SQL> ALTER SYSTEM ARCHIVE LOG ALL;
```

# 备份恢复

```basic
备份恢复
完全恢复：将你的数据库恢复到宕机前最后一次提交状态
不完全恢复：将你的数据库恢复到你指定的某个时间点

[oracle@localhost ~]$ rman target /

RMAN> backup database format '/opt/oracle/oradata/orcl';

#新开一个终端，进入oracle
[oracle@localhost orcl]$ sqlplus / as sysdba

#查看有那些名称空间
SQL> select tablespace_name from dba_tablespaces;
#查看有哪些文件
QL> select name from v$datafile;

#创建表
SQL> create table bak(id number) tablespace TABLESPACE_NAME;
Table created.
#插入数据
SQL> insert into bak values(1);
1 row created.
SQL> insert into bak values(2);
1 row created.
SQL> insert into bak values(3);
1 row created.
#commit提交
SQL> commit;
#查看
SQL> select * from bak;
        ID
----------
         1
         2
         3
         
#删除的是文件类型，内容不会被删除，（！和host随便用哪个），！和host代表是调用操作系统命令
SQL>!rm -rf /opt/oracle/oradata/orcl/NAMESPACE_NAME.pdf
此时你再root用户下查看目录文件已经被删除了

#删除物理文件后，继续插入数据，不会报错
SQL> insert into bak values(4);
1 row created.
#验证会出错
SQL> startup force;    这时候会报错，如106的编号

SQL> select * from v$recover_file;   #会报编号为106号的错误
SQL> desc v$datafile_header;
SQL> select file#,CHECKPOINT_CHANGE# from v$datafile_header where con_id=1;   #查看ID是不一样的

#在root用户下
rman target /       #进入恢复界面

#数据恢复
RMAN> restore datafile 106;
RMAN> recover datafile 106;   #此时数据已经恢复

#验证
SQL> select * from v$recover_file;
SQL> select file#,CHECKPOINT_CHANGE# from v$datafile_header where con_id=1;   #此时所有的ID都一样了
SQL> alter database open;
注：如果ID不一致，无法打开数据库,OPEN后再打开查看ID是一致的
```

