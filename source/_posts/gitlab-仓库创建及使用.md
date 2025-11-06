---
title: gitlab 仓库创建及使用
author: Mr.xu
date: 2025-11-06 20:56:49
tags:
---

**git的工作环境**

```ini
工作区
暂存区	git add *
版本库	git commit -m “版本描述信息” 
HEAD
版本号
版本日志
```
```ini
git clone git@IP地址:/自建的目录/自建的库/     #克隆到本地
git add .    #存储到暂存区
git commit -m "描述信息"    #更新版本
git push origin master    #上传到gitlab
```

`每个版本都会有一个id号，也就是commit id`

```ini
[root@vm20 ~]# git log

commit fbecfa3d04ae5038aa11bf55942e46c840077ace  #id号
```

**部署git**

```ini
环境：
    git-server    192.168.246.214  充当服务器
    client        192.168.246.213

安装：所有机器都安装
   [root@git-server ~]# yum install -y git
   [root@git-server ~]# git --version 
   git version 1.8.3.1
   
`所有的机器都添加，只要邮箱和用户不一样就可以`   
    # git config --global user.email "soho@163.com"     ----设置邮箱
    # git config --global user.name "soho"              ----加添用户
```

**1、git使用**

```ini
1.创建一个空目录：在中心服务器上创建
[root@git-server ~]# mkdir /git-test
[root@git-server ~]# useradd git   #创建一个git用户用来运行git
[root@git-server ~]# passwd git  #给用户设置密码
[root@git-server ~]# cd /git-test/

2.通过git init命令把这个目录变成Git可以管理的仓库：
 第1种情况：可以改代码，还能上传到别人的机器，别人也能从你这里下载但是别人不能上传代码到你的机器上。
 第2种情况：只是为了上传代码用，别人从这台机器上下载代码也可以上传代码到这台机器上，经常用于核心代码库。
```

**创建----裸库：**

```ini
`语法：git init --bare  库名字

#在server服务端
[root@git-server git-test]# git init --bare testgit
Initialized empty Git repository in /git-test/testgit/
[root@git-server ~]# chown git.git /git-test -R  #修改权限
2.仓库创建完成后查看库目录：
[root@git-server git-test]# cd testgit/
[root@git-server testgit]# ls
branches  config  description  HEAD  hooks  info  objects  refs
```

**客户端**

```ini
1.配置免密登录
[root@client ~]# ssh-keygen    #生成秘钥
[root@client ~]# ssh-copy-id -i git@192.168.246.214   #将秘钥传输到git服务器中的git用户
2.克隆git仓库
[root@client ~]# git clone git@192.168.246.214:/git-test/testgit/
Cloning into 'testgit'...
warning: You appear to have cloned an empty repository.
[root@client ~]# ls  #查看仓库已经克隆下来了
anaconda-ks.cfg    testgit 
```

**创建文件模拟代码提交到仓库**

```ini
1.在testgit目录下创建一个测试文件test.txt
[root@client ~]# cd testgit/
[root@client testgit]# vi test.txt   #随便写点东西
2.把文件添加到暂存区：使用 "git add" 建立跟踪
[root@client testgit]# git add test.txt
注: 这里可以使用 git add * 或者 git add -A
3.提交文件到本地仓库分支：
[root@client testgit]# git commit -m "test1"
[master (root-commit) 2b51ff9] test1
 1 file changed, 2 insertions(+)
 create mode 100644 test.txt
 -m:描述
 4.查看git状态：
 [root@client testgit]# git status 
# On branch master   #分支位于master
5.修改文件后再此查看状态：
[root@client testgit]# echo '1122334' >> test.txt
[root@client testgit]# git status
# 位于分支 master
# 尚未暂存以备提交的变更：
#   （使用 "git add <file>..." 更新要提交的内容）
#   （使用 "git checkout -- <file>..." 丢弃工作区的改动）
#
#	修改：      readme.txt
#
修改尚未加入提交（使用 "git add" 和/或 "git commit "
6.先add
[root@client testgit]# git add -A
8.再次提交commit：
[root@client testgit]# git commit  -m "add2" test.txt 
[master 73bf688] add2
 1 file changed, 1 insertion(+)
 [root@client testgit]# git status 
