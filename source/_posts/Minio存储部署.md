---
title: Minio存储部署
author: Mr.xu
date: 2025-11-05 22:15:12
tags:
---

### minio--单节点

#### 作用

MinIO 是一个高性能的对象存储服务器，兼容 Amazon S3 API。它主要用于存储海量的非结构化数据，如图片、视频、备份文件、日志文件等。MinIO 是开源的，并且设计为云原生应用，适用于私有云、公有云和混合云环境。

1. **对象存储**：
   - MinIO 提供了对象存储服务，允许用户存储和检索任意数量的非结构化数据。
   - 数据以对象的形式存储，每个对象包含文件数据、元数据和唯一的对象标识符。

2. **兼容 S3 API**：
   - MinIO 兼容 Amazon S3 API，这意味着使用 S3 API 的应用可以无缝迁移到 MinIO。
   - 支持常用的 S3 操作，如创建桶（bucket）、上传/下载对象、设置权限等。

3. **高性能**：
   - MinIO 设计为高性能对象存储，能够在标准硬件上提供极高的吞吐量和低延迟。
   - 适用于需要快速数据访问的场景，如实时数据分析、机器学习等。

4. **可扩展性**：
   - MinIO 支持水平扩展，通过增加节点可以扩展存储容量和处理能力。
   - 支持分布式部署，适用于大规模存储需求。

5. **高可用性**：
   - MinIO 提供数据冗余和自动故障恢复，确保数据的高可用性和可靠性。
   - 支持多副本存储和纠删码（Erasure Coding）技术，防止数据丢失。

6. **安全性**：
   - MinIO 支持数据加密、访问控制和审计日志，确保数据存储和传输的安全性。
   - 支持基于角色的访问控制（RBAC）和细粒度的权限管理。

7. **多云和混合云支持**：
   - MinIO 可以在私有云、公有云和混合云环境中部署，支持跨云的数据管理。
   - 提供统一的存储接口，简化多云环境中的数据管理。

#### 资源需求

- **CPU**: 4 核 
- **内存**:  8 GB 
- **存储**: 4T
- **节点**：1

#### 网络端口

1. **默认服务端口**
   - **端口号**: 9000
   - **用途**: MinIO API 服务端口，用于客户端与 MinIO 服务器的通信。
2. **控制台端口（Console）**
   - **端口号**: 9001
   - **用途**: MinIO 控制台（管理界面）端口，用于管理和监控 MinIO。

#### 安装部署
```
# 下载docker

# 下载minio镜像
docker pull minio/minio:RELEASE.2024-05-27T19-17-46Z.fips
# 创建目录
mkdir -p /data/minio/data
#启动
docker run -d \
   --net=host \
   --user $(id -u):$(id -g) \
   --name minio \
   -e "MINIO_ROOT_USER=minioadmin" \
   -e "MINIO_ROOT_PASSWORD=minioadmin" \
   -v /data/minio/data:/data \
   minio/minio:RELEASE.2024-05-27T19-17-46Z.fips server /data --console-address ":9001" --address ":9000"    
# 访问：http://10.100.40.212:9001/login 用户名：密码  minioadmin：minioadmin