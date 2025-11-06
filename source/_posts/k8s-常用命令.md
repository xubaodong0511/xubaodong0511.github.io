---
title: k8s 常用命令
author: Mr.xu
date: 2025-11-06 20:50:16
tags:
---

# k8s常用命令

# 查看ststem命名空间中pod的信息

```ini
kubectl get pods --namespace kube-system

kubectl get pods -n kube-system
```

# 查看k8s中的服务信息

```ini
kubectl get service
```

# 查看k8s中kube-dns的服务信息

```ini
kubectl get svc --namespace kube-system
```

# 查看所有节点

```ini
kubectl get nodes
```

# 查看node节点详细信息

```ini
kubectl describe node node-1
```

# 查看所有名称空间内的资源

```ini
kubectl get pods --all-namespaces
```

# 同时查看多种资源信息

```ini
kubectl get pod,svc -n kube-system
```

# 查看apiserver信息

```ini
kubectl cluster-info
```

# api查询

```ini
kubectl api-versions
```

# 创建yml文件时用来查看帮助的命令

```ini
kubectl explain 类型名
例如：kubectl explain namespace.spec
```

# 创建yml文件资源的命令

```ini
kubectl apply -f  yml文件名字
```

# 查看某一个namespace

```ini
kubectl get namespace 名称空间的名字
```

# 查看某个namespace的详细信息

```ini
kubectl describe namespace 名称空间的名字
```
#  查看在哪个node节点

```ini
kubectl get po -n qingfeng -o wide
```

# 创建名称空间

```ini 
kubectl create namespace qingfeng
```

# 查看默认命名空间信息

```ini
kubectl describe namespaces default 
```

# 删除默认空间资源限制

```ini
kubectl delete resourcequotas limit-qianfeng 
```

# 查看所有命名空间

```ini
kubectl get pod -A
```

# 查看pod详细信息

```ini
kubectl describe pod pod-1
```

# 在 master机器上进入容器

```ini
kubectl exec -it 元数据名字 -c 容器名字 -- bash
kubectl exec -it pod-1 -c centos -- bash
```

# 删除定义的容器

```ini
kubectl delete -f yml名字 
kubectl delete -f app.yml 
```

# 删除节点

```ini
kubectl delete node 节点名
```

# 重置节点

```ini
kubeadm reset

注2：master上在reset之后需要删除如下文件
# rm -rf /var/lib/cni/ $HOME/.kube/config
```

# 命令补全

```ini
yum -y install bash-completion
source /usr/share/bash-completion/bash_completion
source <(kubectl completion bash)
echo "source <(kubectl completion bash)" >> ~/.bashrc
```

# 重新生成token

```ini
重新生成方法：
1. 重新生成新的token:
[root@kub-k8s-master]# kubeadm  token create
kiyfhw.xiacqbch8o8fa8qj
[root@kub-k8s-master]# kubeadm  token list
TOKEN                     TTL         EXPIRES                     USAGES                   DESCRIPTION   EXTRA GROUPS
gvvqwk.hn56nlsgsv11mik6   <invalid>   2018-10-25T14:16:06+08:00   authentication,signing   <none>        system:bootstrappers:kubeadm:default-node-token
kiyfhw.xiacqbch8o8fa8qj   23h         2018-10-27T06:39:24+08:00   authentication,signing   <none>        system:bootstrappers:kubeadm:default-node-token

2. 获取ca证书sha256编码hash值:
[root@kub-k8s-master]# openssl x509 -pubkey -in /etc/kubernetes/pki/ca.crt | openssl rsa -pubin -outform der 2>/dev/null | openssl dgst -sha256 -hex | sed 's/^.* //'
5417eb1b68bd4e7a4c82aded83abc55ec91bd601e45734d6aba85de8b1ebb057

3. 节点加入集群:
  kubeadm join 18.16.202.35:6443 --token kiyfhw.xiacqbch8o8fa8qj --discovery-token-ca-cert-hash sha256:5417eb1b68bd4e7a4c82aded83abc55ec91bd601e45734d6aba85de8b1ebb057
几秒钟后，您应该注意到kubectl get nodes在主服务器上运行时输出中的此节点。

上面的方法比较繁琐，一步到位：
[root@kub-k8s-master ~]# kubeadm token create --print-join-command

第二种方法：
[root@kub-k8s-master ~]# token=$(kubeadm token generate)
kubeadm token create $token --print-join-command --ttl=0

然后在node节点执行
[root@kub-k8s-node1 ~]# kubeadm reset
[root@kub-k8s-node1 ~]# 执行生成得token
```

