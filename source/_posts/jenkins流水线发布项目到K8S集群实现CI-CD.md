---
title: jenkins流水线发布项目到K8S集群实现CI/CD
author: Mr.xu
date: 2025-11-06 20:45:17
tags:
---

jenkins流水线发布项目到K8S集群实现CI/CD

# 准备环境
```perl
systemctl stop firewalld  && setenforce 0

10.31.162.133	master
10.31.162.134	node-1
10.31.162.135	node2
10.31.162.124	harbor
10.31.162.35	  jenkins/git		------>充当开发角色模拟提交代码到gitlab
git仓库我们这里使用gitee代替gitlab
```
# 配置jenkins服务器

```perl
1.安装git客户端与docker
[root@jenkins-server ~]# yum install -y git
[root@jenkins-server ~]# yum install -y yum-utils device-mapper-persistent-data lvm2 git
[root@jenkins-server ~]# yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
[root@jenkins-server ~]# yum install -y docker
启动并设置开机启动
[root@jenkins-server ~]# systemctl start docker && systemctl enable docker

2.安装jenkins---略

3.jenkins页面上额外安装插件
docker 和pipeline 插件
```

# 登入10.31.162.35:8080/jenkins安装插件

![K8S-CICD1.webp](/upload/K8S-CICD1.webp)

# 指定docker环境

![K8S-CICD1.webp](/upload/K8S-CICD2.webp)

# 由于jenkins最后要将生成的镜像上传到harbor仓库，需要在jenkins上面配置登陆harbor仓库

```perl
[root@master k8s]# cat /etc/docker/daemon.json
{
"exec-opts":["native.cgroupdriver=systemd"],
"insecure-registries": ["10.31.162.124"]		#添加hatbor仓库
}
[root@jenkins-server ~]# systemctl restart docker 
[root@jenkins-server ~]# docker login -u admin -p Harbor12345 10.31.162.124  #测试
Login Succeeded
```

# 登陆harbor创建相应项目的仓库

![K8S-CICD1.webp](/upload/K8S-CICD3.webp)

![K8S-CICD1.webp](/upload/K8S-CICD4.webp)

# 更新代码仓库

![K8S-CICD1.webp](/upload/K8S-CICD5.webp)

# 在git服务器上面创建公钥和私钥，将公钥上传到gitee

```perl
[root@jenkins-server ~]# ssh-keygen
[root@jenkins-server ~]# cd .ssh/
[root@jenkins-server .ssh]# ls
id_rsa  id_rsa.pub  known_hosts
[root@jenkins-server .ssh]# cat id_rsa.pub 
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC6rVm2pdguGz+Y72JRBk/lpbh3jfqriNWqv3QlP6iVP+tUTRZiGB5pcjCC8cHg6w64XPj4xRpQcj+Aviq7ORSuPGSk5hCMz9O7/wUMJsP4uVIvm5P/rwQBppdS3+qGE6COkhHdEY+GcjpLFVG2mW+ksQe3W2bvBKe7msNpqgUtQs+z99UXf9LlnGUCrRF/oddPSgq3tJDXZoYzdEb3a7bZDf3j72XOYubX0fcygS1fG615+xnJP9knfoKkr4YSZkxj25TwPEO5JToPtr4tcOpJRqBA7KrookicuiWeIe7J91mRVH1tx9GWnPMMyXqsy0LcyV2rUUhG4c71W0mEfLzn root@jenkins-server
```

![K8S-CICD1.webp](/upload/K8S-CICD6.webp)

![K8S-CICD1.webp](/upload/K8S-CICD7.webp)

# 将创建好的仓库克隆到本地

![K8S-CICD1.webp](/upload/K8S-CICD8.webp)

```perl
[root@jenkins-server ~]# git clone git@gitee.com:testpm/javaweb.git
Cloning into 'javaweb'...
warning: You appear to have cloned an empty repository.
[root@jenkins-server ~]# ls
javaweb

克隆测试代码，将测试代码上传到gitlab
[root@jenkins-server ~]# git clone https://github.com/bingyue/easy-springmvc-maven
[root@jenkins-server ~]# cd easy-springmvc-maven/
[root@jenkins-server easy-springmvc-maven]# ls
pom.xml  README.md  src
[root@jenkins-server easy-springmvc-maven]# cp -r * /root/javaweb/
[root@jenkins-server easy-springmvc-maven]# ls /root/javaweb/
pom.xml  README.md  src

将代码上传到公司的远程仓库
[root@jenkins-server easy-springmvc-maven]# cd /root/javaweb/
[root@jenkins-server javaweb]# git add .
[root@jenkins-server javaweb]# git commit -m "1.0"
[root@jenkins-server javaweb]# git push origin master
```


