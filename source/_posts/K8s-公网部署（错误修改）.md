---
title: K8s 公网部署（错误修改）
author: Mr.xu
date: 2025-11-06 20:45:47
tags:
---

# k8s公网部署

**翻新之前的文章**
[写的很乱的，多种安装方式](https://7boe.top/archives/187)

> 本次实验使用三台机器在不同地区进行部署，实验环境使用到香港服务器和杭州阿里云服务器，公网环境部署网络稳定性不能得到保证，本文部署方式仅供参考。

## 环境准备

**环境**

| 软件       | 软件版本 |
| ---------- | -------- |
| Docker     | 20.0.1   |
| Kubernetes | 1.23.6   |

**服务器规划**

| 服务器主机名 | 服务器公网IP   |
| ------------ | -------------- |
| master       | 149.104.23.134 |
| node1        | 121.41.53.83   |
| node2        | 116.62.32.149  |

------

**解析hosts**

```bash
cat >> /etc/hosts << EOF
149.104.23.134 master
121.41.53.83 node1
116.62.32.149 node2
EOF
```

**执行初始化脚本**

```bash
bash <(curl -sSl https://git.7boe.top/root/Shell/-/raw/af8fc85f5d15181942fc791305dc64e94c32c36e/k8s.sh?inline=false)
```

### Docker安装

**安装软件导入docker官方源**

```csharp
yum install -y yum-utils 
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

**使用docker20版本**

```lua
sudo yum install docker-ce-20.10.14-3.el7 docker-ce-cli-20.10.14-3.el7 containerd.io docker-compose-plugin
```

**其他版本有部分差异，可能会出奇怪问题。**
**换docker镜像源**

```javascript
cat <<EOF > /etc/docker/daemon.json
{
    "registry-mirrors": [
        "http://hub-mirror.c.163.com",
        "https://docker.mirrors.ustc.edu.cn",
        "https://registry.docker-cn.com"
    ],
    "exec-opts": ["native.cgroupdriver=systemd"]
}
EOF
```

**设置开机自启**

```bash
systemctl daemon-reload && systemctl restart docker && systemctl enable docker && systemctl status docker 
```

> 这里没有安装cri,因为k8s1.23版本还在提供docker作为容器运行

**确认这里一定是systemd**

> 因为k8s是默认systemd作为cgroup driver，如果Docker使用另外的驱动，则可能出现不稳定的情况。

```perl
docker info | grep "Cgroup Driver"
```

### 安装k8s

**k8s导入源使用阿里云的源**

```makefile
cat > /etc/yum.repos.d/kubernetes.repo << EOF
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=0
repo_gpgcheck=0
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF
```

**安装k8s**

```lua
sudo yum install -y kubelet-1.23.6 kubeadm-1.23.6 kubectl-1.23.6 --disableexcludes=kubernetes
```

**开机自启**

```bash
systemctl enable kubelet && systemctl start kubelet && systemctl status kubelet
```

**拉取镜像**

```lua
kubeadm config images pull --kubernetes-version=v1.23.6 --image-repository registry.aliyuncs.com/google_containers
```

**也可以使用配置文件拉取**

```lua
vim kubeadm-config-image.yaml
```

```makefile
apiVersion: kubeadm.k8s.io/v1beta2
kind: ClusterConfiguration
imageRepository: registry.aliyuncs.com/google_containers 
```

**拉取**

```lua
kubeadm config images pull --config kubeadm-config-image.yaml
```

### 初始化

> 之前这里是最头疼的地方，如果是一个内网里面直接就好了，但是公网的话直接写公网ip他就一直报错，提示找不到这个ip，应为阿里云服务器网卡没有绑定公网ip，eth0写的是内网vpc专业网络内网ip，采用的自动对外映射公网方式。

**这样初始化要变通一下**
先生成一个配置文件

```lua
kubeadm config print init-defaults > kubeadm-config.yaml
```

- pod-network-cidr：pod资源的网段，需与pod网络插件的值设置一致。通常，Flannel网络插件的默认为10.244.0.0/16，Calico插件的默认值为192.168.0.0/16；
- api-server：使用Master作为api-server，所以就是master机器的IP地址。
- image-repository：拉取镜像的镜像仓库，默认是k8s.gcr.io。
- nodeRegistration.name：改成master

更改配置文件

```yaml
apiVersion: kubeadm.k8s.io/v1beta3
bootstrapTokens:
- groups:
  - system:bootstrappers:kubeadm:default-node-token
  token: abcdef.0123456789abcdef
  ttl: 24h0m0s
  usages:
  - signing
  - authentication
kind: InitConfiguration
localAPIEndpoint:
  advertiseAddress: 149.104.23.134 #这样改成master的公网ip
  bindPort: 6443
nodeRegistration:
  criSocket: /var/run/dockershim.sock
  imagePullPolicy: IfNotPresent
  name: master  #这样要改成解析的主机名
  taints: null
---
apiServer:
  timeoutForControlPlane: 4m0s
apiVersion: kubeadm.k8s.io/v1beta3
certificatesDir: /etc/kubernetes/pki
clusterName: kubernetes
controllerManager: {}
dns: {}
etcd:
  local:
    dataDir: /var/lib/etcd
imageRepository: registry.aliyuncs.com/google_containers #一定要改
kind: ClusterConfiguration
kubernetesVersion: 1.23.6 #确认版本号
networking:
  dnsDomain: cluster.local
  serviceSubnet: 10.96.0.0/12
  podSubnet: 192.168.0.0/16  #方便安装网络插件
scheduler: {}
```

**检查环境是否支持**

```csharp
kubeadm init phase preflight --config=kubeadm-config.yaml 
kubeadm init --config=kubeadm-config.yaml
```



> 这里基本是初始化必失败的
> 到这里，会有2种结果：
> 如果是内网，上面的docker版本，kubeadm版本没错的话，会成功.
> 如果在云服务器（腾讯云，阿里云）上，一定会失败（原因和办法在这里）：

### 云服务器初始化失败

```sql
[kubelet-check] Initial timeout of 40s passed.
```



> 卡在这里应为他找不到你设定的apiserver IP地址
> 但是你必须要初始化，目的是为了生成k8s的配置文件，否则下面的步骤中你会找不到etcd.yaml），失败后再执行下面的步骤！！

```bash
vim /etc/kubernetes/manifests/etcd.yaml
```



更改以下配置，[来源文章](https://blog.51cto.com/u_15152259/2690063)。

```perl
    - --listen-client-urls=https://127.0.0.1:2379,https://101.34.112.190:2379
    - --listen-peer-urls=https://101.34.112.190:2380
```

**改成**

```perl
    - --listen-client-urls=https://127.0.0.1:2379
    - --listen-peer-urls=https://127.0.0.1:2380
```

**因为上方的地址他监听不到，要改成本地**

```perl
systemctl stop kubelet 
netstat -anp |grep kube
```

> 请注意，不要执行 kubeadm reset，先 systemctl stop kubelet ，然后手动通过 netstat -anp |grep kube 来找pid，再通过 kill -9 pid 强杀。否则又会生成错误的etcd配置文件，这里非常关键！！！

**重新初始化，但是跳过etcd文件已经存在的检查：**

```csharp
# 重新启动kubelet
systemctl start kubelet
重新初始化，跳过配置文件生成环节，不要etcd的修改要被覆盖掉
kubeadm init --config=kubeadm-config.yaml --skip-phases=preflight,certs,kubeconfig,kubelet-start,control-plane,etcd
```

### 成功初始化

如果所有配置都正常，很快会输出下面的信息（秒级别）代表了成功，否则大概率是失败（由于网络超时等）：

```bash
Your Kubernetes control-plane has initialized successfully!

To start using your cluster, you need to run the following as a regular user:

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

Alternatively, if you are the root user, you can run:

  export KUBECONFIG=/etc/kubernetes/admin.conf

You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/

Then you can join any number of worker nodes by running the following on each as root:
加入k8s 命令
```

**后面命令要是没了用这个，生成一个新的**

```lua
kubeadm token create --print-join-command
```

**token忘记**

```undefined
kubeadm token list
```

**每一个节点都执行的话都可以操作kubectl,文件要scp过去**

```bash
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

## 安装网络插件

### calico

**查看官网文档，看对应版本**

```ruby
https://docs.tigera.io/calico/3.25/getting-started/kubernetes/self-managed-onprem/onpremises
```

**3.25目前支持1.23的k8s**

```bash
https://docs.tigera.io/calico/3.25/getting-started/kubernetes/requirements
```

**安装**

```bash
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.25.0/manifests/calico.yaml 
```

### flannel

```
如果您使用自定义podCIDR（不是10.244.0.0/16），您首先需要下载上述清单并修改网络以匹配您的网络。
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
```

## 允许master节点部署pod

**调度策略**

- NoSchedule: 一定不能被调度
- PreferNoSchedule: 尽量不要调度
- NoExecute: 不仅不会调度, 还会驱逐Node上已有的Pod

**查看当前调度策略**

```perl
kubectl describe node|grep -E "Name:|Taints:"
```

**更改master节点可被部署pod**

```bash
kubectl taint nodes --all node-role.kubernetes.io/master-
```