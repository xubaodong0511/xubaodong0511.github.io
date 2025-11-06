---
title: EMQX集群部署
author: Mr.xu
date: 2025-11-05 22:15:49
tags:
---

### emqx--集群

#### 作用

EMQX（Erlang MQTT Broker）是一个高性能、可扩展的开源 MQTT 消息代理服务器。它基于 Erlang/OTP 开发，专为大规模物联网（IoT）应用设计。EMQX 的核心作用和功能如下：

1. **消息代理**：EMQX 作为 MQTT 消息代理，负责在发布者和订阅者之间路由消息。它支持 MQTT 协议的所有功能，包括 QoS（Quality of Service）级别、持久会话和遗嘱消息等。
2. **设备连接管理**：EMQX 可以管理大量 IoT 设备的连接，支持数百万级别的并发连接，适用于大规模的物联网应用。
3. **数据分发**：EMQX 能够高效地分发数据，确保消息在发布者和订阅者之间的快速传递，支持多种消息格式和传输协议。
4. **扩展性**：EMQX 支持插件机制，用户可以根据需求扩展其功能，如数据持久化、规则引擎、认证和授权等。

**主要功能**

1. **支持多种协议**
   - **MQTT/MQTT-SN**：原生支持 MQTT 3.1.1 和 MQTT 5.0 协议。
   - **HTTP/HTTPS**：支持通过 HTTP/HTTPS 协议进行消息发布和订阅。
   - **CoAP**：支持 Constrained Application Protocol（CoAP），适用于资源受限的设备。
   - **WebSocket**：支持通过 WebSocket 进行 MQTT 通信，方便 Web 应用集成。

2. **高性能和高可用性**
   - **高并发连接**：支持数百万级别的并发连接，适用于大规模 IoT 部署。
   - **集群支持**：支持集群部署，提供高可用性和负载均衡。
   - **水平扩展**：可以通过增加节点来扩展系统容量。

3. **安全性**
   - **认证和授权**：支持多种认证方式（如用户名/密码、客户端证书、LDAP 等）和细粒度的访问控制。
   - **加密通信**：支持 TLS/SSL 加密，确保数据传输的安全性。

4. **规则引擎**
   - **数据处理**：内置规则引擎，可以根据预定义的规则对消息进行处理、过滤和转发。
   - **集成外部系统**：支持与数据库、消息队列、HTTP 服务等外部系统集成。

5. **监控和管理**
   - **管理控制台**：提供友好的 Web 管理控制台，方便用户进行配置和管理。
   - **监控和告警**：支持实时监控系统状态和性能，提供告警机制。

**典型应用场景**

1. **智能家居**：管理和控制大量智能家居设备，实现设备间的消息通信和数据共享。
2. **工业物联网**：在工业环境中，管理各种传感器和设备的数据采集和传输。
3. **车联网**：支持车辆与云端的实时通信，管理车辆数据和远程控制。
4. **智慧城市**：管理城市基础设施（如路灯、交通信号灯、环境监测设备等）的数据通信。

#### 资源需求

- **CPU**: 4 核 
- **内存**:  8 GB 
- **存储**: 300G
- **节点**：2

#### 网络端口

1. **默认管理端口**
   - **端口号**: 18083
   - **用途**: EMQX Dashboard（管理控制台）端口，用于管理和监控 EMQX。
2. **MQTT 端口**
   - **端口号**: 1883
   - **用途**: MQTT 协议默认端口，用于客户端连接。
3. **MQTT/TLS 端口**
   - **端口号**: 8883
   - **用途**: 使用 TLS/SSL 加密的 MQTT 连接端口。
4. **WebSocket 端口**
   - **端口号**: 8083
   - **用途**: 支持 WebSocket 的 MQTT 连接端口。
5. **WebSocket/TLS 端口**
   - **端口号**: 8084
   - **用途**: 使用 TLS/SSL 加密的 WebSocket 连接端口。
6. **集群通信端口**
   - **端口号**: 4369, 6000-6999
   - **用途**: EMQX 集群节点之间的通信端口。

#### 安装部署
```
# 下载安装包
wget https://www.emqx.com/zh/downloads/broker/5.7.0/emqx-5.7.0-el7-amd64.tar.gz

mkdir -p /data/emqx/data
# 创建目录、解压
mkdir -p /data/emqx/data && tar -zxvf emqx-5.7.0-el7-amd64.tar.gz -C /data/emqx
# 编辑配置文件
cd /data/emqx
vim etc/emqx.conf
# 将原有的改为以下内容--在每个节点上添加更改，更后按顺序启动
node {
  name = "emqx@10.100.40.171"     # 本机IP
  cookie = "emqxsecretcookie"
  data_dir = "/data/emqx/data"     # 数据存放目录
}

cluster {
  name = emqxcl
  discovery_strategy = manual
  static {
    seeds = [
      "emqx@10.100.40.171",     # 添加集群
      "emqx@10.100.40.172"
    ]
  }
}

# 启动
./emqx/bin/emqx start

# 加入集群--在从机器上操作
cd /data/emqx
./bin/emqx_ctl cluster join emqx@10.100.40.172      # 在从机器上操作，写主节点的IP

# 验证--在主机器上操作，查看状态
./bin/emqx_ctl cluster status

# 验证数据目录路径
[root@emqx01 data]# grep 'data_dir' /data/emqx/etc/emqx.conf
  data_dir = "/data/emqx/data"

# 访问
10.1.15.101:18083		默认账号: admin 默认密码：public
10.1.15.102:18083		默认账号: admin 默认密码：public
