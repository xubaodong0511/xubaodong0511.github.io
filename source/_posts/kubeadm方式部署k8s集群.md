---
title: kubeadm方式部署k8s集群
author: Mr.xu
date: 2025-11-06 20:50:54
tags:
---

k8s集群部署

# 下载k8s谷歌镜像

```shell
docker pull k8s.gcr.io/kube-apiserver:v1.16.1
docker pull k8s.gcr.io/kube-proxy:v1.16.1
docker pull k8s.gcr.io/kube-controller-manager:v1.16.1
docker pull k8s.gcr.io/kube-scheduler:v1.16.1
docker pull k8s.gcr.io/etcd:3.3.15
docker pull k8s.gcr.io/pause:3.1
docker pull k8s.gcr.io/coredns:1.6.2

谷歌的k8s镜像库下载不下来
```

# 特别说明

- 所有机器都必须有镜像
- 每次部署都会有版本更新，具体版本要求，运行初始化过程失败会有版本提示
- kubeadm的版本和镜像的版本必须是对应的

# 准备环境

```ini
本地解析
[root@master ~]# vim /etc/hosts
10.31.162.133	kub-k8s-master
10.31.162.134	kub-k8s-node1
10.31.162.135	kub-k8s-node2

1.关闭防火墙：
# systemctl stop firewalld
# systemctl disable firewalld
2.禁用SELinux：
# setenforce 0
3.编辑文件/etc/selinux/config，将SELINUX修改为disabled，如下：
# sed -i 's/SELINUX=permissive/SELINUX=disabled/' /etc/sysconfig/selinux
SELINUX=disabled 

k8s集群需要关闭swap分区
[root@master ~]# swapoff -a
修改/etc/fstab文件，注释掉SWAP的自动挂载，使用free -m确认swap已经关闭。
2.注释掉swap分区：
[root@master ~]# sed -i 's/.*swap.*/#&/' /etc/fstab
# free -m
              total        used        free      shared  buff/cache   available
Mem:           3935         144        3415           8         375        3518
Swap:             0           0           0
```

# 安装docker--三台机器都操作

```ini
清理环境
[root@master ~]# yum remove docker \
docker-client \
docker-client-latest \
docker-common \
docker-latest \
docker-latest-logrotate \
docker-logrotate \
docker-selinux \
docker-engine-selinux \
docker-engine
下载docker
[root@master ~]# yum install -y yum-utils device-mapper-persistent-data lvm2 git
更换阿里的源
[root@master ~]# yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
下载dockers客户端
[root@master ~]# yum install docker-ce -y
[root@master ~]# systemctl start docker && systemctl enable docker

#注:在目前k8s版本1.20以后将原来的cgroupfs驱动程序修改成了systemd来为容器做资源限制，故此需要将docker的驱动程序修改为systemd。(所有节点)

[root@master ~]# cat /etc/docker/daemon.json 
{
 "exec-opts":["native.cgroupdriver=systemd"]
}

重启docker
```

# 阿里仓库下载

```ini
下载镜像
[root@k8s-master ~]# vim pull.sh 
#!/usr/bin/bash
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/kube-controller-manager:v1.22.2
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/kube-proxy:v1.22.2
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/kube-apiserver:v1.22.2
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/kube-scheduler:v1.22.2
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/coredns:1.8.4
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/etcd:3.5.0-0
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/pause:3.5

下载完了之后需要将aliyun下载下来的所有镜像打成k8s.gcr.io/kube-controller-manager:v1.22.2这样的tag
[root@k8s-master ~]# vim tag.sh 
#!/usr/bin/bash
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/kube-controller-manager:v1.22.2 k8s.gcr.io/kube-controller-manager:v1.22.2
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/kube-proxy:v1.22.2 k8s.gcr.io/kube-proxy:v1.22.2
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/kube-apiserver:v1.22.2 k8s.gcr.io/kube-apiserver:v1.22.2
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/kube-scheduler:v1.22.2 k8s.gcr.io/kube-scheduler:v1.22.2
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/coredns:1.8.4 k8s.gcr.io/coredns/coredns:v1.8.4
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/etcd:3.5.0-0 k8s.gcr.io/etcd:3.5.0-0
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/pause:3.5 k8s.gcr.io/pause:3.5
版本号不用变
```

# 使用kubeadm部署Kubernetes

**所有节点安装kubeadm和kubelet**

```ini
配置源
[root@kub-k8s-master ~]# cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF

安装对应版本
1.安装最新版本
# yum makecache fast
# yum install -y kubelet kubeadm kubectl ipvsadm
=========================================
2.安装对应版本
[root@k8s-master ~]# yum install -y kubelet-1.22.2-0.x86_64 kubeadm-1.22.2-0.x86_64 kubectl-1.22.2-0.x86_64 ipvsadm

加载ipvs相关内核模块
#如果重新开机，需要重新加载（可以写在 /etc/rc.local 中开机自动加载）
[root@k8s-master ~]# vim /etc/rc.local 
modprobe ip_vs
modprobe ip_vs_rr
modprobe ip_vs_wrr
modprobe ip_vs_sh
modprobe nf_conntrack_ipv4

给与执行权限
[root@k8s-master ~]# chmod +x /etc/rc.local
重启服务器
[root@k8s-master ~]# init 6

配置转发相关参数，否则可能会出错
[root@k8s-master ~]# cat <<EOF >  /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
vm.swappiness=0
EOF

使配置生效
[root@k8s-master ~]# sysctl --system

如果net.bridge.bridge-nf-call-iptables报错，加载br_netfilter模块
[root@k8s-master ~]# modprobe br_netfilter
[root@k8s-master ~]# sysctl -p /etc/sysctl.d/k8s.conf

查看是否加载成功
[root@k8s-master ~]# lsmod | grep ip_vs
ip_vs_sh               12688  0 
ip_vs_wrr              12697  0 
ip_vs_rr               12600  0 
ip_vs                 141092  6 ip_vs_rr,ip_vs_sh,ip_vs_wrr
nf_conntrack          133387  2 ip_vs,nf_conntrack_ipv4
libcrc32c              12644  3 xfs,ip_vs,nf_conntrack
```