![K8S-CICD9.webp](/upload/K8S-CICD9.webp)

# 编写dockerfile上传仓库

```perl
编写dockerfile用于生成镜像
[root@jenkins-server javaweb]# cat Dockerfile 
From daocloud.io/library/tomcat:8.0.45
RUN rm -rf /usr/local/tomcat/webapps/*
ADD ./target/easy-springmvc-maven.war /usr/local/tomcat/webapps/
EXPOSE 8080
ENTRYPOINT ["/usr/local/tomcat/bin/catalina.sh","run"]

重新上传到远程仓库
[root@jenkins-server javaweb]# git add -A 
[root@jenkins-server javaweb]# git commit -m "v2.0"
[root@jenkins-server javaweb]# git push origin master
```

![K8S-CICD1.webp](/upload/K8S-CICD10.webp)

# 配置jenkins流水线进行打包编译生成镜像并推送到公司的harbor仓库

![K8S-CICD1.webp](/upload/K8S-CICD11.webp)

![K8S-CICD1.webp](/upload/K8S-CICD12.webp)

# 基本配置略，开始编写pipeline脚本

![K8S-CICD1.webp](/upload/K8S-CICD13.webp)

![K8S-CICD1.webp](/upload/K8S-CICD14.webp)

![K8S-CICD1.webp](/upload/K8S-CICD15.webp)

# 复制私钥，创建用户

```Perl
[root@jenkins-server ~]# cat /root/.ssh/id_rsa

复制私钥，生成用户
```

![K8S-CICD1.webp](/upload/K8S-CICD16.webp)

![K8S-CICD1.webp](/upload/K8S-CICD17.webp)

# 流水线完整脚本内容:

```perl
pipeline {
    agent any

    stages {
        stage('pull code') {
            steps {
                checkout([$class: 'GitSCM', branches: [[name: '*/master']], extensions: [], userRemoteConfigs: [[credentialsId: 'da64354c-fffc-4fbf-9865-bf9c74e25b95', url: 'git@gitee.com:testpm/javaweb.git']]])		#将生成的流水线脚本复制到到这里
            }
        }
        stage('build code') {
            steps {
                sh 'cd /root/.jenkins/workspace/test-web1'
                sh 'mvn clean package'
            }
        }
        stage('build image'){
            steps {
                sh 'docker build -t 10.31.162.124/javapm/javaweb:v2.0 .'	#改成自己的仓库地址
            }
        }
        stage('push image to harbor') {
            steps {
                sh 'docker login -u admin -p Harbor12345 10.31.162.124'
                sh 'docker push 10.31.162.124/javapm/javaweb:v2.0 && docker rmi 10.31.162.124/javapm/javaweb:v2.0'
            }
        }
    }
}

```

![K8S-CICD1.webp](/upload/K8S-CICD18.webp)

![K8S-CICD1.webp](/upload/K8S-CICD19.webp)

# 登陆harbor仓库查看镜像是否上传成功

![K8S-CICD1.webp](/upload/K8S-CICD20.webp)

# K8S集群上部署Harbor仓库

```perl
所有机器上都操作，创建secret需要，不然创建不成功
[root@master ~]# vim /etc/docker/daemon.json   #编辑文件
{
"insecure-registries": ["10.31.162.133"]   #该ip为部署仓库机器的ip
}
[root@master ~]# # systemctl restart docker

验证是否可以登入
[root@master ~]# docker login -u admin -p Harbor 10.31.162.133
```



# 发布项目到k8s集群，编写deployment进行发布