# On branch master
nothing to commit, working directory clean
```

**版本回退**

```ini
查看现在的版本
[root@client testgit]# git log

回到上一个版本
#一个^代表回退一次，2个^代表回退2此，依此类推……
[root@client testgit]# git reset --hard HEAD^ 
HEAD is now at 0126755 test1
2.回到指定的版本(根据版本号): 
[root@client testgit]# git reset --hard dd66ff
HEAD is now at dd66ff9 add2

==========================================================
注：消失的ID号：可以查看之前的所有的版本
[root@vm20 gittest]# git reflog
```

**删除文件**

从工作区删除test.txt，并且从版本库一起删除

```ini
从工作区删除
[root@client testgit]# rm -rf test.txt 
从版本库删除：
[root@client testgit]# git rm test.txt 
rm 'test.txt'
[root@client testgit]# git commit -m "删除文件test.txt"
[master cebc081] 删除文件test.txt
 1 file changed, 3 deletions(-)
 delete mode 100644 test.txt
```

**将代码上传到仓库的master分支**

```ini
[root@client testgit]# vi a.txt   #创建一个新文件
[root@client testgit]# git add a.txt 
[root@client testgit]# git commit -m "add"
[root@client testgit]# git push origin master   #上传到远程仓库master分支
Counting objects: 11, done.
Compressing objects: 100% (4/4), done.
Writing objects: 100% (11/11), 828 bytes | 0 bytes/s, done.
Total 11 (delta 0), reused 0 (delta 0)
To git@192.168.246.214:/git-test/testgit/
 * [new branch]      master -> master
```

**测试:**

在客户端将仓库删除掉然后在克隆下来查看仓库中是否有文件

```ini
[root@git-client ~]# rm -rf testgit/
[root@client ~]# git clone git@192.168.246.214:/git-test/testgit/
Cloning into 'testgit'...
remote: Counting objects: 11, done.
remote: Compressing objects: 100% (4/4), done.
remote: Total 11 (delta 0), reused 0 (delta 0)
Receiving objects: 100% (11/11), done.
[root@client ~]# cd testgit/
[root@client testgit]# ls
a.txt
[root@client testgit]# cat a.txt 
hello world
```

**创建分支并合并分支**

```ini
[root@client testgit]# ls在客户端操作：
[root@client ~]# git clone git@192.168.246.214:/git-test/testgit/
[root@client testgit]# git status 
# On branch master   #当前所在为master分支
#
# Initial commit
#
nothing to commit (create/copy files and use "git add" to track)

创建分支:
[root@client testgit]# git branch dev   #创建分支。
[root@client testgit]# git branch    #查看分支。*在哪里就表示当前是哪个分支
  dev
* master
切换分支:
[root@client testgit]# git checkout dev
Switched to branch 'dev'
[root@client testgit]# git branch 
* dev
  master
在dev分支创建一个文件；
[root@client testgit]# vi test.txt
[root@client testgit]# git add test.txt 
[root@client testgit]# git commit -m "add dev"
[dev f855bdf] add dev
 1 file changed, 1 insertion(+)
 create mode 100644 test.txt
现在，dev分支的工作完成，我们就可以切换回master分支：
 [root@client testgit]# git checkout master
Switched to branch 'master'

切换回`master`分支后，再查看一个`test.txt`文件，刚才添加的内容不见了！因为那个提交是在`dev`分支上，而`master`分支此刻的提交点并没有变：
[root@client testgit]# ls
a.txt

现在，我们把`dev`分支的工作成果合并到`master`分支上：
[root@client testgit]# git merge dev
Updating 40833e0..f855bdf
Fast-forward
 test.txt | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 test.txt
[root@client testgit]# ls
a.txt  test.txt
现在已经将dev分支的内容合并到master上。确认没有问题上传到远程仓库:
[root@client testgit]# git push origin master

