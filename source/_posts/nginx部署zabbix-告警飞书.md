---
title: nginx部署zabbix--告警飞书
author: Mr.xu
date: 2025-11-06 20:43:58
tags:
---

### nginx部署zabbix

# 关闭防火墙
```
systemctl stop firewalld
setenforce 0
sed -i 's/SELINUX=enforcing/SELINUX=disabled/' /etc/selinux/config
```
# 安装Zabbix存储库
```
rpm -Uvh https://repo.zabbix.com/zabbix/5.0/rhel/7/x86_64/zabbix-release-5.0-1.el7.noarch.rpm
yum clean all
```
# 安装 Zabbix server and agent
```
yum install zabbix-server-mysql zabbix-agent -y
yum install centos-release-scl -y
```
# 编辑配置文件 /etc/yum.repos.d/zabbix.repo 并启用zabbix前端存储库
```
sed -i "11s/enabled=0/enabled=1/" /etc/yum.repos.d/zabbix.repo
```
# 安装Zabbix前端软件包
```
yum -y install zabbix-web-mysql-scl zabbix-nginx-conf-scl
```
# 安装数据库并设置开机自启
```
yum -y install mariadb-server
systemctl start mariadb && systemctl enable mariadb
```
# 初始化数据库
```
[root@localhost ~]# mysql_secure_installation

回车

出现Set root password? [Y/n] 提示:输出Y,并设置密码

Remove anonymous users? [Y/n] Y

Disallow root login remotely? [Y/n] n

Remove test database and access to it? [Y/n] Y

Reload privilege tables now? [Y/n] Y
```

# 创建数据库，用户，允许用户远程登录
```
mysql -uroot -p'密码'

create database zabbix character set utf8 collate utf8_bin;
create user zabbix@localhost identified by '123456';
grant all privileges on zabbix.* to zabbix@'%';
flush privileges;
\q;
```
# 导入初始架构和数据，系统将提示您输入新创建的密码
```
zcat /usr/share/doc/zabbix-server-mysql*/create.sql.gz | mysql -uzabbix -p'123456' zabbix
```
# 为Zabbix server配置数据库，编辑配置文件 /etc/zabbix/zabbix_server.conf
```
sed -i "s/# DBPassword=.*/DBPassword=123456/" /etc/zabbix/zabbix_server.conf
```
# 编辑配置文件 /etc/opt/rh/rh-php72/php-fpm.d/zabbix.conf, 添加nginx进行监听,然后取消注释并设置正确的时区
```
sed -i "s/listen.acl_users = apache/listen.acl_users = apache,nginx/" /etc/opt/rh/rh-php72/php-fpm.d/zabbix.conf
echo 'php_value[date.timezone] = Asia/Shanghai' >> /etc/opt/rh/rh-php72/php-fpm.d/zabbix.conf
```
# 启动Zabbix server和agent进程，并为它们设置开机自启
```
systemctl restart zabbix-server zabbix-agent rh-nginx116-nginx rh-php72-php-fpm
systemctl enable zabbix-server zabbix-agent rh-nginx116-nginx rh-php72-php-fpm
```
# 停止rh-nginx116-nginx
```
systemctl stop rh-nginx116-nginx 
```
# 验证80端口还在不在，如果不在就可以安装nginx了
```
netstat -lnpt |grep 80
bash <(curl -sSL https://gitee.com/xbd666/qingfeng/raw/dev/new-toolbox.sh)		#下载nginx
```
# 将 /etc/opt/rh/rh-nginx116/nginx/conf.d/zabbix.conf目录下的配置文件复制到nginx/conf.d目录下，创建代理文件
```
cp /etc/opt/rh/rh-nginx116/nginx/conf.d/zabbix.conf  /etc/nginx/conf.d/zabbix.conf
```
```
vim zabbix.conf				# 修改2处位置
server {
        listen          80;				# 定义要监听的端口，可以自定义，尽量别用80，容易冲突
        server_name     192.168.0.253;		# 更改为本机的IP地址

        root    /usr/share/zabbix;

        index   index.php;

        location = /favicon.ico {
                log_not_found   off;
        }

        location / {
                try_files       $uri $uri/ =404;
        }

        location /assets {
                access_log      off;
                expires         10d;
        }

        location ~ /\.ht {
                deny            all;
        }

        location ~ /(api\/|conf[^\.]|include|locale|vendor) {
                deny            all;
                return          404;
        }

        location ~ [^/]\.php(/|$) {
                fastcgi_pass    unix:/var/opt/rh/rh-php72/run/php-fpm/zabbix.sock;
#                fastcgi_pass    unix:/var/opt/rh/rh-php73/run/php-fpm/zabbix.sock;
                fastcgi_split_path_info ^(.+\.php)(/.+)$;
                fastcgi_index   index.php;

                fastcgi_param   DOCUMENT_ROOT   /usr/share/zabbix;
                fastcgi_param   SCRIPT_FILENAME /usr/share/zabbix$fastcgi_script_name;
                fastcgi_param   PATH_TRANSLATED /usr/share/zabbix$fastcgi_script_name;

                include fastcgi_params;
                fastcgi_param   QUERY_STRING    $query_string;
                fastcgi_param   REQUEST_METHOD  $request_method;
                fastcgi_param   CONTENT_TYPE    $content_type;
                fastcgi_param   CONTENT_LENGTH  $content_length;

                fastcgi_intercept_errors        on;
                fastcgi_ignore_client_abort     off;
                fastcgi_connect_timeout         60;
                fastcgi_send_timeout            180;
                fastcgi_read_timeout            180;
                fastcgi_buffer_size             128k;
                fastcgi_buffers                 4 256k;
                fastcgi_busy_buffers_size       256k;
                fastcgi_temp_file_write_size    256k;
        }
}
```
# 重启服务
```
systemctl restart nginx
systemctl restart zabbix-server zabbix-agent rh-php72-php-fpm
```
# 访问地址
`本机的IP+端口`
`默认 用户： Admin	密码：zabbix`