```perl
查看master上面认证的密钥文件
[root@master k8s]# cat /root/.docker/config.json | base64 -w 0
ewoJImF1dGhzIjogewoJCSIxMC4zMS4xNjIuMTI0IjogewoJCQkiYXV0aCI6ICJZV1J0YVc0NlNHRnlZbTl5TVRJek5EVT0iCgkJfQoJfQp9

创建登入harbor仓库的secret
[root@master k8s]# cat secret.yaml 
apiVersion: v1
kind: Secret
metadata:
 name: harbor-login
 labels:
  app: harbor
type: kubernetes.io/dockerconfigjson
data:
 .dockerconfigjson: ewoJImF1dGhzIjogewoJCSIxMC4zMS4xNjIuMTI0IjogewoJCQkiYXV0aCI6ICJZV1J0YVc0NlNHRnlZbTl5TVRJek5EVT0iCgkJfQoJfQp9      #将上面生成的密钥复制到这里

[root@master k8s]# systemctl apply -f secret.yaml
secret/harbor-login created

[root@master k8s]# cat java-dep.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
 name: tomcat-dep
spec:
 selector:
  matchLabels:
   app: java
 replicas: 2
 template:
  metadata:
   labels:
    app: java
  spec:
   volumes:
   - name: log-vol
     hostPath:
      path: /var/javaweb/log
   containers:
   - name: tomcat
     image: 10.31.162.124/javapm/javaweb:v2.0
     ports:
     - containerPort: 8080
     volumeMounts:
     - mountPath: "/usr/local/tomcat/logs"
       name: log-vol
   imagePullSecrets:
   - name: harbor-login
   
创建depolyment
[root@master k8s]# kubectl apply -f java-dep.yaml
deployment.apps/tomcat-dep created

查看pod有没有运行起来
[root@master k8s]# kubectl get po
NAME                          READY   STATUS    RESTARTS   AGE
tomcat-dep-7bd9fb7df9-4fz6x   1/1     Running   0          26s
tomcat-dep-7bd9fb7df9-wsbth   1/1     Running   0          26s
```

# 配置Ingress实现访问

```perl
下载ingress配置文件: 如果下载不下来记得添加解析
[root@master ~]# cat /etc/hosts
127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4
::1         localhost localhost.localdomain localhost6 localhost6.localdomain6
192.168.116.138 master
192.168.116.130 node1
192.168.116.131 node2
199.232.28.133 raw.githubusercontent.com  #解析github的地址

可以直接进行这一步进行下载
[root@master k8s]# cd /mnt/
[root@master k8s]# wget https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.3.0/deploy/static/provider/cloud/deploy.yaml
修改配置文件
[root@master k8s]# vim deploy.yaml
找到已下apiserver的版本：
---
apiVersion: apps/v1
kind: DaemonSet  #将原来的Deployment修改为DaemonSet
metadata:
  labels:
    app.kubernetes.io/component: controller
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx
    app.kubernetes.io/version: 1.3.0
  name: ingress-nginx-controller
  namespace: ingress-nginx
spec:
  minReadySeconds: 0
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      app.kubernetes.io/component: controller
      app.kubernetes.io/instance: ingress-nginx
      app.kubernetes.io/name: ingress-nginx
  template:
    metadata:
      labels:
        app.kubernetes.io/component: controller
        app.kubernetes.io/instance: ingress-nginx
        app.kubernetes.io/name: ingress-nginx
    spec:
      hostNetwork: true  #添加共享到主机网络
      containers:
      - args:
        - /nginx-ingress-controller
        - --publish-service=$(POD_NAMESPACE)/ingress-nginx-controller
        - --election-id=ingress-controller-leader
        - --controller-class=k8s.io/ingress-nginx
        - --ingress-class=nginx
        - --configmap=$(POD_NAMESPACE)/ingress-nginx-controller
        - --validating-webhook=:8443
        - --validating-webhook-certificate=/usr/local/certificates/cert
        - --validating-webhook-key=/usr/local/certificates/key
        env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        - name: LD_PRELOAD
          value: /usr/local/lib/libmimalloc.so
        image: registry.cn-hangzhou.aliyuncs.com/google_containers/nginx-ingress-controller:v1.3.0@sha256:d1707ca76d3b044ab8a28277a2466a02100ee9f58a86af1535a3edf9323ea1b5 			#将原来的镜像替换成阿里云仓库的镜像
        imagePullPolicy: IfNotPresent
        lifecycle:
          preStop:
            exec:
              command:
              - /wait-shutdown
   。。。
        volumeMounts:
        - mountPath: /usr/local/certificates/
          name: webhook-cert
          readOnly: true
      dnsPolicy: ClusterFirst
      nodeSelector:
        custom/ingress-controller-ready: "true"  #指定运行ingress的node标签
      serviceAccountName: ingress-nginx
      terminationGracePeriodSeconds: 300
      volumes:
      - name: webhook-cert
        secret:
          secretName: ingress-nginx-admission
---

#注意:一共有两个镜像需要替换成阿里云仓库的镜像:
[root@master ~]# cat deploy.yaml | grep image
        image: registry.cn-hangzhou.aliyuncs.com/google_containers/nginx-ingress-controller:v1.3.0@sha256:d1707ca76d3b044ab8a28277a2466a02100ee9f58a86af1535a3edf9323ea1b5
        imagePullPolicy: IfNotPresent
        image: registry.cn-hangzhou.aliyuncs.com/google_containers/kube-webhook-certgen:v1.1.1@sha256:64d8c73dca984af206adf9d6d7e46aa550362b1d7a01f3a0a91b20cc67868660
        imagePullPolicy: IfNotPresent
        image: registry.cn-hangzhou.aliyuncs.com/google_containers/kube-webhook-certgen:v1.1.1@sha256:64d8c73dca984af206adf9d6d7e46aa550362b1d7a01f3a0a91b20cc67868660
        imagePullPolicy: IfNotPresent
```

