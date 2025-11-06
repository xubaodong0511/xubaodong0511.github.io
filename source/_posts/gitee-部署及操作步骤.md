---
title: gitee 部署及操作步骤
author: Mr.xu
date: 2025-11-06 20:56:13
tags:
---
**gitee 部署及操作步骤**

## 配置密钥

## 客户端

```ini
# 获取密钥
[root@git-client ~]#ssh-keygen
```

## 配置gitee密钥

```ini
# 配置gitee密钥
[root@git-client ~]#cat .ssh/id_rsa.pub
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDMKR4f2AfwFMbd7YtOHPzOHcIuMY5OjQbt5jnx8BRm8xDAdFDG5XHNW39APOrXxc5AAD6YOoAvIxxw+lLxDrvbR6KKKllZb6Y7XJn1Y7G4r8+beBkz0jQpK1haG39pJwCAcZenwRhwy0xa9Z7PzKmTPBblf9kmR7PTuT6ndxuWx8ekIqLil0eT1BbXc3sO7zRTyIJPiLsWn4VlLdgZkU6UDw4R0iMlSdpEL3f9NfxztWNjp/8vdG6tq5DXmEKcIjI0grl9KNRcRc+PdfaUXaUPjf1MS5zCmuECg0T+1dcKS1q8KQUOIYaG3vyFZ4GqZKxn2OcuWYanr4mChvtu3Esh root@git-client
# 将密钥复制粘贴到gitee上面

# 步骤
右上角头像--设置--左侧SSH公钥--复制粘贴密钥保存即可
```

## 获取gitee的ssh克隆路径

```ini
在gitee个人仓库页面--点击克隆/下载--复制里面的ssh路径
```

## 终端操作

```ini
# 创建gitee目录
[root@git-client ~]# mkdir gitee

# 进入目录
[root@git-client ~]# cd gitee

# 克隆gitee仓库
[root@git-client gitee]# git clone git@gitee.com:xbd666/qingfeng.git

# 验证是否克隆成功
[root@git-client gitee]# ll
总用量 0
drwxr-xr-x 3 root root 92 12月 25 19:54 qingfeng
```

## 终端操作上传

```ini
# 进入仓库目录
[root@git-client gitee]# cd qingfeng/
[root@git-client qingfeng]# ll
-rw-rw-rw- 1 root root 2170 11月 23 15:23 beifen.sh
[root@git-client qingfeng]# pwd
/root/gitee/qingfeng

# 保存到存储区
[root@git-client qingfeng]# git add .

# 更新
[root@git-client qingfeng]# git commit -m "beifeng1"
[master 5c2679a] beifeng1
 1 file changed, 69 insertions(+)
 create mode 100644 beifen.sh

# 上传到gitee仓库里
[root@git-client qingfeng]# git push origin master
Counting objects: 4, done.
Delta compression using up to 2 threads.
Compressing objects: 100% (3/3), done.
Writing objects: 100% (3/3), 1.10 KiB | 0 bytes/s, done.
Total 3 (delta 1), reused 0 (delta 0)
remote: Powered by GITEE.COM [GNK-6.4]
To git@gitee.com:xbd666/qingfeng.git
   8881a7f..5c2679a  master -> master
```

