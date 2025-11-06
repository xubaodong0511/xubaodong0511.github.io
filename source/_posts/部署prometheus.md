---
title: 部署prometheus
author: Mr.xu
date: 2025-11-05 22:09:49
tags:
---

# 部署prometheus

## 一、准备环境

| 主机名 |      IP       | 配置 |
| :----: | :-----------: | :--: |
| client | 10.100.40.185 |      |
| agent  | 10.100.40.171 |      |
| agent  |               |      |

## 二、部署prometheus

### 1、下载地址

```shell
wget prometheus-2.47.2.linux-amd64.tar.gz

官网地址
https://prometheus.io/download/
```

### 2、创建目录

```shell
mkdir -pv /data/pormetheus/{data,soft,lag}
```

### 3、解压安装包

```shell
tar xzf prometheus-2.47.2.linux-amd64.tar.gz -C /data/prometheus/soft
```

#### 做个软连接，方便操作

```shell
cd /data/prometheus/soft
ln -sv prometheus-2.47.2.linux-amd64 prometheus
```

## 三、启动

```shell
在/data/prometheus/soft/prometfeus目录下启动
nohup ./prometheus &
```

## 四、检查，并查看

```shell
netstat -lnpt		#查看9090端口有没有

浏览器访问
http://IP + 9090
```

![image-20240707100611303](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707100611303.png)

## 五、配置systemctl启动文件

### 1、编辑启动项

```shell
vim /etc/systemd/system/prometheus-server.service

[Unit]
Description=xinjizhiwa Prometheus Server
Documentation=https://prometheus.io/docs/introduction/overview/
After=network.target

[Service]
Restart=on-failure
ExecStart=/data/prometheus/soft/prometheus/prometheus \
    --config.file=/data/prometheus/soft/prometheus/prometheus.yml \
    --web.enable-lifecycle
ExecReload=/bin/kill -HUP \$MAINPID
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target

```

### 2、重新加载systemctl

```shell
systemctl daemon-reload
systemctl enable --now prometheus-server.serivce
```

### 3、重新加载prometfeus

```shell
systemctl reload prometheus-server.service

#如果不管用，则使用下面的命令
curl -X POST http://本机IP:9090/-/reload
```

# 部署被监控节点node-exporter

## 一、部署node节点

### 1、下载地址

```shell
wget node_exporter-1.8.1.linux-amd64.tar.gz
```

### 2、创建目录

```shel
mkdir -pv /data/node_export/{data,soft,logs}
```

### 3、解压

```shell
tar xzf node_exporter-1.8.1.linux-amd64 -C /data/prometfeus/soft
```

### 4、创建软链接

```shell
 ln -sv /node-export/soft/node_exporter-1.6.1.linux-amd64 /node-export/soft/node-exporter
```

### 5、配置启动项

```shell
vim /etc/systemd/system/node-exporter.service

[Unit]
Description=xinjizhiwa node-exporter
Documentation=https://prometheus.io/docs/introduction/overview/
After=network.target

[Service]
Restart=on-failure
ExecStart=/data/node-export/soft/node-exporter/node_exporter
ExecReload=/bin/kill -HUP \$MAINPID
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target

```

### 6、重新加载systemd启动

```shell
systemctl daemon-reload
systemctl enable --now node-exporter.service 
```

### 7、检查，并查看

```shlel
netstat -lnpt		#查看端口9100有么有起来

浏览器
http://IP +9100
```

![image-20240707102747085](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707102747085.png)

## 二、配置prometheus收集node-exporter采集数据

### 1、在prometheus上操作，配置node节点的信息

```shell
 vim /data/prometheus/soft/prometheus/prometheus.yml 
 
   #抓取监控的间隔时间，多长时间获取一次数据（生产环境，建议15-30s）；
  scrape_interval: 3s
  #多久读一次规则
  evaluation_interval: 15s

#先不解释，之后会讲
alerting:
  alertmanagers:
    - static_configs:
        - targets:
          # - alertmanager:9093

#先不讲，之后会讲
rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

#被监控的配置
scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]
  #另起一个job名称，被监控的主体自定义名称
  - job_name: "node-exporter"		#名字可以自定义
    static_configs:
      #被监控的数据抓取地址；
      - targets: ["10.0.0.41:9100"]		#填被监控节点的IP和端口

```

