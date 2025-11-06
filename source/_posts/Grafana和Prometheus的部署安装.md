---
title: Grafana和Prometheus的部署安装
author: Mr.xu
date: 2025-11-06 20:54:10
tags:
---

# Grafana和Prometheus的搭建

## 服务端

## 首先搭建Prometheus 服务端

`在官网下载`

## 或者也可以在我的云盘直接下载

```ini
wget https://a.xbd666.cn/d/Aliyun/Cloud_computing/Software_package/prometheus-Grafana/prometheus-2.47.2.linux-amd64.tar.gz
```

## 下载到服务器后解压出来

```ini
[root@localhost ~]# tar xvf prometheus-2.47.2.linux-amd64.tar.gz -C /usr/local/prometheus
[root@localhost ~]# cd /usr/local/prometheus
[root@localhost prometheus]# useradd prometheus -s /usr/sbin/nologin
[root@localhost prometheus]# chown -R prometheus.prometheus ./*
```

## 进入目录后编辑配置文件，需要改动的是最后几行，是添加其他节点以及主机的

```ini
[root@localhost ~]# cd /usr/local/prometheus/
[root@localhost prometheus]# vim prometheus.yml
 - job_name: "prometheus"

    # metrics_path defaults to '/metrics'
    # scheme defaults to 'http'.

    static_configs:
      - targets: ["10.31.162.39:9100"]		#更改成自己的IP地址，端口改为9100
```

## 启动查看测试

```ini
[root@localhost prometheus]# ./prometheus //启动后查看9090端口的服务里面tag里面有几台机器

测试
在浏览器输入IP：9090 -- 会出来prometheus的界面
```

## 然后写service服务文件，让其可以通过systemctl控制他,配置文件路径改成自己的

```ini
service文件要存放在/etc/systemd/system目录下    
[root@localhost prometheus]# cd /etc/systemd/system
[root@localhost system]# vim prometheus.service
[Unit]
Description=prometheus
After=network.target 

[Service]
User=prometheus
Group=prometheus
WorkingDirectory=/usr/local/prometheus
ExecStart=/usr/local/prometheus/prometheus
[Install]
WantedBy=multi-user.target
```

## 重载服务，尝试用systemctl控制他开启

```ini
➜ systemctl daemon-reload
➜ systemctl start prometheus.service
➜ systemctl enable prometheus.service
➜ systemctl status prometheus.service
```

## 安装 node_exporter

**接下来安装node节点，统一采用docker方式安装，没什么因为快。**

## 先安装docker环境

```ini
sudo yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-engine
                  
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
yum -y install docker-compose
sudo systemctl start docker
```

## 配置docker-compose.yml文件

```ini
yml文件要在prometheus目录下的data目录里面
[root@localhost ~]# cd /usr/local/prometheus/data/
version: '3.8'
services:
  grafana:
    image: grafana/grafana-enterprise
    container_name: grafana
    restart: alway
    user: '0'
    ports:
      - '3000:3000'
    # adding the mount volume point which we create earlier
    volumes:
      - './data:/var/lib/grafana' //和当前docker-compose文件放在一起的data下
```

## 拉取

```ini
docker pull prom/node-exporter
```

## 一条命令启动

```ini
docker run -d --name node --restart=always -p 9100:9100 prom/node-exporter

直接映射到9100端口了，可以打开看一下测试页，因为是node没有其他东西正常只要在server端添加到配置文件就行了
```

## 安装 Grafana

```ini
docker run -d --name=grafana -p 3000:3000 grafana/grafana

#如果需要保持到卷里面,直接用这个(二选一)
docker run -d -p 3000:3000 --name=grafana \
  --volume grafana-storage:/var/lib/grafana \
  grafana/grafana-enterprise
```

## 测试

`在浏览器中输入IP：3000`**grafana的界面就出来了，此时配置成功**