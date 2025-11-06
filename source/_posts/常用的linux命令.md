---
title: 常用的linux命令
author: Mr.xu
date: 2025-11-06 20:52:53
tags:
---

## 清理linux系统中的缓存(生产环境慎用!)
```
echo 3 > /proc/sys/vm/drop_caches
```
`drop_caches 文件允许三个不同的值： 1: 只清空页面缓存。 2: 只清空目录项和inode。 3: 清空页面缓存、目录项和inode。`

## 比较文件内容差异
```
diff a.txt b.txt     #正常比较
diff -c a.txt b.txt    #以上下文方式比较
diff -u a.txt b.txt    #联合方式比较
```

## 查看操作系统版本信息
```
cat /etc/redhat-release
```

## 统计出现相同行的次数
```
uniq -c
```

## 标准错误重定向到标准输出的位置
`2 是标准错误的文件描述符，1 是标准输出的文件描述符。而 >& 表示将一个文件描述符重定向到另一个文件描述符，1 表示标准输出。因此，2>&1 就表示将标准错误重定向到标准输出的位置`

## 要在Linux系统中添加一个HTTP代理，可以按照以下步骤进行操作：
```
#代理
先在Clash上开启Allow LAN,并设置代理端口8888
# 在终端上输入，代表代理
export http_proxy=http://10.31.162.98:8888
# -x将IP地址+端口添加在前面就可以在github链接上下载了
curl -x http://10.31.162.98:8888 -L https://github.com/docker/compose/releases/download/1.22.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
#取消代理
unset http_proxy 
#重启
取消代理后如果不能ping就重启下，reboot
```