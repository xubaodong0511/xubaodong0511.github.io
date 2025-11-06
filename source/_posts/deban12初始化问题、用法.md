---
title: deban12初始化问题、用法
author: Mr.xu
date: 2025-11-06 21:03:38
tags:
---

# debian和ubuntu本身的vi编辑器是不支持用退格键删除和用上下左右键的

所以要
```
vi /etc/vim/vimrc.tiny

把 set compatible

修改改为：set nocompatible

加入一句：set backspace=2
```
# 还有debian和ubuntu用不了ll命令

直接分别到普通用户的家目录和root用户的家目录

有个隐藏文件` .bashrc `在他们的家目录下，root和用户的都要改，因为root和每个普通用户的家目录下都有一个 ` .bashrc `的文件你改那个用户就生效那个

`vim  ~/.bashrc `

在打开的文件里面加入(你想让什么命令变成什么命令就像这样写就行，而为这里的root用户本身是文件夹不显示颜色的，容易一定要加下面那个让文件夹显示颜色的命令。要添加的命令最好是想要转化成的命令的本身是这个系统没有的;

比如:debian本身没有ll这个命令的简写那就可以像这样添加)
```
alias ll='ls -l'
alias tailf='tail -f'
alias dir='dir --color=auto'（让文件夹显示颜色，这个在linux也可以用你但是这个命令其实是 Windows 系统下的命令别名设置，将 `dir` 命令设置为带颜色输出的别名。但是在 Linux 和 Unix 系统中，也可以使用这个别名命令，因为 Linux 和 Unix 系统的 Bash Shell 也支持 Windows 下的一些命令）
alias ls='ls --color=auto'   （让ls命令直接变成 ls --color命令,也是让文件夹显示颜色，但是linux下最好用这个）
```

！！！但是有个很重要的问题是改完一定要记得用命令 `source  ~/.bashrc`来重新加载` .bashrc `这个文件！！！

# 时间问题

当发现桌面时间是对的时候，但是终端里文件时间不对，说明终端时间和系统默认时间不同，需要修改终端时间

那么 先 输命令  `timedatectl`  查看当前终端的时间和时区对不对

# 如何取消vim选中文本自动进入可视化模式
```
cd  /usr/share/vim/vim90   进入此目录

vim defaults.vim   /mouse 查找此单词

修改set mouse-=a
```
# 查看版本及内核
```
cat /etc/os-release 
或 uname -a
```

# 查看apt的源
```
vim /etc/apt/sources.list
或 vim /etc/apt/sources.list.d/
```

# apt下载源的指令
```
wget https://dev.mysql.com/get/mysql-apt-config_0.8.29-1_all.deb
#下载dpkg的依赖
apt install gnupg
#需要用dpkg指令下载源
dpkg -i mysql-apt-config_0.8.29-1_all.deb 
#下载好源需要用update指令更新西
apt update
#更新好后源就自动生效了，此时可以下载服务了
apt install -y mysql-server
#debian系统服务下安装后不需要启动，会自动启动，直接查看状态即可
systemctl status mysql
```
# centos系统直接更改为debian系统
```
# 下载的github网地址
https://github.com/leitbogioro/Tools
# 下载
wget --no-check-certificate -qO InstallNET.sh 'https://gitee.com/mb9e8j2/Tools/raw/master/Linux_reinstall/InstallNET.sh' && chmod a+x InstallNET.sh
# 指定版本、指定登入密码
bash InstallNET.sh -debian 12 -passwd "12345"
# 默认密码
默认密码
对于 Linux：LeitboGi0ro
对于 Windows：Teddysun.com
也可等直接进入系统后更改密码：passwd 用户名
```