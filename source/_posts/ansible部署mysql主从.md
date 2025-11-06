---
title: ansible部署mysql主从
author: Mr.xu
date: 2025-11-05 22:13:07
tags:
---

### MySQL主从

#### 作用：

MySQL 是一种开源的关系数据库管理系统（RDBMS），广泛用于各种应用场景。以下是 MySQL 的主要作用和用途：

1. **数据存储和管理**:
   - MySQL 用于存储和管理大量结构化数据。它支持多种数据类型和复杂的查询操作，适合处理各种业务数据。

2. **Web 应用程序**:
   - MySQL 是许多 Web 应用程序的后端数据库，尤其是与 PHP 结合使用。常见的内容管理系统（CMS）如 WordPress、Joomla 和 Drupal 都依赖 MySQL。

3. **电子商务**:
   - 电子商务平台如 Magento、WooCommerce 和 Shopify 使用 MySQL 来管理产品信息、订单、客户数据等。

4. **数据分析**:
   - MySQL 可以用于数据分析和商业智能（BI），通过与工具如 Tableau、Power BI 和 Excel 集成，帮助企业做出数据驱动的决策。

5. **企业应用**:
   - 企业资源计划（ERP）、客户关系管理（CRM）和其他企业级应用程序常常使用 MySQL 作为其数据库后端。

6. **高可用性和扩展性**:
   - MySQL 支持复制和集群功能，可以实现高可用性和扩展性，满足大规模应用的需求。

7. **开发和测试**:
   - 开发人员使用 MySQL 进行应用程序开发和测试，得益于其易用性和广泛的社区支持。

8. **数据备份和恢复**:
   - MySQL 提供多种数据备份和恢复工具，确保数据安全和完整性。

9. **支持多种编程语言**:
   - MySQL 支持多种编程语言，如 Java、Python、PHP、C++ 等，方便开发者集成和使用。

10. **开源和社区支持**:
    - 作为开源软件，MySQL 拥有庞大的用户社区，提供丰富的资源、插件和扩展，用户可以根据需要进行定制和优化。

MySQL 的广泛应用和灵活性使其成为许多企业和开发者的首选数据库管理系统。

#### 资源需求：

- **CPU**: 4核 
- **内存**:  8GB 
- **存储**: 1T
- **节点**：2

#### 网络端口:

**默认端口**

- **MySQL 端口**：3306
- **用途：**
  - **客户端连接**：
    - MySQL 客户端（如 `mysql` 命令行工具、MySQL Workbench、各种编程语言的 MySQL 驱动等）使用端口 3306 连接到 MySQL 服务器进行数据库操作，如查询、插入、更新和删除数据。
  - **应用程序连接**：
    - 各种应用程序（如 Web 应用、企业应用、数据分析工具等）通过端口 3306 连接到 MySQL 服务器，以访问和操作存储在数据库中的数据。
  - **数据库管理工具**：
    - 数据库管理工具（如 phpMyAdmin、Adminer、HeidiSQL 等）通过端口 3306 连接到 MySQL 服务器，提供图形化的数据库管理界面，方便用户进行数据库管理和维护。

#### 安装部署

##### 定义主机组

```
[root@localhost ~]# vim inventory.ini 
[mysql_master]
master ansible_host=10.100.40.251


[mysql_slave]
slave ansible_host=10.100.40.252

```

##### 设置主机组

```
[root@localhost ~]# vim ansible.cfg 
[defaults]
inventory = ./inventory.ini
```

##### 编写剧本