### 2、重新加载prometheus服务

```shell
curl -X POST http://IP:9090/-/reload

此时刷新页面，就可以看到node节点的信息了
```

3、PromeQL语句查询

![](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707103527708.png)

```shell
up #代表查看所有被监控节点是否存活

1表示存活；

0表示存活；
```

![image-20240707103558165](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707103558165.png)

![image-20240707103635031](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707103635031.png)

![image-20240707103656865](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707103656865.png)

# 部署grafana

### 1、下载地址

```shell
wget grafana-enterprise-11.1.0-1.x86_64.rpm

官网地址
https://grafana.com/grafana/dashboards/
```

### 2、移动到prometfeus的soft目录下，好管理

```shell
mv /root/grafana-enterprise-11.1.0-1.x86_64.rpm /data/prometfeus/soft
```

3、安装grafana

```shell
yum -y localinstall grafana-enterprise-11.1.0-1.x86_64.rpm

或
yum install -y fontconfig
rpm -ivh grafana-enterprise-11.1.0-1.x86_64.rpm
```

4、启动

```shell
systemctl enable --now grafana-server.service
```

5、检查，并查看

```
netstat -lnpt		#查看3000端口有没有

浏览器访问
http://IP + 3000
默认账号密码： admin/admin
```

![image-20240707104421113](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707104421113.png)

### 3、配置数据源

```shell
【home】-【adminstration】-【data sources】-【add  data-sources】-【prometheus】
```

![image-20240707104530460](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707104530460.png)

![image-20240707104552366](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707104552366.png)

![image-20240707104606770](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707104606770.png)

![image-20240707104619454](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707104619454.png)

![image-20240707104639259](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707104639259.png)

### 4、新建仪表盘

```shell
【home】-【dashboards】-【new】-【new  folder】
```

![image-20240707104725376](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707104725376.png)

![image-20240707104739176](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707104739176.png)

![image-20240707104752529](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707104752529.png)

### 5、创建一个新的folder

![image-20240707104821412](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707104821412.png)

```shell
进入目录后，创建仪表盘

【create  dashboard】
```

![image-20240707104846803](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707104846803.png)

```
选择数据源

【Add visualization】
```

![image-20240707104955023](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707104955023.png)

```
选择刚刚添加的数据源
```

![image-20240707105013229](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707105013229.png)

6、测试

```
第一步，测试代码，就是计算一个cpu使用率的PromeQL代码；

测试没问题，就复制；
```

![image-20240707105107524](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707105107524.png)

```shell
写入grafana图形

(1-sum(node_cpu_seconds_total{mode="idle"})/sum(node_cpu_seconds_total))*100
```

![image-20240707105152631](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707105152631.png)

![image-20240707105209270](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707105209270.png)

### 6、下载开源的仪表盘

```
#grafana官网查询dashboard模板id
https://grafana.com/grafana/dashboards
```

![image-20240707105255145](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707105255145.png)

```
Copy ID to clipboard	#复制仪表ID直接使用，需要有网络的情况下使用

Download JSON		#下载json文件，然后上传到prometfeus，支持离线
```

![image-20240707105309914](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707105309914.png)

```shell
上传仪表盘json文件到grafana
【home】-【dashboard】-【new】-【import】
```

![image-20240707105537863](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707105537863.png)

![image-20240707105550579](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707105550579.png)

```
回到自己的dashboard列表可以看到成功了
```

![image-20240707105638228](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707105638228.png)

# grafana的变量

```shell
grafana的下拉列表选项制作-grafana的变量
教程
https://blog.csdn.net/2302_79199605/article/details/136438841?spm=1001.2014.3001.5501
```

# 配置prometheus服务的动态发现

## 一、基于文档的自动发现

### 1、修改prometheus的配置文件

