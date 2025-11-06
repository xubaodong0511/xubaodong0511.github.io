---
title: K8S部署zentao
author: Mr.xu
date: 2025-11-06 20:41:30
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
mkdir -p /data/zentao

# 启动nfs服务
systemctl restart nfs-server
systemctl enabled nfs-server
systemctl restart rpcbind
systemctl enabled rpcbind

# node节点
yum -y install  nfs-utils rpcbind

systemctl restart nfs-server
systemctl enabled nfs-server
systemctl restart rpcbind
systemctl enabled rpcbind
```

### 挂载NFS

```perl
# 配置共享目录以及权限(服务端master)
[root@master nexus]# cat /etc/exports
/var/nfs/nexus        *(rw,no_root_squash,sync)
/var/nfs/nexus		  *(rw,no_root_squash,sync)
# 重新启动
systemctl restart nfs-server

# 验证
[root@master zentao]# showmount -e 192.168.0.173
Export list for 192.168.0.173:
/data/zentao   *
/var/nfs/nexus *

# 客户端连接(客户端node节点)
mkdir  /test 	    # 接收文件的目录
mount -t nfs 192.168.0.173:/var/nfs/nexus  /test 	 # 挂载

umount /test 		# 卸载，前提先要CD到家目录下
# 开机挂载
vim /etc/fstab
nfs:/data      /data           nfs     defaults        0 0
```

### 创建名称空间

```perl
# 创建namespace
kubectl create ns work			# 可以自定义名称空间为为zentao
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

## 部署禅道

### 创建 pv 和 pvc

```perl
[root@master zentao]# cat zentao-pv-pvc.yaml 
apiVersion: v1
kind: PersistentVolume
metadata:
  name: zentao-pv
  namespace: work
  labels:
    pv: zentao-pv
spec:
  capacity:
    storage: 3Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Recycle
  storageClassName: zentao-nfs
  nfs:
    path: /data/zentao
    server: 192.168.0.173

---
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: zentao-pvc
  namespace: work
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 3Gi
  storageClassName: zentao-nfs
  selector:
    matchLabels:
      pv: zentao-pv

# 创建
[root@master zentao]# kubectl apply -f zentao-pv-pvc.yaml
```

### 创建deployment

```perl
[root@master zentao]# cat zentao-deployment.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zentao
  namespace: work
  labels:
    app: zentao
spec:
  selector:
    matchLabels:
      app: zentao
  replicas: 1
  template:
    metadata:
      labels:
        app: zentao
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
      - name: zentao
        image: easysoft/zentao
        env:
        - name: ADMINER_USER
          value: 'root'
        - name: ADMINER_PASSWD
          value: 'Qingfeng@123'
        - name: BIND_ADDRESS
          value: 'true'
        - name: SMTP_HOST
          value: '192.168.0.211'
        ports:
        - name: zentao
          containerPort: 80
        - name: mysql
          containerPort: 3306
        volumeMounts:
        - name: zentao
          mountPath: /opt/zentao
      volumes:
        - name: zentao
          persistentVolumeClaim:
            claimName: zentao-pvc

# 创建
[root@master zentao]# kubectl apply -f zentao-deployment.yaml
```

### 创建service

```perl
[root@master zentao]# cat zentao-svc.yaml 
apiVersion: v1
kind: Service
metadata:
  labels:
    app: zentao
  name: zentao
  namespace: work
spec:
  ports:
  - name: zentao
    port: 80
    protocol: TCP
    targetPort: 80
    nodePort: 30061
  - name: mysql
    port: 3306
    protocol: TCP
    targetPort: 3306
    nodePort: 30056
  selector:
    app: zentao
  type: NodePort
  
  
# 创建
[root@master zentao]# kubectl apply -f zentao-svc.yaml 
```

### 查看创建的zentao服务是否正常运行

```perl
kubectl get all -n work -o wide
kubeclt get pv,pvc -n work
kubectl get svc -n work
kubectl get po -n work -o wide
kubectl get po zentao-55bcc7c689-g45wr -n work -o wide
kubectl describe po zentao-55bcc7c689-g45wr -n work -o wide
kubectl logs zentao-55bcc7c689-g45wr -n work
```

## 访问

```perl
# 在哪个节点上就用哪个节点的IP地址，
浏览器访问：IP + 端口30061		# 30061端口是在svc文件里自定义的

# 注：web上输入MySQL密码时，密码为123456
```

