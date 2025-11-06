---
title: TDEngine时序数据库部署
author: Mr.xu
date: 2025-11-06 16:11:01
tags:
---

### TDEngine--集群

#### 作用

TDEngine 是一种高性能、分布式、时间序列数据库（TSDB），专门为物联网（IoT）、工业互联网、车联网、金融、IT 运维监控等领域设计。它具有高效的数据写入和查询性能，适合处理大规模的时间序列数据。以下是 TDEngine 的主要作用和用途：

1. **物联网（IoT）数据存储和分析**:
   - TDEngine 能够高效地存储和处理来自各种 IoT 设备和传感器的大量时间序列数据，支持实时数据写入和复杂查询。

2. **工业互联网**:
   - 在工业互联网应用中，TDEngine 可以用于存储和分析工业设备的运行数据、传感器数据、生产线数据等，帮助进行设备监控、预测性维护和优化生产流程。

3. **车联网**:
   - TDEngine 能够存储和处理车辆的运行数据、位置数据、传感器数据等，支持实时数据分析和查询，适用于车联网应用中的数据管理和分析。

4. **金融数据分析**:
   - 在金融领域，TDEngine 可以用于存储和分析股票、期货、外汇等金融市场的时间序列数据，支持高频交易数据的存储和实时查询分析。

5. **IT 运维监控**:
   - TDEngine 适用于 IT 运维监控场景，可以存储和分析服务器性能数据、应用程序日志、网络流量数据等，帮助运维人员进行系统监控和故障排除。

6. **高效的数据写入和查询**:
   - TDEngine 具有高效的数据写入和查询性能，能够处理每秒数百万条数据的写入和查询操作，适合大规模时间序列数据的存储和分析。

7. **分布式架构**:
   - TDEngine 采用分布式架构，支持数据的水平扩展和高可用性，能够处理海量数据并保证系统的稳定性和可靠性。

8. **内置计算能力**:
   - TDEngine 提供了丰富的内置计算能力，包括聚合计算、统计分析、数据过滤等，支持复杂的查询和数据分析操作。

9. **低存储成本**:
   - TDEngine 采用高效的数据压缩算法，能够显著降低存储成本，同时保证数据的高效查询和分析。

10. **支持多种数据接口**:
    - TDEngine 支持多种数据接口和协议，包括 SQL、RESTful API、MQTT 等，方便与各种应用和系统进行集成。

11. **实时流处理**:
    - TDEngine 支持实时流处理，可以对流数据进行实时计算和分析，适用于需要实时数据处理的应用场景。

综上所述，TDEngine 是一种专门为时间序列数据设计的高性能数据库，适合处理大规模、高频率的时间序列数据，广泛应用于物联网、工业互联网、车联网、金融、IT 运维监控等领域。

#### 资源需求

- **CPU**: 4 核 
- **内存**:  8 GB 
- **存储**: 1T
- **节点**：2

#### 网络端口

- **客户端连接端口**

  - **默认端口**: 6030

  - **用途**: 客户端（如应用程序、用户）通过该端口连接到 TDEngine 进行数据查询和写入操作。

- **管理端口**
  - **默认端口**: 6041
  - **用途**: 用于 TDEngine 管理工具（如 taos）连接到服务器进行管理操作。
- **数据传输端口**
  - **默认端口**: 6042
  - **用途**: 用于集群内部节点之间的数据传输和同步。
- **RESTful API 端口**
  - **默认端口**: 6043
  - **用途**: 提供 RESTful API 服务，允许通过 HTTP 协议进行数据操作。
- **MQTT 端口**
  - **默认端口**: 6044
  - **用途**: 支持 MQTT 协议，用于物联网设备的数据接入。

#### 安装部署
```
#下载地址
https://docs.taosdata.com/get-started/package/#!
从列表中下载获得 tar.gz 安装包；
TDengine-server-3.1.1.0-Linux-x64.tar.gz (126.7 M)      # Linux客户端下载
# 创建目录
mkdir -p /data/tasosi
# 解压到指定目录
tar xzf TDengine-server-3.1.1.0-Linux-x64.tar.gz -C /data/tasosi/
# 切换目录
cd /data/tasosi/TDengine-server-3.1.1.0/
# 启动
./install.sh -e no
# install.sh 安装脚本在执行过程中，会通过命令行交互界面询问一些配置信息。如果希望采取无交互安装方式，那么可以运行 ./install.sh -e no。运行 ./install.sh -h 指令可以查看所有参数的详细说明信息。
# 安装是交互式操作
1、提供机器的 IP 地址：#填写本机的IP
2、当安装第一个节点时，出现 Enter FQDN: 提示的时候，不需要输入任何内容。只有当安装第二个或以后更多的节点时，才需要输入已有集群中任何一个可用节点的 FQDN，支持该新节点加入集群。当然也可以不输入，而是在新节点启动前，配置到新节点的配置文件中：#直接回车
3、选择是否输入电子邮件地址，选择跳过： #直接回车

# 先不要启动--添加好集群再启动-单节点直接启动
vim  /etc/taos/taos.cfg    # 此文件下可以修改端口，增加节点，修改数据、日记的存储目录
# firstEp     hostname:6030  改为  firstEp       10.100.40.171:6030
fqdn          10.100.40.171  改为  写本机的IP地址
logDir                    /data/tasosi/log
dataDir                   /data/tasosi/data

#创建目录并赋予权限
mkdir -p /data/tasosi/data
mkdir -p /data/tasosi/log
chown -R taos:taos /data/tasosi/data
chown -R taos:taos /data/tasosi/log
chmod -R 755 /data/tasosi/*
# 复制原有数据--如果是有数据的前提下
# cp -r /var/lib/taos /data/tasosi/data
# 所有集群的配置文件都改好后-从节点一按顺序启动
systemctl start taosd
# 所有的启动后在（主节点）上添加集群
taos
show dnodes;
create dnode "10.100.40.172";  #若有多个添加多次IP，从节点的IP 
# 验证
show dnodes;   # 此时就可以看到多台集群信息了

# 删除节点
DROP DNODE "fqdn:port";
或
DROP DNODE dnodeId;

扩展：
# 启动命令分为
systemctl start taosd
systemctl start taosadapter
systemctl start taoskeeper
systemctl start taos-explorer

systemctl stop taosd
systemctl restart taosd
systemctl status taosd
如果系统中不支持 systemd，也可以用手动运行 /usr/local/taos/bin/taosd 方式启动 TDengine 服务
# 进入命令
taos
# 在 TDengine CLI 中，用户可以通过 SQL 命令来创建/删除数据库、表等，并进行数据库（Database）插入查询操作。在终端中运行的 SQL 语句需要以分号（;）结束来运行。示例：
CREATE DATABASE demo;
USE demo;
CREATE TABLE t (ts TIMESTAMP, speed INT);
INSERT INTO t VALUES ('2019-07-15 00:00:00', 10);
INSERT INTO t VALUES ('2019-07-15 01:00:00', 20);
SELECT * FROM t;
           ts            |    speed    |
========================================
 2019-07-15 00:00:00.000 |          10 |
 2019-07-15 01:00:00.000 |          20 |
Query OK, 2 row(s) in set (0.003128s)
# 修改端口号
vim /etc/taos/taos.cfg
# 此文件下可以修改端口，增加节点，修改数据、日记的存储目录