```shell
vim /prometheus/soft/prometheus/prometheus.yml 

#通用设置
global:
  #抓取监控的间隔时间，多长时间获取一次数据（生产环境，建议15-30s）；
  scrape_interval: 3s 
  #多久读一次规则
  evaluation_interval: 15s 

#先不解释，之后会讲
alerting:
  alertmanagers:
    - static_configs:
        - targets:
          # - alertmanager:9093

#先不讲，之后会讲
rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

#被监控的配置
scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]
  #另起一个job名称，被监控的主体自定义名称
  - job_name: "node-exporter01"
    #基于文档自动发现
    file_sd_configs:
      #文档的地址路径
      - files:
          #- /prometheus/soft/prometheus/file-sd.json
          - /data/prometheus/soft/prometheus/file-sd.yaml		#自己定义的发现文档路径

```

### 2、重新加载prometheus服务

```shell
curl -X POST http://IP:9090/-/reload
```

### 3、编辑自动发现文档

```shell
vim /data/prometheus/soft/prometheus/file-sd.yaml
- targets:
    - '10.0.0.41:9100'
  labels:
    xinjizhiwa: prometheus-learn
    office: www.xinjizhiwa.com
```

### 4、刷新浏览器查看

![image-20240707110535539](C:\Users\徐保东\AppData\Roaming\Typora\typora-user-images\image-20240707110535539.png)

# 配置prometheus的数据存储

## 一、本地存储prometheus收集的监控数据

### 1、配置systemctl启动文件

```shell
vim /etc/systemd/system/prometheus-server.service
[Unit]
Description=Prometheus Server
Documentation=https://prometheus.io/docs/introduction/overview/
After=network.target

[Service]
Restart=on-failure
ExecStart=/data/prometheus/softwares/prometheus-2.47.2.linux-amd64/prometheus \
    --config.file=/data/prometheus/softwares/prometheus-2.47.2.linux-amd64/prometheus.yml \
    --web.enable-lifecycle \
    --storage.tsdb.path=/data/prometheus/data/prometheus \
    --storage.tsdb.retention.time=60d \
    --web.listen-address=0.0.0.0:9090 \
    --web.max-connections=4096 \
    --storage.tsdb.retention.size=512MB \
    --query.timeout=10s \
    --query.max-concurrency=20 \
    --log.level=info \
    --log.format=json \
    --web.read-timeout=5m
ExecReload=/bin/kill -HUP $MAINPID
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target


参数说明：
--config.file=/prometheus/softwares/prometheus/prometheus.yml 
    指定prometheus的配置文件。
--web.enable-lifecycle 
    启用web方式热加载。
--storage.tsdb.path="/prometheus/data/prometheus" 
    指定prometheus数据存储路径。如果不指定，则默认其实时的同级目录下。
--storage.tsdb.retention.time="60d" 
    指定prometheus数据存储周期。
--web.listen-address="0.0.0.0:9090" 
    指定prometheus的监听端口。
--web.max-connections=4096 
    指定最大的连接数。
--storage.tsdb.retention.size="512MB" 
    指定prometheus数据块的滚动大小（每到512M缓存，进行一次落盘存储）。
--query.timeout=10s 
    查询数据的超时时间。
--query.max-concurrency=20
    最大并发查询数量。
--log.level=info
    指定日志级别。
--log.format=logfmt
    指定日志格式。
--web.read-timeout=5m
    最大的空闲超时时间。
```

### 3、重新加载systemctl

```shell
systemctl daemon-reload
systemctl restart prometheus-server
```

## 二、prometheus数据远端存储

```shell
这里就不作介绍了
教程
https://blog.csdn.net/2302_79199605/article/details/136467629?spm=1001.2014.3001.5501
```

# 监控的告警通知-alertmanager组件工具

## 1、定义告警规则

修改Prometheus配置文件prometheus.yml,添加以下配置：

```perl
rule_files:
  - /usr/local/prometheus/rules/*.rules			#改成自己的目录，我的是/data目录下

alerting:
  alertmanagers:
    - static_configs:
        - targets:
           - localhost:9093

```

在目录/usr/local/prometheus/rules/下创建告警文件hoststats-alert.rules内容如下：

