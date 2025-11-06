---
title: ChatGPT部署
author: Mr.xu
date: 2025-11-06 20:47:53
tags:
---

# 免费使用ChatGPT，网页版部署

- API官网：https://api1.chenjianming.fun
- GitHub官网：https://github.com 
- vercel官网：https://vercel.com

# 登入github，点击搜索chat，点第二个项目

https://github.com/xubaodong0511/ChatGPT-Next-Web

# 点击Fork到自己仓库

https://vercel.com/new/xubaodong0511s-projects

# 打开网站vercel.com

- 点击新建项目
- 可以看到刚刚Fork的仓库
- 点击import导入
- 重新构建一个项目名字，不然不会分配免费的域名
- 点击Environment Variables

# Environment Variables(环境变量)步骤---直接复制下面内容

- BASE_URL
- https://api1.chenjianming.fun
- 点击add

# 创建令牌密钥步骤

- https://api1.chenjianming.fun
- 点击密钥，创建----设置名称，永不过期，设为无限额度
- 提交
- 回到Environment Variables步骤
- OPENAI_API_KEY
- 添加刚刚创建的令牌密钥
- 点击add

# CODE添加密码步骤（可选）

- CODE
- 自己设置一个密码
- add

以上步骤完成点击Deploy构建（大概需要3分钟）

# 构建成功后会自动跳转
- 点击头像
- 点击港创建的项目
- 点击Visit(可以访问了)

# 仓库地址
https://vercel.com/xubaodong0511s-projects/qingfeng
# GPT地址
https://qingfeng-sepia.vercel.app/

# 备注

如果不能访问解决方案

- 点击Settings(设置)
- 点击Domains(域名)
- 添加自己的域名
- add----需要添加两条记录

- TXT记录
  - 在chenjianming.fun----记录----添加----选择类型（TXT）----名称（_vercel）----内容（vc-domain-verify=test.chenjianming.fun,0327a7d9f3fa0d8d135e）
- name记录
  - 类型（CNAME）----名称（自己添加的域名名字）----目标（cname.vercel-dns.com）

