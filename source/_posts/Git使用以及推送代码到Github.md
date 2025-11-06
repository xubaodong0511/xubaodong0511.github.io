---
title: Git使用以及推送代码到Github
author: Mr.xu
date: 2025-01-09 18:51:32
tags: [linux,git,github]
---

# Git使用以及推送代码到Github
GIT使用
创建Github账户。打开 https://github.com 并注册一个新账户。

安装Git。如果您的系统尚未安装Git，则需要先安装它。可以参考Git官方文档以获取更多详细信息。

配置Git用户名和电子邮件地址。在终端或命令提示符窗口中，运行以下命令以设置您的Git用户名和电子邮件地址：

安装git后需要设置github用户名以及邮箱,内容替换成自己的
```
git config --global user.name "Your Name"
git config --global user.email "youremail@example.com"
```
首先要有本地仓库

在Github上创建一个新的代码仓库

从终端命令行中进入本地代码仓库目录，并初始化仓库：
```
git init
```
将您的代码添加到本地仓库缓冲区：
```
git add .
```
为Github分配一个远程仓库：
```
git remote add origin https://github.com/username/repo.git
```
查看本地分支
```
git branch
```
该命令会列出当前本地仓库中存在的所有分支，并用星号标识当前所在的分支。例如，以下是一个示例输出：
```
* main
  feature-1
  feature-2
```
查看远程分支
```
git branch -r
```
创建分支
```
git checkout -b new-branch
```
将本地仓库推送到 GitHub 上，需要使用 git push 命令，并指定远程仓库的名称和分支名称。具体命令如下：
```
git push origin master:master      #例如，将本地的 master 分支推送到 GitHub 上的 origin 仓库的 master 分支
git push <远程仓库名称> <本地分支名称>:<远程分支名称>
```
设置仓库名称
```
git remote add <远程仓库名称> <远程仓库 URL>
```
例如，如果你想要将一个 GitHub 仓库添加到本地仓库，并将其命名为 myrepo，可以使用以下命令：
```
git remote add myrepo https://github.com/username/myrepo.git
```
添加完成后，你就可以使用 git push 命令将本地分支推送到该远程仓库，命令如下：
```
git push myrepo <本地分支名称>:<远程分支名称>
```
删除分支
```
git branch -d <branch-name>
```
其中，branch-name是要删除的分支名称。需要注意的是，如果该分支包含未合并的更改，则删除分支时会出现错误。这时需要使用“-D”选项强制删除分支。

删除远程分支
```
git push origin --delete test
```
切换分支
```
git checkout <branch-name> #其中，“<branch-name>”是要切换到的分支名称。
```
创建新分支并切换到该分支
```
git checkout -b new-feature
```
分支合并
首先，需要切换到要合并的目标分支上，例如：
```
git checkout target-branch
```
然后，使用 git merge 命令将源分支合并到目标分支上，例如：
```
git merge source-branch
```
查看git状态
```
git status
```
比较文件的不同，即暂存区和工作区的差异。
```
git diff
```
连接远程仓库并且命名
您可以使用以下命令在 Git 中为仓库设置名称：
```
git remote add <remote name> <remote repository URL>
```
请将 <remote name> 替换为您想要设置的名称，<remote repository URL> 替换为您的远程仓库的 URL。例如，如果您想将远程仓库的名称设置为 origin，则可以使用以下命令：
```
git remote add origin <remote repository URL>
```
**请注意，这只是将远程仓库的名称设置为 origin，您可以将其替换为您想要的任何名称

重新命名仓库
您可以使用以下命令在 Git 中为仓库重命名
```
git remote rename <old name> <new name>
```
请将 <old name> 替换为您想要重命名的旧名称，<new name> 替换为您想要设置的新名称。例如，如果您想将远程仓库的名称从 origin 改为 new-origin，则可以使用以下命令：
```
git remote rename origin new-origin
```
请注意，这只是将远程仓库的名称从 origin 改为 new-origin，您可以将其替换为您想要的任何名称。

推送到GITHUB
提交你的更改
```
git commit -m "your commit message"
```
拉取远程仓库中最新的更改：
```
git pull origin main
```
推送代码更改到Github仓库：
```
git push origin main    #main是分支，更改到你需要提交的分支也行
```
提交到hero并且对更改进行描述
```
git commit -m "描述"
```