# 给两个node节点设置lable

```perl
[root@master ~]# kubectl label nodes node-1 custom/ingress-controller-ready=true
node/node1 labeled
[root@master ~]# kubectl label nodes node-2 custom/ingress-controller-ready=true
node/node2 labeled

同时在两个node节点下载镜像
[root@node1 ~]# docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/nginx-ingress-controller:v1.3.0
[root@node1 ~]# docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/kube-webhook-certgen:v1.1.1
```

# 创建ingress-controller

```perl
创建deploy
[root@master k8s]# kubectl apply -f deploy.yaml 
namespace/ingress-nginx created
serviceaccount/ingress-nginx created
。。。
ingressclass.networking.k8s.io/nginx created
validatingwebhookconfiguration.admissionregistration.k8s.io/ingress-nginx-admission created

查看ingress-controller资源
[root@master k8s]# kubectl get po -n ingress-nginx
NAME                                      READY   STATUS      RESTARTS   AGE
ingress-nginx-admission-create--1-vc8xc   0/1     Completed   0          30s
ingress-nginx-admission-patch--1-5crsl    0/1     Completed   1          30s
ingress-nginx-controller-z4nzd            1/1     Running     0          30s
ingress-nginx-controller-zmkpc            1/1     Running     0          30s

[root@master k8s]# ls
deploy.yaml  java-dep.yaml  secret.yaml
```

测试ingress

# 创建service

```perl
[root@master k8s]# cat java-service.yaml 
apiVersion: v1
kind: Service
metadata:
 name: my-java
 labels:
  run: my-java
spec:
 ports:
 - port: 80
   targetPort: 8080
 selector:
  app: java
  
创建service
root@master k8s]# kubectl apply -f java-service.yaml 
service/my-tomcat created

查看资源
[root@master k8s]# kubectl get po
NAME                          READY   STATUS    RESTARTS   AGE
tomcat-dep-7bd9fb7df9-4fz6x   1/1     Running   0          18m
tomcat-dep-7bd9fb7df9-wsbth   1/1     Running   0          18m
[root@master k8s]# kubectl get svc
NAME         TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)   AGE
kubernetes   ClusterIP   10.96.0.1        <none>        443/TCP   2d1h
my-java      ClusterIP   10.104.150.165   <none>        80/TCP    27s
```

# 配置ingress转发文件

```perl
[root@master k8s]# cat ingress-test.yaml 
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
 name: test-ingress
 namespace: default
 annotations:
  nginx.ingress.kubernetes.io/rewrite-target: /easy-springmvc-maven/
spec:
 ingressClassName: nginx	#指定ingress的类型
 rules:		#定义转发规则
 - host: test.tomcat.com	#指定域名方式
   http:
    paths:
    - path:  /easy-springmvc-maven/		#指定访问的路径
      pathType: Prefix		 #定义路径的类型
      backend:		#定义转发后端的服务
       service:		#定义转发的service
        name: my-java		#这个定义的名字要和service的名字一样
        port:
         number: 80
         
[root@master k8s]# kubectl apply -f ingress-test.yaml 
ingress.networking.k8s.io/test-ingress created
[root@master k8s]# kubectl get ingress
NAME           CLASS   HOSTS             ADDRESS   PORTS   AGE
test-ingress   nginx   test.tomcat.com             80      13s
```

# 在wind电脑设置本机解析

```perl
在C:\Windows\System32\drivers\etc找到hosts文件里添加
10.31.162.135	test.tomcat.com		#这个IP地址是选取的一个node节点IP
```

![K8S-CICD1.webp](/upload/K8S-CICD21.webp)

# 测试访问

![K8S-CICD1.webp](/upload/K8S-CICD22.webp)