```shell
groups:
- name: hostStatsAlert
  rules:
  - alert: hostCpuUsageAlert
    expr: sum by (instance) (avg without (cpu) (irate(node_cpu_seconds_total{mode!="idle"}[5m]))) > 0.5
    for: 1m
    labels:
      # 严重性
      severity: warning
    annotations:
      title: cpu飚高告警
      summary: "Instance {{ $labels.instance }} CPU usgae high"
      description: "{{ $labels.instance }} CPU usage above 50% (current value: {{ $value }})"
  - alert: hostMemUsageAlert
    expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes)/node_memory_MemTotal_bytes > 0.85
    for: 1m
    labels:
      severity: warning
    annotations:
      title: 内存使用率飚高告警
      summary: "Instance {{ $labels.instance }} MEM usgae high"
      description: "{{ $labels.instance }} MEM usage above 85% (current value: {{ $value }})"

```

重启Prometheus后访问Prometheus http:// IP:9090/rules可以查看当前以加载的规则文件

## 2、安装配置prometheus-webhook-dingtalk

```shell
wget https://github.com/timonwong/prometheus-webhook-dingtalk/releases/download/v2.1.0/prometheus-webhook-dingtalk-2.1.0.linux-amd64.tar.gz
tar -zxvf prometheus-webhook-dingtalk-2.1.0.linux-amd64.tar.gz -C /usr/local
mv /usr/local/prometheus-webhook-dingtalk-2.1.0.linux-amd64 /usr/local/prometheus-webhook-dingtalk
cp /usr/local/prometheus-webhook-dingtalk/config.example.yml  /usr/local/prometheus-webhook-dingtalk/config.yml
vim config.yml      # 将配置文件修改成下面这样

```

```shell
## Request timeout
# timeout: 5s
 
## Uncomment following line in order to write template from scratch (be careful!)
#no_builtin_template: true
 
## Customizable templates path
templates:
  - contrib/templates/mytemplate.tmpl # 这里指向你生成的模板
 
## You can also override default template using `default_message`
## The following example to use the 'legacy' template from v0.3.0
#default_message:
#  title: '{{ template "legacy.title" . }}'
#  text: '{{ template "legacy.content" . }}'
 
## Targets, previously was known as "profiles"
targets:
  webhook1:
    # 钉钉机器人的webhook, 是从钉钉机器人中获取的值
    url: https://oapi.dingtalk.com/robot/send?access_token=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    # secret for signature 加签后得到的值， 机器人的加签
    # secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
#  webhook2:
#    url: https://oapi.dingtalk.com/robot/send?access_token=xxxxxxxxxxxx
#  webhook_legacy:
#    url: https://oapi.dingtalk.com/robot/send?access_token=xxxxxxxxxxxx
#    # Customize template content
#    message:
#      # Use legacy template
#      title: '{{ template "legacy.title" . }}'
#      text: '{{ template "legacy.content" . }}'
#  webhook_mention_all:
#    url: https://oapi.dingtalk.com/robot/send?access_token=xxxxxxxxxxxx
#    mention:
#      all: true
#  webhook_mention_users:
#    url: https://oapi.dingtalk.com/robot/send?access_token=xxxxxxxxxxxx
#    mention:
#      mobiles: ['156xxxx8827', '189xxxx8325']

```

```shell
# 添加如下模板，模板中需要有prometheus添加的 Annotations中需要title、description；Labels中需要有severity
vim /usr/local/prometheus-webhook-dingtalk/contrib/templates/mytemplate.tmpl

cd /usr/local/prometheus-webhook-dingtalk/

./prometheus-webhook-dingtalk --config.file=config.yml >dingtalk.log 2>&1 &

```