# 配置启动kubelet（所有节点）

```ini
配置变量：
[root@k8s-master ~]# DOCKER_CGROUPS=`docker info |grep 'Cgroup' | awk ' NR==1 {print $3}'`
[root@k8s-master ~]# echo $DOCKER_CGROUPS
cgroupfs 1

配置kubelet的cgroups
# cat >/etc/sysconfig/kubelet<<EOF
KUBELET_EXTRA_ARGS="--cgroup-driver=$DOCKER_CGROUPS --pod-infra-container-image=k8s.gcr.io/pause:3.5"
EOF

启动
[root@k8s-master ~]# systemctl daemon-reload
[root@k8s-master ~]# systemctl enable kubelet && systemctl restart kubelet
```

# 配置master节点

```ini
[root@k8s-master ~]# kubeadm init --kubernetes-version=v1.22.2 --pod-network-cidr=10.244.0.0/16 --apiserver-advertise-address=10.31.162.133 --ignore-preflight-errors=Swap

kubeadm join 192.168.246.166:6443 --token 93erio.hbn2ti6z50he0lqs \
    --discovery-token-ca-cert-hash sha256:3bc60f06a19bd09f38f3e05e5cff4299011b7110ca3281796668f4edb29a56d9  #需要记住，要保存好，配置node节点需要用到
注：
apiserver-advertise-address=192.168.246.166    ---master的ip地址。
--kubernetes-version=v1.16.1   --更具具体版本进行修改
注意在检查一下swap分区是否关闭

如下操作在master节点操作
[root@k8s-master ~]# mkdir -p $HOME/.kube
[root@k8s-master ~]# cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
[root@k8s-master ~]# chown $(id -u):$(id -g) $HOME/.kube/config
```

# 配置使用网络插件

```ini
在master节点操作
下载配置
[root@k8s-master ~]# cd ~ && mkdir flannel && cd flannel

下载flannel文件由于网站被墙了，需要如下操作：
[root@k8s-master flannel]# curl -O https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml

修改配置文件kube-flannel.yml:
此处的ip配置要与上面kubeadm的pod-network一致，本来就一致，不用改
  net-conf.json: |
    {
      "Network": "10.244.0.0/16",
      "Backend": {
        "Type": "vxlan"
      }
    }
# 如果Node有多个网卡的话，参考https://github.com/kubernetes/kubernetes/issues/39701
# 目前需要在kube-flannel.yml中使用--iface参数指定集群主机内网网卡的名称，否则可能会出现dns无法解析。容器无法通信的情况。
#需要将kube-flannel.yml下载到本地，
# flanneld启动参数加上--iface=<iface-name>
    containers:
      - name: kube-flannel
        image: quay.io/coreos/flannel:v0.12.0-amd64
        command:
        - /opt/bin/flanneld
        args:
        - --ip-masq
        - --kube-subnet-mgr
        - --iface=ens33		#如果一个，就添加这一个就行
        - --iface=eth0
# 如果有多个网卡可以多个添加，没有多个就添加一个ens33就可以
⚠️⚠️⚠️--iface=ens33 的值，是你当前的网卡,或者可以指定多网卡

# 1.12版本的kubeadm额外给node1节点设置了一个污点(Taint)：node.kubernetes.io/not-ready:NoSchedule，
# 很容易理解，即如果节点还没有ready之前，是不接受调度的。可是如果Kubernetes的网络插件还没有部署的话，节点是不会进入ready状态的。
# 因此修改以下kube-flannel.yaml的内容，加入对node.kubernetes.io/not-ready:NoSchedule这个污点的容忍：
    - key: beta.kubernetes.io/arch
                    operator: In
                    values:
                      - arm64
      hostNetwork: true
      tolerations:
      - operator: Exists
        effect: NoSchedule
      - key: node.kubernetes.io/not-ready  #添加如下三行---在165行左右
        operator: Exists
        effect: NoSchedule
      serviceAccountName: flannel

启动：
[root@k8s-master flannel]# kubectl apply -f ~/flannel/kube-flannel.yml  #启动完成之后需要等待一会

查看、验证：
# 查看kube-system命名空间中的pod信息
[root@k8s-master flannel]# kubectl get pods --namespace kube-system
# 查看 Kubernetes 集群中的服务信息
[root@k8s-master flannel]# kubectl get service
# 查看 Kubernetes 集群中 kube-dns 服务的详细信息
[root@k8s-master flannel]# kubectl get svc --namespace kube-system
只有网络插件也安装配置完成之后，才能会显示为ready状态
```

# 所有node节点操作

```ini
配置node节点加入集群：
如果报错开启ip转发：
# sysctl -w net.ipv4.ip_forward=1

在所有node节点操作，此命令为初始化master成功后返回的结果
[root@kub-k8s-node1 ~]# kubeadm join 10.31.162.133:6443 --token 4pynt1.te3qf0zf7os3juf8 \
        --discovery-token-ca-cert-hash sha256:90142b9ae11196be81844225273cf64f74cc31b5f9250a81fdc2347dc55d2890 
```

