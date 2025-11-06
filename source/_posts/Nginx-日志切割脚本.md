---
title: Nginx 日志切割脚本实验
author: Mr.xu
date: 2025-11-06 21:08:52
tags:
---

# nginx日志切割脚本
```
[root@nginx-web script]# vim nginx_log.sh
#!/bin/bash
date=`date +%F -d -1day`
log_dir=/var/log/nginx/
log_name=access.log
[ -d $log_dir ] && cd $log_dir || exit 1
[ -f $log_name ] || exit 1
/bin/mv $log_name $log_name.${date}
/usr/sbin/nginx -s reload
tar czf $log_name.${date}.tar.gz $log_name.${date} && rm -rf $log_name_${date}


#delete
cd $log_dir || exit 1
find ./ -mtime +7 -type f -name *.log | xargs rm -rf
```