合并完成后，就可以放心地删除`dev`分支了：
[root@client testgit]# git branch -d dev
Deleted branch dev (was f855bdf).

删除后，查看`branch`，就只剩下`master`分支了：
[root@client testgit]# git branch 
* master
```

**2、部署gitlab服务**

**官网下载gitlab地址**

```ini
百度搜索gitlab--点击https://gitlab.com/users/sign_in
拉到最下面--点击 关于 GitLab
再拉到最下面--有个Resources--点击Install--往下拉点击有个cenos 7版本的下载--安装命令步骤操作即可
```

**配置yum源**

```ini
[root@git-server ~]# cd /etc/yum.repos.d/
#配置yum源
[root@git-server yum.repos.d]# vi gitlab-ce.repo
[gitlab-ce]
name=Gitlab CE Repository
baseurl=https://mirrors.tuna.tsinghua.edu.cn/gitlab-ce/yum/el$releasever
gpgcheck=0
enabled=1

#安装相关依赖
[root@git-server yum.repos.d]# yum install -y curl policycoreutils-python openssh-server
[root@git-server yum.repos.d]# systemctl enable sshd
[root@git-server yum.repos.d]# systemctl start sshd

#安装postfix
[root@git-server yum.repos.d]# yum install postfix  #安装邮箱
[root@git-server yum.repos.d]# systemctl enable postfix
[root@git-server yum.repos.d]# systemctl start postfix

#安装的版本，下面那条命令是安装最新版，可能存在不兼容的风险
[root@git-server yum.repos.d]# yum install -y gitlab-ce-13.1.1-ce.0.el7.x86_64  #安装的版本
[root@git-server yum.repos.d]# yum install -y gitlab-ce  #将会安装gitlab最新版本
```

**配置gitlab**

```ini
[root@git-server ~]# vim /etc/gitlab/gitlab.rb
1.# 添加对外的域名（gitlab.papamk.com请添加A记录指向本服务器的公网IP）：将原来的修改为
external_url 'http://192.168.246.214'
2.设置地区
gitlab_rails['time_zone'] = 'Asia/Shanghai'

将数据路径的注释去掉，可以更改
#第501-505行，去除注释
git_data_dirs({
  "default" => {
    "path" => "/mnt/nfs-01/git-data"
   }
})

开启ssh服务:
#第519行，去除注释
gitlab_rails['gitlab_shell_ssh_port'] = 22

开启邮箱服务
#直接在637行开始添加以下内容
gitlab_rails['smtp_enable'] = true  #开启smtp服务
gitlab_rails['smtp_address'] = "smtp.163.com" #指定smtp地址
gitlab_rails['smtp_port'] = 465
gitlab_rails['smtp_user_name'] = "xxxx@163.com"  #指定邮箱
gitlab_rails['smtp_password'] = "邮箱授权密码"
gitlab_rails['smtp_domain'] = "163.com"  #邮箱地址的域
gitlab_rails['smtp_authentication'] = "login" 
gitlab_rails['smtp_enable_starttls_auto'] = true
gitlab_rails['smtp_tls'] = true
gitlab_rails['smtp_openssl_verify_mode'] = 'none'
gitlab_rails['gitlab_email_from'] = 'xxxx@163.com' #指定发件邮箱
gitlab_rails['gitlab_email_display_name'] = 'Admin' #指定发件人
#user["git_user_email"] = "xxxx@163.com"
```

**重置并启动GitLab执行:**

```ini
[root@git-server ~]# gitlab-ctl reconfigure   #重新加载，需要等很长时间
```

**启动**

```ini
[root@git-server ~]# gitlab-ctl restart  #启动
```

**邮箱测试**

```ini
[root@git-server ~] # gitlab-rails console	#进入终端

