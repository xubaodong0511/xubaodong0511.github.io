---
title: kkFileview文件预览
author: Mr.xu
date: 2025-11-05 22:14:36
tags:
---

### kkfileview--单节点

#### 作用

1. **文档预览**：
   - 支持预览多种文档格式，如 Word（.doc、.docx）、Excel（.xls、.xlsx）、PowerPoint（.ppt、.pptx）、PDF、TXT、图片（.jpg、.png、.gif）等。
   - 用户无需下载文件即可在浏览器中查看文档内容。
2. **跨平台支持**：
   - 兼容多种操作系统和浏览器，用户可以在不同设备上进行文档预览。
3. **集成简单**：
   - 提供 RESTful API，方便与其他系统集成，如文件管理系统、内容管理系统（CMS）、企业内部系统等。
   - 通过简单的 HTTP 请求即可实现文档预览功能。
4. **高性能**：
   - 采用高效的文档转换和渲染技术，确保文档预览的速度和质量。
   - 支持缓存机制，提高文档预览的响应速度。
5. **安全性**：
   - 提供多种安全配置选项，如访问控制、数据加密等，确保文档预览过程中的数据安全。
   - 支持配置白名单，限制只有特定 IP 地址可以访问预览服务。
6. **扩展性**：
   - 支持插件机制，用户可以根据需求扩展支持的文档格式和功能。
   - 提供详细的文档和示例，方便用户进行二次开发和定制。

#### 资源需求

- **CPU**: 4 核 
- **内存**:  8 GB 
- **存储**: 4T
- **节点**：1

#### 网络端口

- **端口号**: 8012
- **用途**: 
  - **服务监听端口**：
    - KKFileView 作为一个文档预览服务，会在指定的端口上监听 HTTP 请求。默认情况下，许多服务会使用 8080 端口，但为了避免冲突或出于其他配置需求，可以将其设置为 8012。
  - **客户端请求**：
    - 客户端（例如浏览器或其他应用程序）需要通过这个端口访问 KKFileView 提供的文档预览服务。例如，用户在浏览器中访问 `http://<server-ip>:8012/` 来查看文档。
  - **负载均衡和代理**：
    - 在一些复杂的部署环境中，8012 端口可能会被配置在负载均衡器或反向代理服务器（如 Nginx 或 Apache）后面，这些服务器会将请求转发到 KKFileView 服务。

#### 安装部署

##### 上传安装包

```
wget  https://a.xbd666.cn/d/Aliyun/Cloud_computing/Software_package/kkFileView/LibreOffice_7.1.4_Linux_x86-64_rpm.tar.gz

wget  https://a.xbd666.cn/d/Aliyun/Cloud_computing/Software_package/kkFileView/kkFileView-4.0.0.tar.gz

wget  https://a.xbd666.cn/d/Aliyun/Cloud_computing/Software_package/JDK/jdk-11.0.20_linux-x64_bin.tar.gz

```

##### 定义主机组

```
[root@localhost ~]# vim kkfile
[kkfile]
10.100.40.254

```

##### 编辑脚本

```
[root@localhost ~]# vim kkfile.sh
#!/bin/bash


# 设置变量
KKFILEVIEW_DIR=/data/kkFileView
LIBREOFFICE_ARCHIVE=/root/LibreOffice_7.1.4_Linux_x86-64_rpm.tar.gz
JDK_ARCHIVE=/root/jdk-11.0.20_linux-x64_bin.tar.gz
KKFILEVIEW_ARCHIVE=/root/kkFileView-4.0.0.tar.gz
JAVA_HOME_DIR=/usr/local/java


# 创建目录
mkdir -p $KKFILEVIEW_DIR


# 解压 LibreOffice
tar xzf $LIBREOFFICE_ARCHIVE -C $KKFILEVIEW_DIR


# 解压 JDK
tar xzf $JDK_ARCHIVE -C /usr/local


# 更名
mv /usr/local/jdk-11.0.20 $JAVA_HOME_DIR


# 配置环境变量
cat >> /etc/profile <<EOF
JAVA_HOME=$JAVA_HOME_DIR
PATH="\$JAVA_HOME/bin:\$PATH"
export JAVA_HOME PATH
EOF


# 变量生效
source /etc/profile


# 安装 LibreOffice 依赖包
yum install -y $KKFILEVIEW_DIR/LibreOffice_7.1.4.2_Linux_x86-64_rpm/RPMS/*.rpm


# 安装其他依赖库
yum -y install cairo
yum -y install cups-libs
yum -y install libSM


# 验证库文件
if [ ! -f /usr/lib64/libcairo.so.2 ] || [ ! -f /usr/lib64/libcups.so.2 ] || [ ! -f /usr/lib64/libSM.so.6 ]; then
    echo "One or more library files are missing. Exiting..."
    exit 1
fi


# 更新库缓存
ldconfig


# 查看 LibreOffice 版本
/opt/libreoffice7.1/program/soffice --version


# 解压 kkFileView
tar xzf $KKFILEVIEW_ARCHIVE -C $KKFILEVIEW_DIR


# 修改配置文件
sed -i 's|office.home=.*|office.home=/opt/libreoffice7.1|g' $KKFILEVIEW_DIR/kkFileView-4.0.0/config/application.properties
sed -i 's|office.plugin.server.ports=.*|office.plugin.server.ports=2001,2002|g' $KKFILEVIEW_DIR/kkFileView-4.0.0/config/application.properties


# 查出所有 office 进程并杀掉
pkill -f office


sleep 5


# 启动 kkFileView
$KKFILEVIEW_DIR/kkFileView-4.0.0/bin/startup.sh

```

##### 拷贝至目标主机

```
[root@localhost ~]# vim kkfile.yaml
---
- name: Deploy kkfileview cluster
  hosts: kkfile
  become: yes
  tasks:
    - name: Copy kkfileview tarball to target hosts
      copy:
        src: /root/LibreOffice_7.1.4_Linux_x86-64_rpm.tar.gz
        dest: /root/LibreOffice_7.1.4_Linux_x86-64_rpm.tar.gz


    - name: Copy kkfileview tarball to target hosts
      copy:
        src: /root/jdk-11.0.20_linux-x64_bin.tar.gz
        dest: /root/jdk-11.0.20_linux-x64_bin.tar.gz


    - name: Copy kkfileview tarball to target hosts
      copy:
        src: /root/kkFileView-4.0.0.tar.gz
        dest: /root/kkFileView-4.0.0.tar.gz


    - name: Copy kkfileview tarball to target hosts
      copy:
        src: /root/kkfile.sh
        dest: /root/kkfile.sh
        mode: '0755'

```

##### 执行传输

```
[root@localhost ~]# ansible-playbook -i /root/kkfile  kkfile.yaml
```

##### 执行脚本

```
[root@localhost ~]# ansible -i /root/kkfile kkfile -m shell -a '/root/kkfile.sh'
```

##### 验证
```
http:// IP + 8012