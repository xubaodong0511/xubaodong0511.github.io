---
title: docker 下载及配置镜像加速器
author: Mr.xu
date: 2025-11-06 21:03:09
tags:
---

**docker下载安装**
**卸载旧版本**
```
yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-engine
```
**需要的安装包**
```
sudo yum install -y yum-utils
```
**设置镜像仓库**
```
# 1）官方镜像源
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
# 2）阿里云镜像源
sudo yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```
**更新yum软件包索引**
```
yum makecache fast
```
**下载依赖包**
```
yum -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```
**启动docker**
```
systemctl start docker
```
**查看版本号**
```
docker version
```
**测试hello-world**
```
docker run hello-world
```
**查看下载的hello-world镜像在不在**
```
[root@iZbp1guc0wov85gocdqeaiZ ~]# docker images
REPOSITORY    TAG       IMAGE ID       CREATED        SIZE
hello-world   latest    9c7a54a9a43c   6 months ago   13.3kB
```
**卸载docker(共3步)**
```
yum remove docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin docker-ce-rootless-extras   //卸载依赖包
rm -rf /var/lib/docker	//docker默认工作路径
rm -rf /var/lib/containerd
```

**配置镜像加速器**

```shell
# 登入aliyun，找到容器镜像加速器
# 您可以通过修改daemon配置文件/etc/docker/daemon.json来使用加速器
mkdir -p /etc/docker
tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://8zc4xpn2.mirror.aliyuncs.com"]
}
EOF
```
**重启docker服务**
```
systemctl daemon-reload		//重启镜像
systemctl restart docker	//重启docker
```
