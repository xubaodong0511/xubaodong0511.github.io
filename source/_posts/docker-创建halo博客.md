---
title: docker 创建halo博客实验
author: Mr.xu
date: 2025-11-06 21:17:32
tags:
---

**docker博客创建**

**编辑配置文件**
```shell
vim /halo/docker-compose.yaml
version: "3"

services:
  halo
    image: halohub/halo:2.11
    container_name: halo
    restart: on-failure:3
    depends_on:
      halodb:
        condition: service_healthy
    networks:
      halo_network:
    volumes:

   - ./halo2:/root/.halo2
     rts:
        - "8090:8090"
          althcheck:
                test: ["CMD", "curl", "-f", "http://localhost:8090/actuator/health/readiness"]
                interval: 30s
                timeout: 5s
                retries: 5
                start_period: 30s          
              command:
             - --spring.r2dbc.url=r2dbc:pool:postgresql://halodb/halo
               --spring.r2dbc.username=halo

      # PostgreSQL 的密码，请保证与下方 POSTGRES_PASSWORD 的变量值一致。

   - --spring.r2dbc.password=openpostgresql
     --spring.sql.init.platform=postgresql

      # 外部访问地址，请根据实际需要修改

   - --halo.external-url=http://localhost:8090/
     halodb:
         image: postgres:15.4
         container_name: halodb
         restart: on-failure:3
         networks:
           halo_network:
         volumes:
        - ./db:/var/lib/postgresql/data
          rts:
             - "5432:5432"
               althcheck:
                     test: [ "CMD", "pg_isready" ]
                     interval: 10s
                     timeout: 5s
                     retries: 5
                   environment:
                  - POSTGRES_PASSWORD=openpostgresql
                    POSTGRES_USER=halo
                       - POSTGRES_DB=halo
                         PGUSER=halo

networks:
  halo_network:
```

**创建目录**
```
mkdir -pv /halo
```

**重新指定文件目录**
```
mv docker-compose.yaml /halo
cd /halo
```

**运行以下命令卸载所有冲突的包**
```
for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do sudo apt-get remove $pkg; done
```

**设置 Docker 的apt存储库**
```
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
```

**运行安装脚本**
```shell
bash <(curl -sSL https://linuxmirrors.cn/docker.sh)    //脚本运行
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin    //新版docker版本脚本
```

**安装**
```shell
apt-get install -y docker-compose
```

**验证版本号**
```
docker-compose --version
docker --version
```

**安装运行**
```shel
docker-compose up -d
systemctl status docker
```

**测试**
`输入IP地址+端口8090`进入注册页面