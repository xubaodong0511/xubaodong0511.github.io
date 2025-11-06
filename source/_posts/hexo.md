---
title: hexo
author: Mr.xu
date: 2025-01-17 20:15:21
tags: [linux, hexo]
---

博客搭建教程视频地址：https://www.bilibili.com/video/BV1nY6xYmEw7?buvid=YD44F3D7CA9FF4654EA985A08644F4A38FB0&from_spmid=tm.recommend.0.0&is_story_h5=false&mid=QY8SLP3aFxWc3ZZhivkAwX8FTQ%2FSZMtL1rElX6M3iMo%3D&plat_id=116&share_from=ugc&share_medium=iphone&share_plat=ios&share_session_id=977D55C6-F8AF-4D06-88FF-5BF8DBEDBED8&share_source=COPY&share_tag=s_i&spmid=united.player-video-detail.0.0&timestamp=1735960479&unique_k=MFZ2A8W&up_id=258944527&vd_source=2faa5edeffeb71a8abb2307ca70fa880
1、环境准备
```bash
nodejs-18以上，git
# 验证
node -v
npm -v
```

2、安装hexo客户端
```
hexo是一个静态的博客框架，托管与gitee
# 更换为国内的npm源
npm config set registry https://registry.npmmirror.com
```
# 安装hexo客户端
```
npm install -g hexo-cli
```
# 使用hexo初始化一个文件夹，名字可以自定义，用于存放博客文章的文件夹
```
hexo init my-blog
```
# 安装依赖包
```
cd my-blog
npm install 
```
# 前期准备完成，install完后会生成以下文件
```
[root@localhost my-blog]# ls
_config.fluid.yml      _config.yml  node_modules  package-lock.json  README.en.md  scaffolds  themes
_config.landscape.yml  db.json      package.json  public             README.md     source
```

3、配置文件简介
```
_config.yaml：主文件夹，有博客名，作者等信息
source/_posts：用于存放我们文章的目录
themes：目录下存放的的博客的主题配置文件
```
4、启动hexo
```
# 启动预览博客页面
hexo generate && hexo server
```
# 会生成个登入地址，用于在页面访问
```
http://localhost:4000/ 
```
5、创建gitee/githup仓库
```
# gitee创建blog仓库

# 初始化
git init
# 设置远程仓库
git remote add origin git@github.com:xubaodong0511/xubaodong0511.github.io.git
# 更换远程仓库的命令
git remote set-url origin git@github.com:xubaodong0511/blog.io.git
# 验证在哪个远程仓库
git remote -v

# github上配置ssh密钥的时候需要在服务器上创建config文件，将以下内容添加到config文件中并保存
Host github.com
  Hostname ssh.github.com
  Port 443
# 拉取、推送文件
git clone git@github.com:xubaodong0511/blog.io.git
git push -u origin main --force
```
6、修改配置文件
```
# 修改_config.yml文件，在末尾添加
deploy:
  type: ''
  # 添加以下两行，git@gitee.com:gitee用户名/仓库名.git，branch指定分支
  repository: git@github.com:xubaodong0511/xubaodong0511.github.io.git
  branch: main
                   
注释：使用cursor运行hexo时会有管理员权限问题
解决：退出重新以管理员身份运行，并执行`Set-ExecutionPolicy RemoteSigned`，如果有选择输入Y
```
7、创建、及发布文章
```
# 创建名为第一篇博客名的文章
[root@localhost my-blog]# hexo new post 我的第一篇博客
INFO  Validating config
INFO  Created: ~/my-blog/source/_posts/我的第一篇博客.md
```
# 安装hexo-git插件
```
npm install hexo-deployer-git --save
```
# 发布文章
```
hexo clean && hexo generate && hexo deploy
或
hexo c && hexo g && hexo d
```
8、cloudflare托管网站，域名代理
```
# 点击worker和pages
# 选择pages
# 点击连接到git
# 选择githup或gitee
# 选第二个，only select repositories(选择仓库)
# 授权
# 确认仓库，开始设置
# 确认分支，保存设置开始部署
# 继续处理项目
# 自定义域
```
9、设置主题
```
githup上搜索hexo-theme-fluid
或直接打开以下地址
https://github.com/fluid-dev/hexo-theme-fluid?tab=readme-ov-file

方式一：
# Hexo 5.0.0 版本以上，推荐通过 npm 直接安装，进入博客目录执行命令：
npm install --save hexo-theme-fluid
然后在博客目录下创建 _config.fluid.yml，将主题的 _config.yml 内容复制进去。
方式二：
# 修改 Hexo 博客目录中的 _config.yml：
theme: fluid  # 指定主题
language: zh-CN  # 指定语言，会影响主题显示的语言，按需修改
```
# 主题配置
```
# 创建「关于页」，首次使用主题的「关于页」需要手动创建：
hexo new page about
创建成功后，编辑博客目录下 /source/about/index.md，添加 layout 属性。
修改后的文件示例如下：
---
title: about
layout: about
---
```
# 重新启动hexo
```
hexo clean && hexo generate && hexo deploy
```
10、设置文章的标签
```
# 在文字的开头添加以下内容
---
title: gicc升级
date: 2025-01-05
tags: [Linux运维，系统]
---
```
11、增加评论功能
```
# 插件地址
https://github.com/apps/utterances

# 点击install安装

# 选第二个，only select repositories(选择仓库)

# 在githup的blog仓库点settings设置
# 在下面找到Features下的Discussion的选项，选择打勾
# 修改_config.fluid.yml 文件，在最下发添加以下内容
# discuss
post:
  comments:
    enable: true
    type: utterances

utterances:
  repo: xubaodong0511/xubaodong0511.github.io
  issue_term: pathname
  label: utterances
  theme: github-light
  theme_dark: github-dark
  crossorigin: anonymous
```
12、重启hexo
```
# 启动hexo
hexo clean && hexo generate && hexo server
或
nohup hexo clean && hexo generate && hexo server &
```