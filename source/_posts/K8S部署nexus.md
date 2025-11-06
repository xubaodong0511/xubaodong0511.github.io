---
title: K8S部署nexus
author: Mr.xu
date: 2025-11-06 20:42:04
tags:
---

## 环境准备

```perl
服务器	  IP地址
master	192.168.0.173
node1	192.168.0.253
node2	192.168.0.233
```

## 安装nfs

### 安装nfs

```perl
# master节点
yum -y install  nfs-utils rpcbind

# 创建共享目录
mkdir /var/nfs/nexus
# 授予权限
chmod 777 /var/nfs/nexus

# 启动nfs服务
systemctl start nfs-server
systemctl enabled nfs-server
systemctl start rpcbind
systemctl enabled rpcbind

# node节点
yum -y install  nfs-utils rpcbind

systemctl start nfs-server
systemctl enabled nfs-server
systemctl start rpcbind
systemctl enabled rpcbind
```

### 挂载NFS

```perl
# 配置共享目录以及权限(服务端master)
[root@master nexus]# cat /etc/exports
/var/nfs/nexus        *(rw,no_root_squash,sync) 或 /var/nfs/nexus  172.20.10.0/24(rw,no_root_squash,sync)
 共享的目录	       共享的地址（共享的权限、选项）
systemctl restart nfs-server
# 客户端连接(客户端node节点)
mkdir  /test 	    # 接收文件的目录
mount -t nfs 192.168.0.173:/var/nfs/nexus  /mnt/nfs 	 # 挂载

umount /test 		# 卸载，前提先要CD到家目录下
# 开机挂载
vim /etc/fstab
nfs:/data      /data           nfs     defaults        0 0
```

### 创建名称空间

```perl
# 创建namespace
kubectl create ns nexus
```

### 创建nfs客户端撒授权

```perl
[root@master nexus]# cat nexus-nfs-client-sa.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: nfs-client
  namespace: nexus
---
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: nfs-client-runner
  namespace: nexus
rules:
  - apiGroups: [""]
    resources: ["persistentvolumes"]
    verbs: ["get","list","watch","create","delete"]
  - apiGroups: [""]
    resources: ["persistentvolumeclaims"]
    verbs: ["get","list","watch","create","delete"]
  - apiGroups: ["storage.k8s.io"]
    resources: ["storageclasses"]
    verbs: ["get","list","watch"]
  - apiGroups: [""]
    resources: ["events"]
    verbs: ["get","list","watch","create","update","patch"]
  - apiGroups: [""]
    resources: ["endpoints"]
    verbs: ["create","delete","get","list","watch","patch","update"]
 
---
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: run-nfs-provisioner
  namespace: nexus
subjects:
  - kind: ServiceAccount
    name: nfs-client
    namespace: nexus
roleRef:
  kind: ClusterRole
  name: nfs-client-runner
  apiGroup: rbac.authorization.k8s.io
  
# 创建
[root@master nexus]# kubectl apply -f nexus-nfs-client-sa.yaml
```

### 检查服务是否成功

```perl
kubectl get ServiceAccount -n nexus -o wide
 
kubectl get ClusterRole -n nexus -o wide
 
kubectl get ClusterRoleBinding -n nexus -o wide
```

### 创建nfs 客户端

```perl
[root@master nexus]# cat nexus-nfs-client.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nfs-client
  labels:
    app: nfs-client
  namespace: nexus
spec:
  replicas: 1
  strategy:
    type: Recreate
  selector:
    matchLabels:
      app: nfs-client
  template:
    metadata:
      labels:
        app: nfs-client
    spec:
      serviceAccountName: nfs-client
      containers:
        - name: nfs-client
          image: d3fk/nfs-client
          volumeMounts:
            - name: nfs-client-root
              mountPath: /persistentvolumes
          env:
            - name: PROVISIONER_NAME		## 这个名字必须与storegeclass里面的名字一致
              value:  my-nexus-nfs
            - name: ENABLE_LEADER_ELECTION		## 设置高可用允许选举，如果replicas参数等于1，可不用
              value: "True"
            - name: NFS_SERVER
              value: 192.168.0.173		#修改为自己的ip（部署nfs的机器ip）
            - name: NFS_PATH
              value: /var/nfs/nexus		#修改为自己的nfs安装目录
      volumes:
        - name: nfs-client-root
          nfs:
            server: 192.168.0.173		#修改为自己的ip（部署nfs的机器ip）
            path: /var/nfs/nexus		#修改为自己的nfs安装目录

# 创建
[root@master nexus]# kubectl apply -f nexus-nfs-client.yaml
```

