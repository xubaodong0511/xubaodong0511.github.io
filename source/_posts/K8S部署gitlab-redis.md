---
title: K8S部署gitlab-redis
author: Mr.xu
date: 2025-11-06 20:42:47
tags:
---

# 文章目录

一、概述
二、持久化存储安装--ebs
三、创建命名空间
四、创建文件夹，及账号密码
五、Postgresql部署
六、Redis部署
七、GitLab部署
八、命令总结
九、访问GitLab

# 一、概述

在[k8s](https://so.csdn.net/so/search?q=k8s&spm=1001.2101.3001.7020)中部署gitlab，然后使用gitlab来实现代码打包到打镜像再到使用镜像自动生成容器服务的过程
用到了reids、postgresql、[gitlab](https://so.csdn.net/so/search?q=gitlab&spm=1001.2101.3001.7020)，将三个应用配置好之后启动即可安装gitlab

# 二、持久化存储安装--ebs

安装持久化存储工具，可以使用nfs或ebs

以ebs为例（使用起来好像简单些）

## 1. 安装ebs

```perl
kubectl apply -f https://openebs.github.io/charts/openebs-operator.yaml
```

## 2. 查看ebs集群服务

查看集群的StorageClass

```perl
kubectl get sc
```

## 3. 设置ebs为默认

设置openobs-hostpath为default

```perl
kubectl patch storageclass openebs-hostpath -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
```

## 4. 使用ebs

在配置持久化时可根据安装的持久化工具将storageClassName参数的值填充:
先查看sc的名称

```perl
kubectl get sc
```

# 三、创建命名空间

在部署之前先创建一个namespace用于分类管理服务
创建一个名为gitlab-dev的命名空间

```perl
kubectl create namespace gitlab-dev
```

# 四、创建文件夹，及账号密码

分别创建gitlab目录，存储账号和密码的文件

## 账号文件username，用于存储账号信息

```perl
mkdir /opt/k8s/gitlab-yaml
echo -n "gitlab-admin" > ./username
```

## 密码文件password，用于存储密码信息

```perl
echo -n "gitlab.123" > ./password
```

## 查看文件/文件内容

```perl
ls
cat ./username
cat ./password
```

## secret对象生成

```perl
kubectl create secret generic git-user-pass --from-file=./username --from-file=./password -n gitlab-dev

```

## 查看secret

```perl
kubectl -n gitlab-dev get secret git-user-pass -o yaml
```

## **拓展：**如果创建错误或者想重新创建secret，则需先删除

```perl
kubectl delete secret git-user-pass -n gitlab-dev
```

# 五、Postgresql部署

为了方便管理以及后续修改更新文件，本篇对每个结构部分都创建一个yaml文件，且创建的文件都放在当前目录下的gitlab-yaml文件夹下，后续redis和gitlab的部分与此相同

参数：
pgs：Postgresql
dplm：Deployment
pvc：PersistentVolumeClaim
svc：Service

## 1.持久化配置创建--pvc

### 创建文件pgs-pvc.yaml

```perl
vim ./gitlab-yaml/pgs-pvc.yaml
```

### 将以下内容复制粘贴到文件中

注：其中name可自定义，namespace前面创建了gitlab-dev

```perl
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pgs-pvc
  namespace: gitlab-dev
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: openebs-hostpath
  resources:
    requests:
      storage: 1Gi
```

### 部署命令

```perl
kubectl apply -f ./gitlab-yaml/pgs-pvc.yaml
```

### 查看创建的服务

```perl
kubectl get pvc -n gitlab-dev pgs-pvc
```

## 2. 部署配置--deployment

### 创建文件pgs-dplm.yaml

```
vim ./gitlab-yaml/pgs-dplm.yaml
```

### 将以下内容复制粘贴到文件中

注：nodeSelector的key的值就是namespace，最后的claimName的值是持久化配置文件的名称pgs-pvc

```perl
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgresql
  namespace: gitlab-dev
  labels:
    name: postgresql
spec:
  replicas: 1
  selector:
    matchLabels:
      name: postgresql
  template:
    metadata:
      name: postgresql
      labels:
        name: postgresql
    spec:
#     tolerations:             # 添加的容忍污点，到下面300结束
#        - key: "node.kubernetes.io/unreachable"
#          operator: "Exists"
#          effect: "NoExecute"
#          tolerationSeconds: 300
#        - key: "node.kubernetes.io/unreachable"
#          operator: "Exists"
#          effect: "NoExecute" # 此处修改为 'NoExecute'
#          tolerationSeconds: 300
      #nodeSelector:
        #key: gitlab-dev
      containers:
        - name: postgresql
          image: sameersbn/postgresql
          imagePullPolicy: IfNotPresent
          env:
            - name: DB_USER
              value: gitlab
            - name: DB_PASS
              value: passw0rd
            - name: DB_NAME
              value: gitlab_production
            - name: DB_EXTENSION
              value: pg_trgm
          ports:
            - name: postgres
              containerPort: 5432
          volumeMounts:
            - mountPath: /var/lib/postgresql
              name: data
          livenessProbe:
            exec:
              command:
                - pg_isready
                - -h
                - localhost
                - -U
                - postgres
            initialDelaySeconds: 30
            timeoutSeconds: 5
          readinessProbe:
            exec:
              command:
                - pg_isready
                - -h
                - localhost
                - -U
                - postgres
            initialDelaySeconds: 5
            timeoutSeconds: 1
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: pgs-pvc
```

### 部署命令

```perl
kubectl apply -f ./gitlab-yaml/pgs-dplm.yaml
```

### 查看已创建的服务

```perl
kubectl get pod -n gitlab-dev

[root@master gitlab-yaml]# kubectl get pod -n gitlab-dev
NAME                         READY   STATUS    RESTARTS      AGE
postgresql-bddc8596d-qxpgz   1/1     Running   2 (22m ago)   3h33m
```

## 3. 服务配置--svc

### 创建文件pgs-svc.yaml

```perl
vim ./gitlab-yaml/pgs-svc.yaml
```

### 将以下内容复制粘贴到文件中

```perl
apiVersion: v1
kind: Service
metadata:
  name: postgresql
  namespace: gitlab-dev
  labels:
    name: postgresql
spec:
  ports:
    - name: postgres
      port: 5432
      targetPort: postgres
  selector:
    name: postgresql
```

### 查看已部署的服务

```perl
kubectl get svc -n gitlab-dev

[root@master gitlab-yaml]# kubectl get svc -n gitlab-dev
NAME         TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                     AGE
postgresql   ClusterIP   10.104.67.253    <none>        5432/TCP                    3h31m

```

# 六、Redis部署

数据缓存redis

## 1. 持久化配置--pvc

### 创建文件redis-pvc.yaml

```perl
vim ./gitlab-yaml/redis-pvc.yaml
```

### 将以下内容复制粘贴到文件中

```perl
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redis-pvc
  namespace: gitlab-dev
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: openebs-hostpath
  resources:
    requests:
      storage: 1Gi
```

### 部署服务

```perl
kubectl apply -f ./gitlab-yaml/redis-pvc.yaml
```

### 查看已部署的服务

```perl
kubectl get pvc -n gitlab-dev redis-pvc
```

## 2. 部署配置--deployment

### 创建redis-dplm.yaml文件

```perl
vim ./gitlab-yaml/redis-dplm.yaml
```

### 将以下内容复制粘贴到文件中

```perl
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: gitlab-dev
  labels:
    name: redis
spec:
  replicas: 2
  selector:
    matchLabels:
      name: redis
  template:
    metadata:
      name: redis
      labels:
        name: redis
    spec:
#     tolerations:             # 添加的容忍污点，到下面300结束
#        - key: "node.kubernetes.io/unreachable"
#          operator: "Exists"
#          effect: "NoExecute"
#          tolerationSeconds: 300
#        - key: "node.kubernetes.io/unreachable"
#          operator: "Exists"
#          effect: "NoExecute" # 此处修改为 'NoExecute'
#          tolerationSeconds: 300
      #nodeSelector:
        #key: gitlab-dev
      containers:
        - name: redis
          image: sameersbn/redis
          imagePullPolicy: IfNotPresent
          ports:
            - name: redis
              containerPort: 6379
          volumeMounts:
            - mountPath: /var/lib/redis
              name: data
          livenessProbe:
            exec:
              command:
                - redis-cli
                - ping
            initialDelaySeconds: 30
            timeoutSeconds: 5
          readinessProbe:
            exec:
              command:
                - redis-cli
                - ping
            initialDelaySeconds: 5
            timeoutSeconds: 1
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: redis-pvc
```

### 部署服务

```perl
kubectl apply -f ./gitlab-yaml/redis-dplm.yaml
```

### 查看已部署的服务

因为文件中配置的副本数为2，故生成了两个redis的pod

```perl
kubectl get pod -n gitlab-dev

[root@master gitlab-yaml]# kubectl get pod -n gitlab-dev
NAME                         READY   STATUS    RESTARTS      AGE
gitlab-955db8d9f-vp8zk       1/1     Running   1 (21m ago)   32m
postgresql-bddc8596d-qxpgz   1/1     Running   2 (22m ago)   3h33m
redis-56d5499794-clpkv       1/1     Running   1 (35m ago)   3h26m
redis-56d5499794-gr977       1/1     Running   1 (35m ago)   3h26m
```

## 3. 服务配置--svc

### 创建文件redis-svc.yaml

```perl
vim ./gitlab-yaml/redis-svc.yaml
```

### 将一下内容复制粘贴进文件中

```perl
apiVersion: v1
kind: Service
metadata:
  name: redis-svc
  namespace: gitlab-dev
  labels:
    name: redis-svc
spec:
  ports:
    - name: redis
      port: 6379
      targetPort: redis
  selector:
    name: redis
```

### 部署服务

```perl
kubectl get svc -n gitlab-dev redis-svc

[root@master gitlab-yaml]# kubectl get svc -n gitlab-dev redis-svc
NAME        TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
redis-svc   ClusterIP   10.104.35.113   <none>        6379/TCP   3h33m
```

# 七、GitLab部署

##  持久化配置--pvc

### 创建文件gitlab-pvc.yaml

```perl
vim ./gitlab-yaml/gitlab-pvc.yaml
```

### 将以下内容复制粘贴到文件中

```perl
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: gitlab-pvc
  namespace: gitlab-dev
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: openebs-hostpath
  resources:
    requests:
      storage: 5Gi
```

### 部署服务

```perl
kubectl apply -f ./gitlab-yaml/gitlab-pvc.yaml
```

## 2. 部署配置--deployment

gitlab-ce-15.6.0-ce.0     gitlab-ce-14.0.0-ce.0

本篇以gitlab-ce-15.6.0-ce.0为例

### 创建文件gitlab-dplm.yaml

```perl
vim ./gitlab-yaml/gitlab-dplm.yaml
```

### 将一下内容复制粘贴到文件中

`GITLAB_ROOT_PASSWORD` 密码部分，可以直接将值设为密码，这里从第二章中设置的密码文件中读取
`GITLAB_ROOT_EMAIL` 邮箱部分，自定义即可
`GITLAB_HOST` 主机地址，可自定义

```perl
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gitlab
  namespace: gitlab-dev
  labels:
    name: gitlab
spec:
  replicas: 1
  selector:
    matchLabels:
      name: gitlab
  template:
    metadata:
      name: gitlab
      labels:
        name: gitlab
    spec:
#     tolerations:             # 添加的容忍污点，到下面300结束
#        - key: "node.kubernetes.io/unreachable"
#          operator: "Exists"
#          effect: "NoExecute"
#          tolerationSeconds: 300
#        - key: "node.kubernetes.io/unreachable"
#          operator: "Exists"
#          effect: "NoExecute" # 此处修改为 'NoExecute'
#          tolerationSeconds: 300
      #nodeSelector:
        #key: gitlab-dev
      containers:
        - name: gitlab
          # image: sameersbn/gitlab:12.1.6
          image: gitlab/gitlab-ce:15.6.0-ce.0
          # command: ["/bin/bash","-ce","tail -f /dev/null"]
          imagePullPolicy: IfNotPresent
          env:
            - name: TZ
              value: Asia/Shanghai
            - name: GITLAB_TIMEZONE
              value: Beijing
            - name: GITLAB_SECRETS_DB_KEY_BASE
              value: long-and-random-alpha-numeric-string
            - name: GITLAB_SECRETS_SECRET_KEY_BASE
              value: long-and-random-alpha-numeric-string
            - name: GITLAB_SECRETS_OTP_KEY_BASE
              value: long-and-random-alpha-numeric-string
            - name: GITLAB_ROOT_PASSWORD
              #value: admin321
              valueFrom:
                secretKeyRef:
                  name: git-user-pass
                  key: password
            - name: GITLAB_ROOT_EMAIL
              value: hslb@163.com
            - name: GITLAB_HOST
              value: gitlab.hslb.com
            - name: GITLAB_PORT
              value: "30021"
            - name: GITLAB_SSH_PORT
              value: "30022"
            - name: GITLAB_NOTIFY_ON_BROKEN_BUILDS
              value: "true"
            - name: GITLAB_NOTIFY_PUSHER
              value: "false"
            - name: GITLAB_BACKUP_SCHEDULE
              value: daily
            - name: GITLAB_BACKUP_TIME
              value: 01:00
            - name: DB_TYPE
              value: postgres
            - name: DB_HOST
              value: postgresql
            - name: DB_PORT
              value: "5432"
            - name: DB_USER
              value: gitlab
            - name: DB_PASS
              value: passw0rd
            - name: DB_NAME
              value: gitlab_production
            - name: REDIS_HOST
              value: redis
            - name: REDIS_PORT
              value: "6379"
          ports:
            - name: http
              containerPort: 80
            - name: ssh
              containerPort: 22
          volumeMounts:
            - mountPath: /home/git/data
              name: data
          livenessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 180
            timeoutSeconds: 5
          readinessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 180
            timeoutSeconds: 5
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: gitlab-pvc
```

### 部署服务

```perl
kubectl apply -f ./gitlab-yaml/gitlab-dplm.yaml
```

### 查看已部署的服务

```perl
kubectl get pod -n gitlab-dev -o wide

[root@master gitlab-yaml]# kubectl get pod -n gitlab-dev -o wide
NAME                         READY   STATUS    RESTARTS      AGE     IP            NODE     NOMINATED NODE   READINESS GATES
gitlab-955db8d9f-vp8zk       1/1     Running   1 (36m ago)   47m     10.244.1.27   node01   <none>           <none>
postgresql-bddc8596d-qxpgz   1/1     Running   2 (36m ago)   3h47m   10.244.1.23   node01   <none>           <none>
redis-56d5499794-clpkv       1/1     Running   1 (50m ago)   3h40m   10.244.2.13   node02   <none>           <none>
redis-56d5499794-gr977       1/1     Running   1 (50m ago)   3h40m   10.244.2.11   node02   <none>           <none>
```

注：如果k8s部署gitlab服务时出现pod状态为`Running`，Ready状态一直为`0/1`，重启一定次数后pod状态变为`CrashLoopBackOff`

查看pod详细信息时看到的message为 Readiness probe failed: Get "http://10.244.0.8:80/": dial tcp 10.244.0.8:80: connect: connection refused

### 解决方案：

```per
删除原有gitlab对应的pod
kubectl delete deployment gitlab -n gitlab-dev
修改yaml文件镜像参数使用别的版本镜像
vim ./gitlab-yaml/gitlab-dplm.yaml

将镜像版本改为gitlab/gitlab-ce:14.0.0-ce.0
或者gitlab/gitlab-ce:15.6.0-ce.0
重新应用yaml
kubectl apply -f ./gitlab-yaml/gitlab-dplm.yaml
```

## 3. 服务配置

### 创建文件gitlab-svc.yaml

```perl
vim ./gitlab-yaml/gitlab-svc.yaml
```

### 将以下内容复制粘贴到文件中

```perl
apiVersion: v1
kind: Service
metadata:
  name: gitlab
  namespace: gitlab-dev
  labels:
    name: gitlab
spec:
  ports:
    - name: http
      port: 80
      targetPort: http
      nodePort: 30021
    - name: ssh
      port: 22
      targetPort: ssh
      nodePort: 30022
  selector:
    name: gitlab
  type: NodePort
```

### 部署服务

```perl
kubectl apply -f ./gitlab-yaml/gitlab-svc.yaml
```

### 查看已部署的服务

```perl
kubectl get svc -n gitlab-dev
```

`以上就是redis、postgresql、gitlab三个部分的部署`

# 八、命令总结

如果出现问题需要删除创建的服务，可参考以下命令

## 1.部署pvc

```perl
kubectl apply -f ./gitlab-yaml/pgs-pvc.yaml
kubectl apply -f ./gitlab-yaml/redis-pvc.yaml
kubectl apply -f ./gitlab-yaml/gitlab-pvc.yaml
```

## 2. 查看pvc

```perl
kubectl get pvc -n gitlab-dev
```

## 3. 删除指定pvc

```perl
kubectl delete pvc pgs-pvc -n gitlab-dev
```

## 4. 部署pod

```perl
kubectl apply -f ./gitlab-yaml/pgs-dplm.yaml
kubectl apply -f ./gitlab-yaml/redis-dplm.yaml
kubectl apply -f ./gitlab-yaml/gitlab-dplm.yaml
```

## 5. 查看pod

```perl
kubectl get pod -n gitlab-dev
```

## 6. 删除pod

```perl
# 删除无副本设置的pod
kubectl delete pod postgresql -n gitlab-dev

# 删除设置副本的pod
kubectl delete deployment postgresql -n gitlab-dev
```

## 7. 部署svc

```perl
kubectl apply -f ./gitlab-yaml/pgs-svc.yaml
kubectl apply -f ./gitlab-yaml/redis-svc.yaml
kubectl apply -f ./gitlab-yaml/gitlab-svc.yaml
```

## 8. 查看svc

```perl
kubectl get svc -n gitlab-dev
```

## 9. 删除指定svc

```perl
kubectl delete svc postgresql -n gitlab-dev
```

# 九、访问GitLab

## 1. 访问地址

首先根据自己的服务查看服务所在节点
然后使用 节点ip+端口 即可访问

### 查看gitlab的pod部署在哪个节点

```
kubectl get pod -n gitlab-dev -o wide
```

### 节点在node01

```perl
[root@master gitlab-yaml]# kubectl get pod -n gitlab-dev -o wide
NAME                         READY   STATUS    RESTARTS      AGE     IP            NODE     NOMINATED NODE   READINESS GATES
gitlab-955db8d9f-vp8zk       1/1     Running   2 (51s ago)   65m     10.244.1.27   node01   <none>           <none>
postgresql-bddc8596d-qxpgz   1/1     Running   2 (55m ago)   4h6m    10.244.1.23   node01   <none>           <none>
redis-56d5499794-clpkv       1/1     Running   1 (68m ago)   3h59m   10.244.2.13   node02   <none>           <none>
redis-56d5499794-gr977       1/1     Running   1 (68m ago)   3h59m   10.244.2.11   node02   <none>           <none>
```

### 查看gitlab服务映射的端口

```
kubectl get svc -n gitlab-dev -o wide
```

### 映射的端口为30021

```perl
[root@master gitlab-yaml]# kubectl get svc -n gitlab-dev -o wide
NAME         TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                     AGE     SELECTOR
gitlab       NodePort    10.110.192.219   <none>        80:30021/TCP,22:30022/TCP   3h25m   name=gitlab
postgresql   ClusterIP   10.104.67.253    <none>        5432/TCP                    4h2m    name=postgresql
redis-svc    ClusterIP   10.104.35.113    <none>        6379/TCP                    3h56m   name=redis
```

## 2. 访问gitlab

`访问网址gitlab服务所在节点ip:30021`

```perl
注意，账号为root
密码为之前设置的gitlab.123
这里有个地方有点无语，我之前设置的账号为gitlab-admin
使用这个账号登录不进去，必须换成root
```

