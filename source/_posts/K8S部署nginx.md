---
title: K8S部署nginx
author: Mr.xu
date: 2025-11-06 20:40:38
tags:
---

# 创建目录

```
mkdir /opt/k8s/nginx-yaml
```

# 创建名称空间

```perl
kubectl create namespace nginx
```

# 创建deployment

```perl
vim nginx-deploy.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  namespace: nginx
spec:
  selector:
    matchLabels:
      app: nginx
  replicas: 3
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:alpine
        ports:
        - containerPort: 80
        volumeMounts:
        - mountPath: /etc/localtime
          name: c-v-path
        - mountPath: /etc/nginx/conf.d
          name: c-v-path-ng
      restartPolicy: Always
      volumes:
        - hostPath:
            path: /etc/localtime
            type: ''
          name: c-v-path
        - hostPath:
            path: /root/opt/k8s/nginx-yaml/nginx-conf
            type: ''
          name: c-v-path-ng
```

创建service

```perl
vim nginx-svc.yaml

apiVersion: v1
kind: Service
metadata:
  name: nginx-service
  namespace: nginx
spec:
  selector:
    app: nginx
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
    nodePort: 30080
  type: NodePort

```

创建

```perl
kubectl apply -f nginx-deploy.yaml
kubectl apply -f nginx-svc.yaml
```

查看pod在哪个节点

```perl
kubectl get deploy -n nginx -o wide

NAME               READY   UP-TO-DATE   AVAILABLE   AGE   CONTAINERS   IMAGES         SELECTOR
nginx-deployment   3/3     3            3           48s   nginx        nginx:alpine   app=nginx

```

查看service状态--端口是30080

```perl
kubectl get svc nginx-service -o wide

NAME            TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE   SELECTOR
nginx-service   NodePort   10.106.209.76   <none>        80:30080/TCP   26s   app=nginx

```

访问

```perl
pod节点 + 端口
```

进入容器

```perl
kubectl exec -it pod名称 --sh
```

