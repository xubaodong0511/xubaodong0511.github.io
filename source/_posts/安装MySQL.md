---
title: 安装MySQL
author: Mr.xu
date: 2025-01-09 18:51:48
tags: [linux,mysql]
---

# 1、yum安装MySQL

#关闭防火墙

```
systemctl stop firewalld
setenforce 0
```

# 清理环境

```shell
yum erase mariadb mariadb-server mariadb-libs mariadb-devel -y
userdel -r mysql
rm -rf /etc/my*			//配置文件
rm -rf /var/lib/mysql	//初始化生成密码的路径目录
```

# 编辑yum文件

```shell
[root@localhost yum.repos.d]# vim mysql.repo
[mysql]
name=mysql
baseurl=https://mirrors.tuna.tsinghua.edu.cn/mysql/yum/mysql-5.7-community-el7-x86_64/
gpgcheck=1
enabled=1
gpgkey=https://mirrors.ustc.edu.cn/mysql-repo/RPM-GPG-KEY-mysql
```

# 安装软件

```shell
# yum repolist enabled | grep mysql
# yum -y install mysql-community-server
# systemctl start mysqld                        //第一次启动会自动始化数据库
# systemctl enable   mysqld
# grep password /var/log/mysqld.log
```

# **修改密码**

5.7默认有临时密码，需要修改，两种方式：
第一种

```shell
# mysql -uroot -p'uopCBgXBu8,k'
mysql> alter user 'root'@'localhost' identified by 'Qianfeng123!@';
```

第二种

```bash
# mysqladmin -u root -p'uopCBgXBu8,k' password 'Qianfeng123!@'
```

**关闭弱密码限制**

```bash
rpm安装的5.7如下方式修改
# vim /etc/my.cnf
validate_password=off

编译安装的5.7如下方式修改
[mysqld]
basedir=/usr/local/mysql
datadir=/usr/local/mysql/data

[mysqld_safe]
validate_password=off
```

# 2、编译安装MySQL

#关闭防火墙

```
systemctl stop firewalld
setenforce 0
```

# 清理环境

```
yum erase mariadb mariadb-server mariadb-libs mariadb-devel -y
userdel -r mysql
rm -rf /etc/my*
rm -rf /var/lib/mysql
```

# 创建MySQL用户

```
useradd -r mysql -M -s /sbin/nologin
# -M指定不安装家目录
```

# 安装编译工具，以及依赖软件

```
yum -y install ncurses ncurses-devel openssl-devel bison gcc gcc-c++ make cmake
```

# 创建mysql目录

```
mkdir -p /usr/local/{data,mysql,log}
```

# 官方下载MySQL的boost包

```
wget https://mirrors.aliyun.com/mysql/MySQL-5.7/mysql-boost-5.7.36.tar.gz?spm=a2c6h.25603864.0.0.b21f63aftvppVw
```

# 更改包名

```
mv mysql-boost-5.7.36.tar.gz?spm=a2c6h.25603864.0.0.b21f63aftvppVw mysql-boost-5.7.36.tar.gz
```

# 解压下载的软件包

```
tar zxvf mysql-boost-5.7.36.tar.gz -C /usr/local/
```

# 切换目录

```
cd /usr/local/mysql-5.7.36/
```

# 编译安装

```
cmake . \
-DWITH_BOOST=boost/boost_1_59_0/ \
-DCMAKE_INSTALL_PREFIX=/usr/local/mysql \
-DSYSCONFDIR=/etc \
-DMYSQL_DATADIR=/usr/local/mysql/data \
-DINSTALL_MANDIR=/usr/share/man \
-DMYSQL_TCP_PORT=3306 \
-DMYSQL_UNIX_ADDR=/tmp/mysql.sock \
-DDEFAULT_CHARSET=utf8 \
-DEXTRA_CHARSETS=all \
-DDEFAULT_COLLATION=utf8_general_ci \
-DWITH_READLINE=1 \
-DWITH_SSL=system \
-DWITH_EMBEDDED_SERVER=1 \
-DENABLED_LOCAL_INFILE=1 \
-DWITH_INNOBASE_STORAGE_ENGINE=1
```

# 编译安装

```
make -j2 && make -j2 install
# -j2是指定2核
```

#如果安装出错，想重新安装：不用重新解压，只需要删除安装目录中的缓存文件

# 配置文件添加命令路径

```
cat >> /etc/profile <<EOF
mysql=/user/local/mysql/bin/
EOF
```

# 重启profile文件

```
source /etc/profile
```

#找到安装目录，拷贝mysql.service脚本文件到/etc/init.d/目录下，添加开机启动

```
cp /usr/local/mysql/support-files/mysql.service /etc/init.d/mysqld
chmod a+x /etc/init.d/mysqld
# chkconfig: 2346 63 80
chkconfig--add mysqld
systemctl daemon-reload
```

# 进入安装目录修改权限

```
chown -R mysql.mysql .
```

# 初始化

````bash
./bin/mysqld --initialize --user=mysql --basedir=/usr/local/mysql --datadir=/usr/local/mysql/data
```
# 初始化,只需要初始化一次，初始化完成之后，一定要记住提示最后的密码用于登陆或者修改密码
# 添加配置文件,删除旧配置文件之后，再添加如下内容
```
cat >> /etc/my.cnf << EOF
[mysqld]
basedir=/usr/local/mysql       #指定安装目录
datadir=/usr/local/mysql/data  #指定数据存放目录
EOF
```
# 杀死原进程
```
pkill mysqld
```
# 重启MySQL服务
```
systemctl start mysqld 	前提关闭之前的进程，再用start启动MySQL
#systemctl status mysqld
#systemctl stop mysqld
#sh mysqld restart
```
# 启动
```
cd /usr/local/mysql
./bin/mysqld_safe --user=mysql &
```
# 获取密码
```
#temp_password=$(sudo cat bin/mysqld --initialize --user=mysql --basedir=/usr/local/mysql --datadir=/usr/local/mysql/data | grep 'temporary localhost' | awk '{print $NF}')
#mysql -uroot -p"${temp_password}" --connect-expired-password <<EOF
#ALTER USER 'root'@'localhost' IDENTIFIED BY "${Mysql_Pass}";
#FLUSH PRIVILEGES;
#EOF
```
# 登录测试
```
# /usr/local/mysql/bin/mysql -uroot -p'ZrSw)Ns_*9iR'
```
#如果需要重新初始化...
```
# killall mysqld
# rm -rf /usr/local/mysql/data
# bin/mysqld --initialize --user=mysql --basedir=/usr/local/mysql --datadir=/usr/local/mysql/data
```
````
