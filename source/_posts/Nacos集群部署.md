---
title: Nacos集群部署
author: Mr.xu
date: 2025-11-06 16:10:08
tags:
---

### Nacos--集群

#### 作用

Nacos（Dynamic Naming and Configuration Service）是阿里巴巴开源的一个动态服务发现、配置管理和服务管理平台。它主要用于微服务架构中的服务注册与发现、分布式配置管理和动态 DNS 服务。Nacos 的核心功能和作用如下：

1. **服务发现和注册**

- **服务注册**：Nacos 允许服务实例在启动时向 Nacos 注册自己的信息（如 IP 地址、端口、服务名称等），从而使其他服务能够发现它们。
- **服务发现**：服务消费者可以通过 Nacos 查询到所需服务的实例信息，从而实现服务间的调用。Nacos 支持多种服务发现机制，如 DNS 和 HTTP。

2. **分布式配置管理**

- **配置管理**：Nacos 提供了集中化的配置管理功能，允许开发者将应用配置存储在 Nacos 服务器上。配置的变更可以实时推送到各个服务实例，避免了因配置变更而重启服务的需求。
- **动态配置**：通过 Nacos，配置可以在运行时动态更新，服务实例会自动感知配置的变化并做出相应调整。

3. **动态 DNS 服务**

- **动态 DNS**：Nacos 支持动态 DNS 服务，可以将服务名解析为服务实例的 IP 地址和端口，方便服务间的调用和负载均衡。

4. **集群管理**

- **集群管理**：Nacos 支持对服务实例进行健康检查和集群管理，确保服务的高可用性和可靠性。它可以自动剔除不健康的实例，并在实例恢复后重新加入到服务列表中。

5. **多语言支持**

- **多语言支持**：Nacos 提供了丰富的客户端 SDK，支持 Java、Go、C++ 等多种编程语言，方便开发者在不同语言的项目中集成 Nacos。

6. **可视化管理界面**

- **可视化界面**：Nacos 提供了友好的 Web 管理界面，方便开发者和运维人员对服务和配置进行管理和监控。

7. **高可用和扩展性**

- **高可用**：Nacos 支持集群部署，保证服务的高可用性和容错性。
- **扩展性**：Nacos 设计灵活，支持插件机制，可以根据需要扩展功能。

**典型应用场景**

1. **微服务架构**：在微服务架构中，Nacos 作为服务注册与发现的核心组件，简化了服务间的通信和管理。
2. **分布式系统**：在分布式系统中，Nacos 提供集中化的配置管理，简化了配置的管理和推送。
3. **云原生应用**：在云原生应用中，Nacos 提供动态 DNS 和服务发现功能，支持服务的弹性伸缩和动态管理。

#### 资源需求

- **CPU**: 4 核 
- **内存**:  8 GB 
- **存储**: 300G
- **节点**：2

#### 网络端口

1. **默认端口**
   - **端口号**: 8848
   - **用途**: Nacos 的 HTTP API 端口，用于服务注册、配置管理和其他 API 调用。
2. **集群通信端口**
   - **端口号**: 7848
   - **用途**: Nacos 集群节点之间的通信端口。

#### 安装部署
```
# 安装jdk
wget https://a.xbd666.cn/d/Aliyun/Cloud_computing/Software_package/tomcat-jdk/jdk-8u271-linux-x64.tar.gz
jdk在/usr/local目录下，设置变量

# 下载nacos安装包
wget https://a.xbd666.cn/d/Aliyun/Cloud_computing/Software_package/nacos/nacos-server-1.2.1.tar.gz

#创建目录
mkdir -p /data/nacos
# 解压
tar xzf nacos-server-2.3.2.tar.gz -C /data/nacos
cd /data/nacos/nacos/conf
# 编辑连数据库的 配置文件
vim application.properties
更改以下内容
spring.datasource.platform=mysql      # 去除注释
# spring.sql.init.platform=mysql

### Count of DB:
db.num=1    # 去除注释

### Connect URL of DB:
db.url.0=jdbc:mysql://10.100.40.171:3306/nacos?characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true&useUnicode=true&useSSL=false&serverTimezone=UTC    # 改MySQL机器的IP地址
db.user.0=root     # 改为root用户
db.password.0=Kunyue@123     # 改为MySQL的密码
spring.data.dir=/data/nacos/data		#定义数据存放目录

#创建目录
mkdir -p /data/nacos/data
chmod -R 755 /data/nacos
# 导入数据--并创建nacos数据库
CREATE USER 'root'@'%' IDENTIFIED BY '123456';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%';
flush privileges;

# 编辑集群配置文件--添加集群IP地址
cp cluster.conf.example cluster.conf.example.bak
mv cluster.conf.example cluster.conf
vim cluster.conf
添加nacos集群的IP地址
10.100.40.170:8848
10.100.40.171:8848
10.100.40.172:8848

# 启动
./bin/startup.sh
# 停止
./bin/shutdown.sh

# 登入、验证
http://IP + 8848/nacos
在web界面左侧栏--集群管理--节点管理   # 可以看到所有集群的状态
           
           
           
### 开启鉴权
通过base64命令随机生成token
[root@emqx01 conf]# echo -n 'ThisIsARandomlyGeneratedSecureKey32CharactersLong' | base64
VGhpc0lzQVJhbmRvbWx5R2VuZXJhdGVkU2VjdXJlS2V5MzJDaGFyYWN0ZXJzTG9uZw==

#编辑配置
vim /data/nacos/nacos/conf/application.properties
nacos.core.auth.enabled=true

### 关闭使用user-agent判断服务端请求并放行鉴权的功能
nacos.core.auth.enable.userAgentAuthWhite=false

### 配置自定义身份识别的key（不可为空）和value（不可为空）
nacos.core.auth.server.identity.key=example
nacos.core.auth.server.identity.value=example

nacos.core.auth.plugin.nacos.token.secret.key=VGhpc0lzQVJhbmRvbWx5R2VuZXJhdGVkU2VjdXJlS2V5MzJDaGFyYWN0ZXJzTG9uZw==