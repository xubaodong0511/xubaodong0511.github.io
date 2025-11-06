---
title: MySQL全量备份/增量备份脚本
author: Mr.xu
date: 2025-01-07 20:49:48
tags: [study，MySQL]
---

#!/bin/bash
# mysql物理备份脚本
# 每周日进行全量备份，周一到周六进行增量备份，7天为一个周期
# 备份路径、日志路径
```
backup_dir="/backup"
log_dir="/backup/log"
full_backup_dir="/backup/full"
inc_backup_dir="/backup/inc"

log_date=$(date "+%F-%T")
```
# 数据库用户、密码
```
MY_USER=root
MY_PASS=P@ssword1
```
# 判断日志、备份路径是否存在
```
[ -d $backup_dir ] || mkdir $backup_dir
[ -d $log_dir ] || mkdir $log_dir
[ -d $full_backup_dir ] || mkdir $full_backup_dir
[ -d $inc_backup_dir ] || mkdir $inc_backup_dir
```
# 全量备份函数
```
full_backup(){
	# 全量备份命令 
	innobackupex --user=$MY_USER --password=$MY_PASS $full_backup_dir
	if [ $? -eq 0 ];then
		echo "${log_date} full backup!!!" >> $log_dir/back.log
	else
		echo "${log_date} full failed!!" >> $log_dir/err.log
	fi
}
```
# 获取上周日的时间,以%Y-%m-%d格式显示
```
sunday=$(date -d "last sunday" +%F)
```
# 获取前一天的时间,以%Y-%m-%d格式显示
```
yesterday=$(date -d "yesterday" +%F)
```
# 增量备份函数
```
inc_backup(){
	# 判断当前时间是否为周一(周一需要去找全量备份，周二到周六找前一天的备份)
	if [ $week_date -eq 1 ];then
		# 查找全量备份的文件路径
		local full_backup_dir=$(find $backup_dir -name ${sunday}*)
		innobackupex --user=$MY_USER --password=$MY_PASS --incremental ${inc_backup_dir} --incremental-basedir=${full_backup_dir}
		# 判断命令是否执行成功,写入日志文件
    	if [ $? -eq 0 ];then
        	echo "${log_date} inc backup!!!" >> $log_dir/back.log
    	else
        	echo "${log_date} inc failed!!" >> $log_dir/err.log
    	fi
	else
		# 查找前一天的文件路径
        local yesterday_backup_dir=$(find $backup_dir -name ${yesterday}*)
        innobackupex --user=$MY_USER --password=$MY_PASS --incremental ${inc_backup_dir} --incremental-basedir=${yesterday_backup_dir}
		# 判断命令是否执行成功,写入日志文件
    	if [ $? -eq 0 ];then
        	echo "${log_date} inc backup!!!" >> $log_dir/back.log
    	else
        	echo "${log_date} inc failed!!" >> $log_dir/err.log
    	fi
	fi
}
```
# 查看当前是周几
```
week_date=$(date +%u)
```
# 判断当前是周几，周日则执行全量备份，周一到周六执行增量备份
```
if [ $week_date -eq 7 ];then
	full_backup
else
	inc_backup	
fi
```