# agent端配置
# 关闭防火墙
```
systemctl stop firewalld
setenforce 0
sed -i 's/SELINUX=enforcing/SELINUX=disabled/' /etc/selinux/config
```
# 安装zabbix--agent端
```
rpm -Uvh https://repo.zabbix.com/zabbix/5.0/rhel/7/x86_64/zabbix-release-5.0-1.el7.noarch.rpm
yum install zabbix-agent zabbix-sender -y
cp /etc/zabbix/zabbix_agentd.conf /etc/zabbix/zabbix_agentd.conf.bak
```
# 定义配置文件
```
vim /etc/zabbix/zabbix_agentd.conf
server=127.0.0.1			# 写server端的IP
ServerActive=127.0.0.1		# 写server端的IP
Hostname=test		# 定义被监控端的名字
UnsafeUserParameters=0		# 改为UnsafeUserParameters=1
```
# 启动
```
systemctl start zabbix-agent && systemctl enable zabbix-agent
```
`此时可以去web页面去配置了`

# zabbix报警飞书机器人
```
飞书PC端==>>创建群组
打开群组设置==>>添加“自定义机器人”
设置机器人名称、描述，复制保存生成的webhook地址
```
# 创建飞书脚本文件
登录zabbix服务器，进入到/usr/lib/zabbix/alertscripts/目录，新建feishu.py文件。
```
vi /usr/lib/zabbix/alertscripts/feishu.py
添加以下内容：
#!/usr/bin/python3
import requests
import json
import sys
import os
import datetime

url = "webhook地址" #你复制的webhook地址粘贴进url内


def send_message(message):
    payload_message = {
        "msg_type": "text",
        "content": {
            "text": message
        }
    }
    headers = {
        'Content-Type': 'application/json'
    }

    response = requests.request("POST", url, headers=headers, data=json.dumps(payload_message))
    return response


if __name__ == '__main__':
    text = sys.argv[1]
    send_message(text)
```
# 添加执行权限
```
chmod +x /usr/lib/zabbix/alertscripts/feishu.py
```
# 添加zabbix报警媒介
```
创建报警媒介类型，参数添加：{ALERT.MESSAGE}
用户内添加报警媒介
根据需求配置需要告警的级别
添加完成后点击更新

名称：feishu                   #名称任意
类型：脚本
脚本名称：feishu.py      
脚本参数： {ALERT.MESSAGE}     #一定要写，否则可能发送不成功
```
# 创建动作并配置
```
配置--创建动作--操作（设置通知用户，触发的脚本名称，消息内容）·
```
```
报警脚本：

异常通知: {EVENT.NAME}

告警主机:{HOSTNAME1}
告警时间:{EVENT.TIME}
告警等级:{TRIGGER.SEVERITY} 
告警信息:{EVENT.NAME} 
告警项目:{TRIGGER.KEY1} 
问题详情:{ITEM.NAME}:{ITEM.VALUE} 
当前状态:{TRIGGER.STATUS}:{ITEM.VALUE1} 
事件ID:{EVENT.ID}
```
```
恢复操作脚本：

恢复通知: {EVENT.NAME}

告警主机:{HOSTNAME1}
告警时间:{EVENT.TIME}
告警等级:{TRIGGER.SEVERITY} 
告警信息:{EVENT.NAME} 
告警项目:{TRIGGER.KEY1} 
问题详情:{ITEM.NAME}:{ITEM.VALUE} 
当前状态:{TRIGGER.STATUS}:{ITEM.VALUE1} 
事件ID:{EVENT.ID}

点击保存即可
```
# 告警媒介测试，及常见错误处理
```
测试告警媒介
```
# 没问题就可以在  配置--主机-- 触发器里配置了

# 常见错误：
1.python3路径错误

feishu.py脚本的第一句配置的python3路径不对需要手动重新手动指定

找到当前系统python3的路径替换feishu.py脚本中的第一行#!/usr/bin/python3
```
[root@Zabbix alertscripts]# whereis python3
python3: /usr/local/bin/python3.8 /usr/local/bin/python3.8-config /usr/local/bin/python3 /usr/local/lib/python3.8
```
2.python3环境没有安装requests模块,使用pip3安装requests模块
```
[root@Zabbix alertscripts]# pip3 install requests
```