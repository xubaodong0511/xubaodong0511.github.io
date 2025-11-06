---
title: K8S部署nacos服务
author: Mr.xu
date: 2025-11-06 20:42:36
tags:
---

# K8S部署nacos服务

## prod环境

### prod数据库使用的端口3306的数据库

```perl
[root@master ~]# mkdir nacos && cd nacos
[root@master nacos]# vim nacos-service.yaml
---
apiVersion: v1
kind: Service
metadata:
  name: nacos-prod
  labels:
    app: nacos-prod
spec:
  type: NodePort
  ports:
    - port: 8848
      name: server
      targetPort: 8848
      nodePort: 31048
    - port: 9848
      name: client-rpc
      targetPort: 9848
    - port: 9849
      name: raft-rpc
      targetPort: 9849
    ## 兼容1.4.x版本的选举端口
    - port: 7848
      name: old-raft-rpc
      targetPort: 7848
  selector:
    app: nacos-prod
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: nacos-cm
data:
  mysql.db.name: "nacos_prod"
  mysql.port: "3306"
  mysql.user: "nacos"
  mysql.password: "nacos"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nacos-prod
spec:
  replicas: 1
  template:
    metadata:
      labels:
        app: nacos-prod
      annotations:
        pod.alpha.kubernetes.io/initialized: "true"
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchExpressions:
                  - key: "app"
                    operator: In
                    values:
                      - nacos-prod
              topologyKey: "kubernetes.io/hostname"
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
        - name: k8snacos
          imagePullPolicy: Always
          image: nacos/nacos-server:latest
          resources:
            requests:
              memory: "1Gi"
              cpu: "500m"
          ports:
            - containerPort: 8848
              name: client
            - containerPort: 9848
              name: client-rpc
            - containerPort: 9849
              name: raft-rpc
            - containerPort: 7848
              name: old-raft-rpc
          env:
            - name: NACOS_REPLICAS
              value: "1"
            - name: MYSQL_SERVICE_DB_NAME
              valueFrom:
                configMapKeyRef:
                  name: nacos-cm
                  key: mysql.db.name
            - name: MYSQL_SERVICE_PORT
              valueFrom:
                configMapKeyRef:
                  name: nacos-cm
                  key: mysql.port
            - name: MYSQL_SERVICE_USER
              valueFrom:
                configMapKeyRef:
                  name: nacos-cm
                  key: mysql.user
            - name: MYSQL_SERVICE_PASSWORD
              valueFrom:
                configMapKeyRef:
                  name: nacos-cm
                  key: mysql.password
            - name: NACOS_SERVER_PORT
              value: "8848"
            - name: NACOS_APPLICATION_PORT
              value: "8848"
            - name: PREFER_HOST_MODE
              value: "hostname"
            - name: MODE
              value: "standalone"
  selector:
    matchLabels:
      app: nacos-prod
      
# 查看pod,发现处于Runing状态，并在node01的节点上，端口为31048
[root@master nacos]# kubectl get po -o wide
NAME                          READY   STATUS    RESTARTS   AGE    IP           NODE     NOMINATED NODE   READINESS GATES
nacos-prod-55487457cd-vpjkn   1/1     Running   0          6m7s   10.244.1.3   node01   <none>           <none>
[root@master nacos]# kubectl get svc
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP                                                       7d23h
nacos-prod   NodePort    10.102.139.65   <none>        8848:31048/TCP,9848:31522/TCP,9849:32267/TCP,7848:31939/TCP   43s

# 访问
http://IP + 31048/nacos			# 端口是yaml文件定义的，可以自已定义
```

## 测试环境

### 需要创建NFS，不然pod起不来

```perl
---
apiVersion: v1
kind: Service
metadata:
  name: mysql-dev
spec:
  ports:
    - port: 3306
      nodePort: 30070
  selector:
    app: mysql-dev
  type: NodePort
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql-dev
  labels:
    app: mysql-dev
spec:
  replicas: 1 # pod数量
  selector:
    matchLabels:
      app: mysql-dev
  template:
    metadata:
      labels:
        app: mysql-dev
    spec:
      containers:
        - name: mysql-dev
          image: nacos/nacos-mysql:5.7
          imagePullPolicy: IfNotPresent
          resources:
            limits:
              memory: "0.5Gi"
              cpu: "1500m"
          ports:
            - containerPort: 3306
          env:
            - name: MYSQL_ROOT_PASSWORD
              value: "root"
            - name: MYSQL_DATABASE
              value: "my_db"
            - name: MYSQL_USER
              value: "nacos"
            - name: MYSQL_PASSWORD
              value: "nacos"
          volumeMounts:
            - name: mysql-data
              mountPath: /var/lib/mysql
            - name: mysql-dev-conf
              mountPath: /etc/mysql
      volumes:
        - name: mysql-data
          nfs:
            server: localhost
            path: /data/dev/mysql
        - name: mysql-dev-conf
          configMap:
            name: my-dev.cnf
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-dev.cnf
data:
  my.cnf: |
    [mysqld]
    port = 3306
    character-set-server=utf8mb4
    collation-server=utf8mb4_unicode_ci
    skip-character-set-client-handshake=1
    default-storage-engine=INNODB
    max_allowed_packet = 500M
    explicit_defaults_for_timestamp=1
    long_query_time = 10
```