#开始测试
irb(main):001:0> Notify.test_email('xxxx@qq.com', 'Message Subject', 'Message Body').deliver_now #测试发送邮件是否成功
```

**测试web页面访问**

```ini
输入IP地址，直接访问，会出来一个界面，它默认用户是root，直接输入密码就可以（设置密码）
```

**在服务器通过在git客户端**

```ini
[root@client ~]# git clone git@192.168.246.214:root/testapp.git
Cloning into 'testapp'...
remote: Enumerating objects: 6, done.
remote: Counting objects: 100% (6/6), done.
remote: Compressing objects: 100% (4/4), done.
remote: Total 6 (delta 0), reused 0 (delta 0)
Receiving objects: 100% (6/6), done.
[root@client ~]# ls
testapp
[root@client ~]# cd testapp/
[root@client testapp]# ls
test.txt  同步时间.txt
[root@client testapp]#

注意:如果克隆不下来可以重新使用命令生成私钥
[root@client ~]# ssh-keygen -t rsa #然后将公钥添加到gitlab中。

使用http的
[root@client ~]# rm -rf testgit/
[root@client ~]# git clone http://192.168.246.214/root/testapp.git
Cloning into 'testapp'...
Username for 'http://192.168.246.214': root
Password for 'http://root@192.168.246.214':12345678  #为自己设置的密码
remote: Enumerating objects: 6, done.
remote: Counting objects: 100% (6/6), done.
remote: Compressing objects: 100% (4/4), done.
remote: Total 6 (delta 0), reused 0 (delta 0)
Unpacking objects: 100% (6/6), done.
[root@client ~]# ls
testapp

提交到远程gitlab仓库
[root@client ~]# cd testapp/
[root@client testapp]# vi update.txt
1000phone
[root@client testapp]# git add .
[root@client testapp]# git commit -m 'updata-test'
[root@client testapp]# git push origin master
Counting objects: 4, done.
Compressing objects: 100% (2/2), done.
Writing objects: 100% (3/3), 266 bytes | 0 bytes/s, done.
Total 3 (delta 1), reused 0 (delta 0)
To git@192.168.153.156:root/testapp.git
   4f35d4b..a0067ea  master -> master
```

**Gitlab 备份与恢复**

**1、查看系统版本和软件版本**

```ini
[root@git-server ~]# cat /etc/redhat-release 
CentOS Linux release 7.4.1708 (Core)

[root@git-server ~]# cat /opt/gitlab/embedded/service/gitlab-rails/VERSION
13.1.1
```

**2、数据备份**

```ini
打开/etc/gitlab/gitlab.rb配置文件，查看一个和备份相关的配置项：
vim /etc/gitlab/gitlab.rb
gitlab_rails['backup_path'] = "/var/opt/gitlab/backups"	#备份的路径
gitlab_rails['backup_archive_permissions'] = 0644		#备份文件的默认权限
gitlab_rails['backup_keep_time'] = 604800				#保留时长，秒为单位

# 重启
[root@git-server ~]# gitlab-ctl reconfigure
或者
[root@git-server ~]# gitlab-ctl  restart

# 执行备份命令进行备份
[root@git-server ~]# /opt/gitlab/bin/gitlab-rake gitlab:backup:create

也可以添加到 crontab -e 中定时执行：
0 2 * * * /opt/gitlab/bin/gitlab-rake gitlab:backup:create 

备份完成，会在备份目录中生成一个当天日期的tar包。
[root@git-server ~]# ls /var/opt/gitlab/backups/
1588774133_2020_05_06_12.10.3_gitlab_backup.tar
```

**数据恢复**

**特别注意：**

`备份目录和gitlab.rb中定义的备份目录必须一致`
`GitLab的版本和备份文件中的版本必须一致，否则还原时会报错`

**在恢复之前，可以删除一个文件，以便查看效果**

**执行恢复操作：**

```ini
[root@git-server ~]# cd /var/opt/gitlab/backups/
[root@git-server backups]# gitlab-rake gitlab:backup:restore BACKUP=1588774133_2020_05_06_12.10.3
注意恢复文件的名称

# 中途会输入2次yes

恢复完成后，或者重启服务，再打开浏览器进行访问，发现数据和之前的一致：
[root@git-server backups]# gitlab-ctl  restart
```