### 创建storeclass

```perl
[root@master nexus]# cat nexus-store-class.yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: nexus-nfs-storage
  namespace: nexus
provisioner: my-nexus-nfs

# 创建
[root@master nexus]# kubectl apply -f nexus-store-class.yaml
```

### 检查nfs客户端和storeclass创建是否成功

```perl
kubectl get StorageClass -n nexus -o wide
 
kubectl get pod -n nexus -o wide
```

## 安装nexus

### 创建pv

```perl
[root@master nexus]#  cat nexus-pv.yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nexus-pv
spec:
  capacity:
    storage: 2Gi    #配置容量大小
  accessModes:
    - ReadWriteOnce     #配置访问策略为只允许一个节点读写
  persistentVolumeReclaimPolicy: Retain  #配置回收策略，Retain为手动回收
  storageClassName: nexus       #配置为nfs
  nfs:
    path: /var/nfs/nexus   #配置nfs服务端的共享路径
    server: 192.168.0.173    #配置nfs服务器地址

# 创建
[root@master nexus]#  kubectl apply -f nexus-pv.yaml
```

### 创建pvc

```perl
[root@master nexus]#  cat nexus-pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: nexus-data-pvc
  namespace: nexus
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 2Gi
  storageClassName: nexus
  
# 创建
[root@master nexus]#  kubectl apply -f nexus-pvc.yaml
```

### 创建service

```perl
[root@master nexus]# cat nexus-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: nexus
  namespace: nexus
  labels:
    app: nexus
spec:
  selector:
    app: nexus
  type: NodePort
  ports:
    - name: web
      protocol: TCP
      port: 8081
      targetPort: 8081
      nodePort: 30001			# 对外暴露的端口
      
# 创建
[root@master nexus]#  kubectl apply -f nexus-service.yaml
```

### 创建deployment

```perl
[root@master nexus]# cat nexus-deploy.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: nexus
  name: nexus
  namespace: nexus
spec:
  replicas: 1
  progressDeadlineSeconds: 600
  minReadySeconds: 30
  strategy:
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
    type: RollingUpdate
  selector:
    matchLabels:
      app: nexus
  template:
    metadata:
      labels:
        app: nexus
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
      containers:
      - name: nexus
        image: sonatype/nexus3:3.28.0
        imagePullPolicy: IfNotPresent
        ports:
          - containerPort: 8081
            name: web
            protocol: TCP
        livenessProbe:
          httpGet:
            path: /
            port: 8081
          initialDelaySeconds: 70
          periodSeconds: 30
          failureThreshold: 6
        readinessProbe:
          httpGet:
            path: /
            port: 8081
          initialDelaySeconds: 60
          periodSeconds: 30
          failureThreshold: 6
        resources:
          limits:
            cpu: 1000m
            memory: 2Gi
          requests:
            cpu: 500m
            memory: 512Mi
        volumeMounts:
        - name: nexus-data
          mountPath: /nexus-data
      volumes:
        - name: nexus-data
          persistentVolumeClaim:
            claimName: nexus-data-pvc
            
 # 创建
[root@master nexus]#  kubectl apply -f nexus-deploy.yaml
```

### 查询服务是否正常

```perl
kubectl get all -n nexus

kubectl get po -n nexus -o wide
kubectl get pv,pvc -n nexus -o wide
kubectl get svc -n nexus -o wide
```

### 访问

```perl
通过service的nodeport端口访问nexus服务

http://IP + 端口30001		# 端口是service文件里定义的（ nodePort: 30001	）
```

### 服务启动正常后获取nexus初始的登录密码

```perl
[root@master nexus]# kubectl exec -it nexus-6b47d98b5c-tjchb -n nexus cat /nexus-data/admin.password
kubectl exec [POD] [COMMAND] is DEPRECATED and will be removed in a future version. Use kubectl exec [POD] -- [COMMAND] instead.
f7f0f006-423c-4b2e-9256-032adc74ceeb[root@master nexus]# 
或

[root@master nexus]# kubectl exec -it nexus-6b47d98b5c-tjchb -n nexus bash
kubectl exec [POD] [COMMAND] is DEPRECATED and will be removed in a future version. Use kubectl exec [POD] -- [COMMAND] instead.
bash-4.4$ cat /nexus-data/admin.password 
f7f0f006-423c-4b2e-9256-032adc74ceebbash-4.4$

# 默认用户admin 密码使用上面获取的初始密码即可(密码：Zijian@123)
```