```shell
{{ define "__subject" }}
[{{ .Status | toUpper }}{{ if eq .Status "firing" }}:{{ .Alerts.Firing | len }}{{ end }}]
{{ end }}
 
 
{{ define "__alert_list" }}{{ range . }}
---
{{ if .Labels.owner }}@{{ .Labels.owner }}{{ end }}

**告警名称**: {{ index .Annotations "title" }} 
 
**告警级别**: {{ .Labels.severity }} 
 
**告警主机**: {{ .Labels.instance }} 
 
**告警信息**: {{ index .Annotations "description" }}
 
**告警时间**: {{ dateInZone "2006.01.02 15:04:05" (.StartsAt) "Asia/Shanghai" }}
{{ end }}{{ end }}
 
{{ define "__resolved_list" }}{{ range . }}
---
{{ if .Labels.owner }}@{{ .Labels.owner }}{{ end }}
 
**告警名称**: {{ index .Annotations "title" }}
 
**告警级别**: {{ .Labels.severity }}
 
**告警主机**: {{ .Labels.instance }}
 
**告警信息**: {{ index .Annotations "description" }}
 
**告警时间**: {{ dateInZone "2006.01.02 15:04:05" (.StartsAt) "Asia/Shanghai" }}
 
**恢复时间**: {{ dateInZone "2006.01.02 15:04:05" (.EndsAt) "Asia/Shanghai" }}
{{ end }}{{ end }}
 
 
{{ define "default.title" }}
{{ template "__subject" . }}
{{ end }}
 
{{ define "default.content" }}
{{ if gt (len .Alerts.Firing) 0 }}
**====侦测到{{ .Alerts.Firing | len  }}个故障====**
{{ template "__alert_list" .Alerts.Firing }}
---
{{ end }}
 
{{ if gt (len .Alerts.Resolved) 0 }}
**====恢复{{ .Alerts.Resolved | len  }}个故障====**
{{ template "__resolved_list" .Alerts.Resolved }}
{{ end }}
{{ end }}
 
 
{{ define "ding.link.title" }}{{ template "default.title" . }}{{ end }}
{{ define "ding.link.content" }}{{ template "default.content" . }}{{ end }}
{{ template "default.title" . }}
{{ template "default.content" . }}

```

## 3、安装配置prometheus-alertmanager

```shell
wget https://github.com/prometheus/alertmanager/releases/download/v0.25.0/alertmanager-0.25.0.linux-amd64.tar.gz
tar -zxvf alertmanager-0.25.0.linux-amd64.tar.gz 
mv alertmanager-0.25.0.linux-amd64 /usr/local/alertmanager
# 修改告警管理的配置文件如下
vim /usr/local/alertmanager/alertmanager.yml
cd /usr/local/alertmanager/
./alertmanager --config.file=alertmanager.yml >alertmanager.log 2>&1 &

```

```shell
global:
  #每一分钟检查一次是否恢复
  resolve_timeout: 5m
route:
  #采用哪个标签来作为分组依据
  group_by: ['alertname']
  #组告警等待时间。也就是告警产生后等待10s，如果有同组告警一起发出
  group_wait: 10s
  #两组告警的间隔时间
  group_interval: 1m
  #重复告警的间隔时间，减少相同告警的发送频率
  repeat_interval: 1m
  #设置默认接收人
  receiver: 'web.hook'
  routes:
  - receiver: 'dingding.webhook1'
    match_re:
      alertname: ".*"
receivers:
- name: 'web.hook'
  webhook_configs:
  - url: 'http://127.0.0.1:5001/'
- name: 'dingding.webhook1'
  webhook_configs:
  # 这里的webhook1，根据我们在钉钉告警插件配置文件中targets中指定的值做修改
  - url: 'http://127.0.0.1:8060/dingtalk/webhook1/send'
    send_resolved: true
inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'dev', 'instance']

```

此时，我们可以手动拉高系统的CPU使用率，验证Prometheus的告警流程，在主机上运行以下命令

```
cat /dev/zero>/dev/null
等待告警状态为firing后钉钉群机器人会发出告警信息

连接地址:https://blog.csdn.net/weixin_44223946/article/details/131411062?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522172032212116800213088728%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=172032212116800213088728&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduend~default-1-131411062-null-null.142^v100^pc_search_result_base3&utm_term=prometheus%E5%91%8A%E8%AD%A6%E5%8F%91%E9%80%81%E9%92%89%E9%92%89&spm=1018.2226.3001.4187
```





1、下载工具

```shell
wget https://github.com/prometheus/alertmanager/releases/download/v0.26.0/alertmanager-0.26.0.linux-amd64.tar.gz

tar xf alertmanager-0.26.0.linux-amd64.tar.gz -C /prometheus/softwares/
 
ln -svf /prometheus/softwares/alertmanager-0.26.0.linux-amd64/
```



```shell
教程
https://blog.csdn.net/2302_79199605/article/details/136494677?spm=1001.2014.3001.5501
```