```
[root@localhost ~]# vim mysql_cluster.yaml 
---
- name: Install and configure MySQL master-slave replication
  hosts: all
  become: true
  gather_facts: false
  vars:
    mysql_pass: "Kunyue@123"
    repl_password: "Kunyue@123"
    master_ip: "10.100.40.251"
    mysql_repo_url: "https://mirrors.tuna.tsinghua.edu.cn/mysql/yum/mysql-5.7-community-el7-x86_64/"
    mysql_gpg_key_url: "https://mirrors.ustc.edu.cn/mysql-repo/RPM-GPG-KEY-mysql"
    is_master: "{{ inventory_hostname == 'master' }}"
    temp_password: ""


  tasks:
    - name: Ensure Python 2 is installed
      yum:
        name: python2
        state: present


    - name: Ensure pip for Python 2 is installed
      get_url:
        url: https://bootstrap.pypa.io/pip/2.7/get-pip.py
        dest: /tmp/get-pip.py


    - name: Install pip for Python 2
      command: python2 /tmp/get-pip.py


    - name: Install MySQL repository
      yum_repository:
        name: mysql
        description: MySQL Community Edition
        baseurl: "{{ mysql_repo_url }}"
        gpgcheck: no
        enabled: yes
        gpgkey: "{{ mysql_gpg_key_url }}"


    - name: Install MySQL packages
      yum:
        name: mysql-community-server
        state: present


    - name: Install setuptools for Python 2
      yum:
        name: python-setuptools
        state: present


    - name: Install PyMySQL using pip for Python 2
      pip:
        name: PyMySQL
        executable: pip2


    - name: Start MySQL service
      service:
        name: mysqld
        state: started
        enabled: yes


    - name: Get temporary MySQL root password
      shell: grep 'temporary password' /var/log/mysqld.log | awk '{print $NF}'
      register: temp_password


    - name: Reset MySQL root password and handle expired password
      command: >
        mysql --connect-expired-password -uroot -p{{ temp_password.stdout }} -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '{{ mysql_pass }}';"
      ignore_errors: yes


    - name: Restart MySQL service
      service:
        name: mysqld
        state: restarted


    - name: Configure MySQL master
      when: is_master
      block:
        - name: Add MySQL configuration for master
          lineinfile:
            path: /etc/my.cnf
            regexp: '^log-bin'
            line: |
              log-bin=/var/lib/mysql/master
              server-id=1
              gtid_mode=ON
              enforce_gtid_consistency=1
          notify: restart mysql


        - name: Create replication user on master
          mysql_user:
            login_user: root
            login_password: "{{ mysql_pass }}"
            name: slave
            password: "{{ repl_password }}"
            priv: "*.*:REPLICATION SLAVE,SUPER,RELOAD"
            host: "%"
          environment:
            MYSQL_PWD: "{{ mysql_pass }}"


    - name: Configure MySQL slave
      when: not is_master
      block:
        - name: Add MySQL configuration for slave
          lineinfile:
            path: /etc/my.cnf
            regexp: '^log-bin'
            line: |
              log-bin=/var/lib/mysql/slave
              server-id=2
              gtid_mode=ON
              enforce_gtid_consistency=1
          notify: restart mysql


        - name: Restart MySQL service
          service:
            name: mysqld
            state: restarted


        - name: Set master info and start replication on slave
          mysql_replication:
            login_user: root
            login_password: "{{ mysql_pass }}"
            mode: changemaster
            master_host: "{{ master_ip }}"
            master_user: slave
            master_password: "{{ repl_password }}"
            master_auto_position: yes
          environment:
            MYSQL_PWD: "{{ mysql_pass }}"


  handlers:
    - name: restart mysql
      service:
        name: mysqld
        state: restarted

```

##### 执行剧本

```
[root@localhost ~]# ansible-playbook -i inventory.ini mysql_cluster.yaml
```

##### 验证

```
mysql -uroot -p'密码'

show slave status \G
```

##### 更改存储目录

```
# 停止MySQL
systemctl stop mysqld
mkdir -p /data/mysql/data
chown -R mysql:mysql /data/mysql
chmod -R  755 /data/mysql

vim /etc/my.cnf
datadir=/data/mysql/data		#更改位置
#启动
systemctl start mysqld
#更改密码
cat /var/log/mysqld.log |grep password

#验证目录位置
SHOW VARIABLES LIKE 'datadir';


# 设置主从
'先对时间'
firewalld 	selinux 	//关闭
vim /etc/hosts			//hosts解析 可选项
	192.168.116.111	master
	192.168.116.124	slave

完全备份,保持两台mysql数据一样
scp -r /xtrabackup/full/2023-11-10_14-18-09/ root@192.168.116.124:/

ping一下网络连接： ping master
				 ping slave
实验示例：
'主'：
vim /etc/my.cnf
log-bin=/var/lib/mysql/master
server-id=1 		//ID号需要跟从的配置不一样
gtid_mode=ON
enforce_gtid_consistency=1

# 进入MySQL里面
grant replication slave,super,reload on *.* to slave@'%' identified by 'Qingfeng123!';
flush privileges;

'从'：
vim /etc/my.cnf
log-bin=/var/lib/mysql/slave
server-id=2 		//ID号需要跟主的配置不一样
gtid_mode=ON
enforce_gtid_consistency=1

# master_host='master'
# 如果没有hosts没有解析，解析ip，已经解析了就写master
change master to master_host='master',master_user='slave',master_password='Qingfeng@123',master_auto_position=1;
start slave;
show slave status\G

'互为主从'
从：grant replication slave,super,reload on *.* to slave@'%' identified by 'Qingfeng123!';
flush privileges;
主:change master to master_host='slave',master_user='slave',master_password='Qingfeng@123',master_auto_position=1;
start slave;
show slave status\G
验证：
主上写数据
从上面读数据
```

##### 设置主从

```
# 主节点
grant replication slave,super,reload on *.* to slave@'%' identified by '123456';
flush privileges;

#从节点
change master to master_host='10.100.40.171',master_user='slave',master_password='123456',master_auto_position=1;
start slave;
show slave status\G
```
