---
title: k8s部署prometheus
author: Mr.xu
date: 2025-11-05 22:05:23
tags:
---

# k8s部署prometheus

# 终端创建

## 创建namespace

```bash
mkdir -p /home/k8s/monitoring/{node-exporter,k8s,kube-state-metrics,blackbox-exporter,dingtalk,alertmanager,prometheus,grafana}

cd /home/k8s/monitoring

vim namespace.yaml
```

```bash
apiVersion: v1
kind: Namespace
metadata:
  name: monitoring
```

## node-exporter

```bash
vim node-exporter/node-exporter.yaml
```

```bash
apiVersion: v1
kind: Service
metadata:
  name: node-exporter
  namespace: monitoring
  labels:
    app: node-exporter
  annotations:
    prometheus.io/scrape: 'true'
spec:
  selector:
    app: node-exporter
  ports:
  - name: node-exporter
    port: 9100
    protocol: TCP
    targetPort: 9100
  clusterIP: None

---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
  namespace: monitoring
  labels:
    app: node-exporter
spec:
  selector:
    matchLabels:
      app: node-exporter
  template:
    metadata:
      name: node-exporter
      labels:
        app: node-exporter
    spec:
      containers:
      - name: node-exporter
        image: prom/node-exporter:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 9100
          hostPort: 9100
      hostNetwork: true
      hostPID: true
      tolerations:
      - key: node-role.kubernetes.io/master
        operator: Exists
        effect: NoSchedule

```

## k8s组件

## controller-manager

```bash
vim k8s/kube-controller-manager-prometheus-discovery.yaml
```

```bash
apiVersion: v1
kind: Service
metadata:
  name: kube-controller-manager-prometheus-discovery
  namespace: kube-system
  labels:
    component: kube-controller-manager
  annotations:
    prometheus.io/scrape: 'true'
spec:
  selector:
    component: kube-controller-manager
  ports:
  - name: http-metrics
    port: 10252
    targetPort: 10252
    protocol: TCP
  clusterIP: None

```

## kube-scheduler

```bash
vim k8s/kube-scheduler-prometheus-discovery.yaml

```

```bash
apiVersion: v1
kind: Service
metadata:
  name: kube-scheduler-prometheus-discovery
  namespace: kube-system
  labels:
    component: kube-scheduler
  annotations:
    prometheus.io/scrape: 'true'
spec:
  selector:
    component: kube-scheduler
  ports:
  - name: http-metrics
    port: 10251
    protocol: TCP
    targetPort: 10251
  clusterIP: None

```

## kube-proxy

```bash
vim k8s/kube-proxy-prometheus-discovery.yaml

```

```bash
apiVersion: v1
kind: Service
metadata:
  name: kube-proxy-prometheus-discovery
  namespace: kube-system
  labels:
    k8s-app: kube-proxy
  annotations:
    prometheus.io/scrape: 'true'
spec:
  selector:
    k8s-app: kube-proxy
  ports:
  - name: http-metrics
    port: 10249
    protocol: TCP
    targetPort: 10249
  clusterIP: None

```

## kube-state-metrics

```bash
vim kube-state-metrics/rbac.yaml

```

```bash
apiVersion: v1
kind: ServiceAccount
metadata:
  name: kube-state-metrics
  namespace: monitoring
  labels:
    app: kube-state-metrics
 
--- 
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: kube-state-metrics
  labels:
    app: kube-state-metrics
rules:
- apiGroups:
  - ""
  resources:
  - configmaps
  - secrets
  - nodes
  - pods
  - services
  - resourcequotas
  - replicationcontrollers
  - limitranges
  - persistentvolumeclaims
  - persistentvolumes
  - namespaces
  - endpoints
  verbs:
  - list
  - watch
- apiGroups:
  - extensions
  resources:
  - daemonsets
  - deployments
  - replicasets
  - ingresses
  verbs:
  - list
  - watch
- apiGroups:
  - apps
  resources:
  - statefulsets
  - daemonsets
  - deployments
  - replicasets
  verbs:
  - list
  - watch
- apiGroups:
  - batch
  resources:
  - cronjobs
  - jobs
  verbs:
  - list
  - watch
- apiGroups:
  - autoscaling
  resources:
  - horizontalpodautoscalers
  verbs:
  - list
  - watch
- apiGroups:
  - authentication.k8s.io
  resources:
  - tokenreviews
  verbs:
  - create
- apiGroups:
  - authorization.k8s.io
  resources:
  - subjectaccessreviews
  verbs:
  - create
- apiGroups:
  - policy
  resources:
  - poddisruptionbudgets
  verbs:
  - list
  - watch
- apiGroups:
  - certificates.k8s.io
  resources:
  - certificatesigningrequests
  verbs:
  - list
  - watch
- apiGroups:
  - storage.k8s.io
  resources:
  - storageclasses
  - volumeattachments
  verbs:
  - list
  - watch
- apiGroups:
  - admissionregistration.k8s.io
  resources:
  - mutatingwebhookconfigurations
  - validatingwebhookconfigurations
  verbs:
  - list
  - watch
- apiGroups:
  - networking.k8s.io
  resources:
  - networkpolicies
  verbs:
  - list
  - watch
- apiGroups:
  - coordination.k8s.io
  resources:
  - leases
  verbs:
  - list
  - watch
  
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: kube-state-metrics
  labels:
    app: kube-state-metrics
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: kube-state-metrics
subjects:
- kind: ServiceAccount
  name: kube-state-metrics
  namespace: monitoring

```

```bash
vim kube-state-metrics/kube-state-metrics.yaml

```

```bash
apiVersion: v1
kind: Service
metadata:
  name: kube-state-metrics
  namespace: monitoring
  labels:
    app: kube-state-metrics
  annotations:
    prometheus.io/scrape: 'true'
    prometheus.io/http-probe: 'true'
    prometheus.io/http-probe-path: '/healthz'
    prometheus.io/http-probe-port: '8080'
spec:
  selector:
    app: kube-state-metrics
  ports:
  - name: kube-state-metrics
    port: 8080
    protocol: TCP
    targetPort: 8080

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kube-state-metrics
  namespace: monitoring
  labels:
    app: kube-state-metrics
spec:
  replicas: 1
  selector:
    matchLabels:
      app: kube-state-metrics
  template:
    metadata:
      labels:
        app: kube-state-metrics
    spec:
      serviceAccountName: kube-state-metrics
      containers:
      - name: kube-state-metrics
        image: quay.io/coreos/kube-state-metrics:v1.8.0 
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8080
      # Remove nodeSelector and tolerations for random scheduling

```

## blackbox-exporter

```bash
vim blackbox-exporter/config.yaml

```

```bash
apiVersion: v1
kind: ConfigMap
metadata:
  name: blackbox-exporter
  namespace: monitoring
  labels:
    app: blackbox-exporter
data:
  blackbox.yml: |-
    modules:
      http_2xx:
        prober: http
        timeout: 10s
        http:
          valid_http_versions: ["HTTP/1.1", "HTTP/2"]
          valid_status_codes: []
          method: GET
          preferred_ip_protocol: "ip4"
      http_post_2xx:
        prober: http
        timeout: 10s
        http:
          valid_http_versions: ["HTTP/1.1", "HTTP/2"]
          method: POST
          preferred_ip_protocol: "ip4"
      tcp_connect:
        prober: tcp
        timeout: 10s
      icmp:
        prober: icmp
        timeout: 10s
        icmp:
          preferred_ip_protocol: "ip4"

```

```bash
vim blackbox-exporter/blackbox-exporter.yaml

```

```bash
apiVersion: v1
kind: Service
metadata:
  name: blackbox-exporter
  namespace: monitoring
  labels:
    app: blackbox-exporter
  annotations:
    prometheus.io/scrape: 'true'
spec:
  selector:
    app: blackbox-exporter
  ports:
  - name: blackbox
    port: 9115
    protocol: TCP
    targetPort: 9115
    nodePort: 30115
  type: NodePort
  
---  
apiVersion: apps/v1
kind: Deployment
metadata:
  name: blackbox-exporter
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: blackbox-exporter
  template:
    metadata:
      labels:
        app: blackbox-exporter
    spec:
      containers:
      - name: blackbox-exporter
        image: prom/blackbox-exporter:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 9115
        readinessProbe:
          tcpSocket:
            port: 9115
          initialDelaySeconds: 10
          timeoutSeconds: 5
        resources:
          requests:
            memory: 50Mi
            cpu: 100m
          limits:
            memory: 60Mi
            cpu: 200m
        volumeMounts:
        - name: config
          mountPath: /etc/blackbox_exporter
        args:
        - '--config.file=/etc/blackbox_exporter/blackbox.yml'
        - '--web.listen-address=:9115'
      volumes:
      - name: config
        configMap:
          name: blackbox-exporter
      nodeSelector:
        node-role.kubernetes.io/master: ""
      tolerations:
      - key: node-role.kubernetes.io/master
        operator: Exists
        effect: NoSchedule

```

## dingtalk

```bash
vim dingtalk/config.yaml

```

```bash
apiVersion: v1
kind: ConfigMap
metadata:
  name: dingtalk-config
  namespace: monitoring
data:
  config.yml: |-
    targets:
      webhook:
        url: https://oapi.dingtalk.com/robot/send?access_token=xxxxxxxxxxxx             #修改为钉钉机器人的webhook
        mention:
          all: true             #@所有人

```

```bash
vim dingtalk/dingtalk.yaml

```

```bash
apiVersion: v1
kind: Service
metadata:
  name: dingtalk
  namespace: monitoring
  labels:
    app: dingtalk
  annotations:
    prometheus.io/scrape: 'false'
spec:
  selector:
    app: dingtalk
  ports:
  - name: dingtalk
    port: 8060
    protocol: TCP
    targetPort: 8060
  
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dingtalk
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: dingtalk
  template:
    metadata:
      name: dingtalk
      labels:
        app: dingtalk
    spec:
      containers:
      - name: dingtalk
        image: timonwong/prometheus-webhook-dingtalk:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8060
        volumeMounts:
        - name: config
          mountPath: /etc/prometheus-webhook-dingtalk
      volumes:
      - name: config
        configMap:
          name: dingtalk-config

```

## alertmanager

```bash
vim alertmanager/templates.yaml

```

```bash
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-templates
  namespace: monitoring
data:
  default.tmpl: |
    {{ define "__alertmanager" }}AlertManager{{ end }}
    {{ define "__alertmanagerURL" }}{{ .ExternalURL }}/#/alerts?receiver={{ .Receiver }}{{ end }}
    {{ define "__subject" }}[{{ .Status | toUpper }}{{ if eq .Status "firing" }}:{{ .Alerts.Firing | len }}{{ end }}] {{ .GroupLabels.SortedPairs.Values | join " " }} {{ if gt (len .CommonLabels) (len .GroupLabels) }}({{ with .CommonLabels.Remove .GroupLabels.Names }}{{ .Values | join " " }}{{ end }}){{ end }}{{ end }}
    {{ define "__description" }}{{ end }}
    {{ define "__text_alert_list" }}{{ range . }}Labels:
    {{ range .Labels.SortedPairs }} - {{ .Name }} = {{ .Value }}
    {{ end }}Annotations:
    {{ range .Annotations.SortedPairs }} - {{ .Name }} = {{ .Value }}
    {{ end }}Source: {{ .GeneratorURL }}
    {{ end }}{{ end }}
    {{ define "slack.default.title" }}{{ template "__subject" . }}{{ end }}
    {{ define "slack.default.username" }}{{ template "__alertmanager" . }}{{ end }}
    {{ define "slack.default.fallback" }}{{ template "slack.default.title" . }} | {{ template "slack.default.titlelink" . }}{{ end }}
    {{ define "slack.default.pretext" }}{{ end }}
    {{ define "slack.default.titlelink" }}{{ template "__alertmanagerURL" . }}{{ end }}
    {{ define "slack.default.iconemoji" }}{{ end }}
    {{ define "slack.default.iconurl" }}{{ end }}
    {{ define "slack.default.text" }}{{ end }}
    {{ define "hipchat.default.from" }}{{ template "__alertmanager" . }}{{ end }}
    {{ define "hipchat.default.message" }}{{ template "__subject" . }}{{ end }}
    {{ define "pagerduty.default.description" }}{{ template "__subject" . }}{{ end }}
    {{ define "pagerduty.default.client" }}{{ template "__alertmanager" . }}{{ end }}
    {{ define "pagerduty.default.clientURL" }}{{ template "__alertmanagerURL" . }}{{ end }}
    {{ define "pagerduty.default.instances" }}{{ template "__text_alert_list" . }}{{ end }}
    {{ define "opsgenie.default.message" }}{{ template "__subject" . }}{{ end }}
    {{ define "opsgenie.default.description" }}{{ .CommonAnnotations.SortedPairs.Values | join " " }}
    {{ if gt (len .Alerts.Firing) 0 -}}
    Alerts Firing:
    {{ template "__text_alert_list" .Alerts.Firing }}
    {{- end }}
    {{ if gt (len .Alerts.Resolved) 0 -}}
    Alerts Resolved:
    {{ template "__text_alert_list" .Alerts.Resolved }}
    {{- end }}
    {{- end }}
    {{ define "opsgenie.default.source" }}{{ template "__alertmanagerURL" . }}{{ end }}
    {{ define "victorops.default.message" }}{{ template "__subject" . }} | {{ template "__alertmanagerURL" . }}{{ end }}
    {{ define "victorops.default.from" }}{{ template "__alertmanager" . }}{{ end }}
    {{ define "email.default.subject" }}{{ template "__subject" . }}{{ end }}
    {{ define "email.default.html" }}
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <!--
    Style and HTML derived from https://github.com/mailgun/transactional-email-templates
    The MIT License (MIT)
    Copyright (c) 2014 Mailgun
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
    -->
    <html xmlns="http://www.w3.org/1999/xhtml" xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
    <head style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
    <meta name="viewport" content="width=device-width" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
    <title style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">{{ template "__subject" . }}</title>
    </head>
    <body itemscope="" itemtype="http://schema.org/EmailMessage" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; height: 100%; line-height: 1.6em; width: 100% !important; background-color: #f6f6f6; margin: 0; padding: 0;" bgcolor="#f6f6f6">
    <table style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; background-color: #f6f6f6; margin: 0;" bgcolor="#f6f6f6">
      <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;" valign="top"></td>
        <td width="600" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; display: block !important; max-width: 600px !important; clear: both !important; width: 100% !important; margin: 0 auto; padding: 0;" valign="top">
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; max-width: 600px; display: block; margin: 0 auto; padding: 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; border-radius: 3px; background-color: #fff; margin: 0; border: 1px solid #e9e9e9;" bgcolor="#fff">
              <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 16px; vertical-align: top; color: #fff; font-weight: 500; text-align: center; border-radius: 3px 3px 0 0; background-color: #E6522C; margin: 0; padding: 20px;" align="center" bgcolor="#E6522C" valign="top">
                  {{ .Alerts | len }} alert{{ if gt (len .Alerts) 1 }}s{{ end }} for {{ range .GroupLabels.SortedPairs }}
                    {{ .Name }}={{ .Value }}
                  {{ end }}
                </td>
              </tr>
              <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 10px;" valign="top">
                  <table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                    <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                      <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                        <a href="{{ template "__alertmanagerURL" . }}" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; color: #FFF; text-decoration: none; line-height: 2em; font-weight: bold; text-align: center; cursor: pointer; display: inline-block; border-radius: 5px; text-transform: capitalize; background-color: #348eda; margin: 0; border-color: #348eda; border-style: solid; border-width: 10px 20px;">View in {{ template "__alertmanager" . }}</a>
                      </td>
                    </tr>
                    {{ if gt (len .Alerts.Firing) 0 }}
                    <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                      <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                        <strong style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">[{{ .Alerts.Firing | len }}] Firing</strong>
                      </td>
                    </tr>
                    {{ end }}
                    {{ range .Alerts.Firing }}
                    <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                      <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                        <strong style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">Labels</strong><br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                        {{ range .Labels.SortedPairs }}{{ .Name }} = {{ .Value }}<br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />{{ end }}
                        {{ if gt (len .Annotations) 0 }}<strong style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">Annotations</strong><br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />{{ end }}
                        {{ range .Annotations.SortedPairs }}{{ .Name }} = {{ .Value }}<br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />{{ end }}
                        <a href="{{ .GeneratorURL }}" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; color: #348eda; text-decoration: underline; margin: 0;">Source</a><br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                      </td>
                    </tr>
                    {{ end }}
                    {{ if gt (len .Alerts.Resolved) 0 }}
                      {{ if gt (len .Alerts.Firing) 0 }}
                    <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                      <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                        <br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                        <hr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                        <br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                      </td>
                    </tr>
                      {{ end }}
                    <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                      <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                        <strong style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">[{{ .Alerts.Resolved | len }}] Resolved</strong>
                      </td>
                    </tr>
                    {{ end }}
                    {{ range .Alerts.Resolved }}
                    <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                      <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                        <strong style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">Labels</strong><br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                        {{ range .Labels.SortedPairs }}{{ .Name }} = {{ .Value }}<br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />{{ end }}
                        {{ if gt (len .Annotations) 0 }}<strong style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">Annotations</strong><br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />{{ end }}
                        {{ range .Annotations.SortedPairs }}{{ .Name }} = {{ .Value }}<br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />{{ end }}
                        <a href="{{ .GeneratorURL }}" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; color: #348eda; text-decoration: underline; margin: 0;">Source</a><br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                      </td>
                    </tr>
                    {{ end }}
                  </table>
                </td>
              </tr>
            </table>
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; clear: both; color: #999; margin: 0; padding: 20px;">
              <table width="100%" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 12px; vertical-align: top; text-align: center; color: #999; margin: 0; padding: 0 0 20px;" align="center" valign="top"><a href="{{ .ExternalURL }}" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 12px; color: #999; text-decoration: underline; margin: 0;">Sent by {{ template "__alertmanager" . }}</a></td>
                </tr>
              </table>
            </div></div>
        </td>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;" valign="top"></td>
      </tr>
    </table>
    </body>
    </html>
    {{ end }}
    {{ define "pushover.default.title" }}{{ template "__subject" . }}{{ end }}
    {{ define "pushover.default.message" }}{{ .CommonAnnotations.SortedPairs.Values | join " " }}
    {{ if gt (len .Alerts.Firing) 0 }}
    Alerts Firing:
    {{ template "__text_alert_list" .Alerts.Firing }}
    {{ end }}
    {{ if gt (len .Alerts.Resolved) 0 }}
    Alerts Resolved:
    {{ template "__text_alert_list" .Alerts.Resolved }}
    {{ end }}
    {{ end }}
    {{ define "pushover.default.url" }}{{ template "__alertmanagerURL" . }}{{ end }}
  slack.tmpl: |
    {{ define "slack.devops.text" }}
    {{range .Alerts}}{{.Annotations.DESCRIPTION}}
    {{end}}
    {{ end }}

```

```bash
vim alertmanager/config.yaml

```

```bash
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: monitoring
data:
  config.yml: |-
    global:
      resolve_timeout: 5m
      smtp_smarthost: 'smtp.163.com:465'                #邮箱smtp服务器代理，启用SSL发信, 端口一般是465
      smtp_from: 'alert@163.com'                #发送邮箱名称
      smtp_auth_username: 'alert@163.com'               #邮箱名称
      smtp_auth_password: 'password'                #邮箱密码或授权码
      smtp_require_tls: false
    templates:
    - '/etc/templates/*.tmpl'
    route:
      receiver: 'default'
      group_wait: 10s
      group_interval: 1m
      repeat_interval: 1h
      group_by: ['alertname', 'instance', 'cluster', 'service']
      routes:
      - receiver: 'default'
        match:
          severity: 'warning'
      - receiver: 'dingtalk'
        match:
          severity: 'critical'
    inhibit_rules:
    - source_match:
        severity: 'critical'
      target_match:
        severity: 'warning'
      equal: ['alertname', 'instance', 'cluster', 'service']
    receivers:
    - name: 'default'
      email_configs:
      - to: 'receiver@163.com'
        send_resolved: true
    - name: 'dingtalk'
      webhook_configs:
      - url: 'http://dingtalk:8060/dingtalk/webhook/send'
        send_resolved: true

```

```bash
vim alertmanager/alertmanager.yaml

```

```bash
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: alertmanager
  namespace: monitoring
spec:
  rules:
  - host: 10.100.30.70
    http:
      paths:
      - path: /
        backend:
          serviceName: alertmanager
          servicePort: 9093
          
---
apiVersion: v1
kind: Service
metadata:
  name: alertmanager
  namespace: monitoring
  labels:
    name: alertmanager
  annotations:
    prometheus.io/scrape: 'true'
spec:
  selector:
    app: alertmanager
  ports:
  - name: alertmanager
    port: 9093
    protocol: TCP
    targetPort: 9093
    
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: alertmanager
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: alertmanager
  template:
    metadata:
      name: alertmanager
      labels:
        app: alertmanager
    spec:
      containers:
      - name: alertmanager
        image: prom/alertmanager:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 9093
        env:
        - name: POD_IP
          valueFrom:
            fieldRef:
              apiVersion: v1
              fieldPath: status.podIP
        args:
          - "--config.file=/etc/alertmanager/config.yml"
          - "--storage.path=/alertmanager"
          - "--cluster.advertise-address=$(POD_IP):6783"                #没有该参数会报错：Failed to get final advertise address
        volumeMounts:
        - name: config
          mountPath: /etc/alertmanager
        - name: templates
          mountPath: /etc/templates
        - name: alertmanager
          mountPath: /alertmanager
      volumes:
      - name: config
        configMap:
          name: alertmanager-config
      - name: templates
        configMap:
          name: alertmanager-templates
      - name: alertmanager
        emptyDir: {}

```

## prometheus

```bash
vim prometheus/rbac.yaml

```

```bash
apiVersion: v1
kind: ServiceAccount
metadata:
  name: prometheus
  namespace: monitoring

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: prometheus
rules:
- apiGroups: [""]
  resources:
  - nodes
  - nodes/proxy
  - services
  - endpoints
  - pods
  verbs: ["get", "list", "watch"]
- apiGroups: ["networking.k8s.io"]
  resources:
  - ingresses
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources:
  - configmaps
  verbs: ["get"]
- nonResourceURLs: ["/metrics"]
  verbs: ["get"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: prometheus
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: prometheus
subjects:
- kind: ServiceAccount
  name: prometheus
  namespace: monitoring

```

```bash
vim prometheus/config.yaml

```

```bash
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 10s
      scrape_timeout: 10s
      evaluation_interval: 10s
    alerting:
      alertmanagers:
      - static_configs:
        - targets:
          - alertmanager:9093
    rule_files:
      - "/etc/prometheus-rules/*.rules"
    scrape_configs:
      - job_name: 'node-exporter'                #node节点性能指标数据
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        kubernetes_sd_configs:
        - role: endpoints
        relabel_configs:
        - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape, __meta_kubernetes_endpoint_port_name]
          regex: true;node-exporter
          action: keep
        - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scheme]
          action: replace
          target_label: __scheme__
          regex: (https?)
        - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_path]
          action: replace
          target_label: __metrics_path__
          regex: (.+)
        - source_labels: [__address__, __meta_kubernetes_service_annotation_prometheus_io_port]
          action: replace
          target_label: __address__
          regex: (.+)(?::\d+);(\d+)
          replacement: $1:$2
        - action: labelmap
          regex: __meta_kubernetes_service_label_(.+)
        - source_labels: [__meta_kubernetes_namespace]
          action: replace
          target_label: kubernetes_namespace
        - source_labels: [__meta_kubernetes_service_name]
          action: replace
          target_label: kubernetes_name
          
      - job_name: 'kube-apiservers'
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        kubernetes_sd_configs:
        - role: endpoints
        relabel_configs:
        - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
          regex: default;kubernetes;https
          action: keep
        
      - job_name: 'kube-controller-manager'
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        kubernetes_sd_configs:
        - role: endpoints
        relabel_configs:
        - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape, __meta_kubernetes_namespace, __meta_kubernetes_service_name]
          regex: true;kube-system;kube-controller-manager-prometheus-discovery
          action: keep
          
      - job_name: 'kube-scheduler'
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        kubernetes_sd_configs:
        - role: endpoints
        relabel_configs:
        - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape, __meta_kubernetes_namespace, __meta_kubernetes_service_name]
          regex: true;kube-system;kube-scheduler-prometheus-discovery
          action: keep
          
      - job_name: 'kubelet'
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        kubernetes_sd_configs:
        - role: node
        relabel_configs:
        - action: labelmap
          regex: __meta_kubernetes_node_label_(.+)
        - target_label: __address__
          replacement: 192.168.30.188:6443
        - source_labels: [__meta_kubernetes_node_name]
          regex: (.+)
          target_label: __metrics_path__
          replacement: /api/v1/nodes/${1}/proxy/metrics

      - job_name: 'kube-proxy'
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        kubernetes_sd_configs:
        - role: endpoints
        relabel_configs:
        - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape, __meta_kubernetes_namespace, __meta_kubernetes_service_name]
          regex: true;kube-system;kube-proxy-prometheus-discovery
          action: keep

      - job_name: 'kubernetes-cadvisor'                #容器、Pod相关的性能指标数据
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        kubernetes_sd_configs:
        - role: node
        relabel_configs:
        - action: labelmap
          regex: __meta_kubernetes_node_label_(.+)
        - target_label: __address__
          replacement: 192.168.30.188:6443
        - source_labels: [__meta_kubernetes_node_name]
          regex: (.+)
          target_label: __metrics_path__
          replacement: /api/v1/nodes/${1}/proxy/metrics/cadvisor
        metric_relabel_configs:
        - source_labels: [id]
          action: replace
          regex: '^/machine\.slice/machine-rkt\\x2d([^\\]+)\\.+/([^/]+)\.service$'
          target_label: rkt_container_name
          replacement: '${2}-${1}'
        - source_labels: [id]
          action: replace
          regex: '^/system\.slice/(.+)\.service$'
          target_label: systemd_service_name
          replacement: '${1}'
          
      - job_name: 'kube-state-metrics'              #资源对象(Deployment、Pod等)的状态
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        kubernetes_sd_configs:
        - role: endpoints
        relabel_configs:
        - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape, __meta_kubernetes_endpoint_port_name]
          regex: true;kube-state-metrics
          action: keep
        - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scheme]
          action: replace
          target_label: __scheme__
          regex: (https?)
        - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_path]
          action: replace
          target_label: __metrics_path__
          regex: (.+)
        - source_labels: [__address__, __meta_kubernetes_service_annotation_prometheus_io_port]
          action: replace
          target_label: __address__
          regex: (.+)(?::\d+);(\d+)
          replacement: $1:$2
        - action: labelmap
          regex: __meta_kubernetes_service_label_(.+)
        - source_labels: [__meta_kubernetes_namespace]
          action: replace
          target_label: kubernetes_namespace
        - source_labels: [__meta_kubernetes_service_name]
          action: replace
          target_label: kubernetes_name
          
      - job_name: 'kubernetes-service-http-probe'               #通过http方式探测Service状态
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        kubernetes_sd_configs:
        - role: service
        metrics_path: /probe
        params:
          module: [http_2xx]
        relabel_configs:
        - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape, __meta_kubernetes_service_annotation_prometheus_io_http_probe]
          regex: true;true
          action: keep
        - source_labels: [__meta_kubernetes_service_name, __meta_kubernetes_namespace, __meta_kubernetes_service_annotation_prometheus_io_http_probe_port, __meta_kubernetes_service_annotation_prometheus_io_http_probe_path]
          action: replace
          target_label: __param_target
          regex: (.+);(.+);(.+);(.+)
          replacement: $1.$2:$3$4
        - target_label: __address__
          replacement: 192.168.30.128:30115
        - source_labels: [__param_target]
          target_label: instance
        - action: labelmap
          regex: __meta_kubernetes_service_annotation_prometheus_io_app_info_(.+)

      - job_name: 'kubernetes-service-tcp-probe'                #通过tcp方式探测Service状态
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        kubernetes_sd_configs:
        - role: service
        metrics_path: /probe
        params:
          module: [tcp_connect]
        relabel_configs:
        - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape, __meta_kubernetes_service_annotation_prometheus_io_tcp_probe]
          regex: true;true
          action: keep
        - source_labels: [__meta_kubernetes_service_name, __meta_kubernetes_namespace, __meta_kubernetes_service_annotation_prometheus_io_tcp_probe_port]
          action: replace
          target_label: __param_target
          regex: (.+);(.+);(.+)
          replacement: $1.$2:$3
        - target_label: __address__
          replacement: 192.168.30.128:30115
        - source_labels: [__param_target]
          target_label: instance
        - action: labelmap
          regex: __meta_kubernetes_service_annotation_prometheus_io_app_info_(.+)
          
      - job_name: 'kubernetes-ingresses'              #通过http方式探测ingresses状态
        kubernetes_sd_configs:
        - role: ingress
        metrics_path: /probe
        params:
          module: [http_2xx]
        relabel_configs:
        - source_labels: [__meta_kubernetes_ingress_scheme, __address__, __meta_kubernetes_ingress_path]
          regex: (.+);(.+);(.+)
          replacement: ${1}://${2}${3}
          target_label: __param_target
        - target_label: __address__
          replacement: 192.168.30.128:30115
        - source_labels: [__param_target]
          target_label: instance
        - action: labelmap
          regex: __meta_kubernetes_ingress_label_(.+)
        - source_labels: [__meta_kubernetes_namespace]
          target_label: kubernetes_namespace
        - source_labels: [__meta_kubernetes_ingress_name]
          target_label: kubernetes_name

```

```bash
vim prometheus/rules.yaml

```

```bash
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-rules
  namespace: monitoring
data:
  node.rules: |
    groups:
    - name: node
      rules:
      - alert: NodeDown
        expr: up == 0
        for: 3m
        labels:
          severity: critical
        annotations:
          summary: "{{ $labels.instance }}: down"
          description: "{{ $labels.instance }} has been down for more than 3m"
          value: "{{ $value }}"

      - alert: NodeCPUHigh
        expr: (1 - avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m]))) * 100 > 75
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "{{$labels.instance}}: High CPU usage"
          description: "{{$labels.instance}}: CPU usage is above 75%"
          value: "{{ $value }}"

      - alert: NodeCPUIowaitHigh
        expr: avg by (instance) (irate(node_cpu_seconds_total{mode="iowait"}[5m])) * 100 > 50
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "{{$labels.instance}}: High CPU iowait usage"
          description: "{{$labels.instance}}: CPU iowait usage is above 50%"
          value: "{{ $value }}"

      - alert: NodeMemoryUsageHigh
        expr: (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 > 90
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "{{$labels.instance}}: High memory usage"
          description: "{{$labels.instance}}: Memory usage is above 90%"
          value: "{{ $value }}"

      - alert: NodeDiskRootLow
        expr: (1 - node_filesystem_avail_bytes{fstype=~"ext.*|xfs",mountpoint ="/"} / node_filesystem_size_bytes{fstype=~"ext.*|xfs",mountpoint ="/"}) * 100 > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "{{$labels.instance}}: Low disk(the / partition) space"
          description: "{{$labels.instance}}: Disk(the / partition) usage is above 80%"
          value: "{{ $value }}"
        
      - alert: NodeDiskBootLow
        expr: (1 - node_filesystem_avail_bytes{fstype=~"ext.*|xfs",mountpoint ="/boot"} / node_filesystem_size_bytes{fstype=~"ext.*|xfs",mountpoint ="/boot"}) * 100 > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "{{$labels.instance}}: Low disk(the /boot partition) space"
          description: "{{$labels.instance}}: Disk(the /boot partition) usage is above 80%"
          value: "{{ $value }}"

      - alert: NodeLoad5High
        expr: (node_load5) > (count by (instance) (node_cpu_seconds_total{mode='system'}) * 2)
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "{{$labels.instance}}: Load(5m) High"
          description: "{{$labels.instance}}: Load(5m) is 2 times the number of CPU cores"
          value: "{{ $value }}"

```

```bash
vim prometheus/prometheus.yaml

```

```bash
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: prometheus
  namespace: monitoring
spec:
  rules:
  - host: prometheus.lzxlinux.cn
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: prometheus
            port:
              number: 9090

---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: monitoring
  labels:
    app: prometheus
  annotations:
    prometheus.io/scrape: 'true'
spec:
  selector:
    app: prometheus
  ports:
  - name: prometheus
    port: 9090
    protocol: TCP
    targetPort: 9090

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: monitoring
  labels:
    app: prometheus
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      serviceAccountName: prometheus
      containers:
      - name: prometheus
        image: prom/prometheus:latest
        imagePullPolicy: IfNotPresent
        args:
          - '--storage.tsdb.path=/prometheus'
          - '--storage.tsdb.retention.time=30d'
          - '--config.file=/etc/prometheus/prometheus.yml'
        ports:
        - containerPort: 9090
        resources:
          requests:
            cpu: 500m
            memory: 500M
          limits:
            cpu: 500m
            memory: 500M
        volumeMounts:
        - name: config
          mountPath: /etc/prometheus
        - name: rules
          mountPath: /etc/prometheus-rules
        - name: prometheus
          mountPath: /prometheus
      volumes:
      - name: config
        configMap:
          name: prometheus-config
      - name: rules
        configMap:
          name: prometheus-rules
      - name: prometheus
        emptyDir: {}
      nodeSelector:
        node-role.kubernetes.io/master: ""
        kubernetes.io/hostname: "master2"
      tolerations:
      - key: node-role.kubernetes.io/master
        operator: Exists
        effect: NoSchedule

```

## grafana

```bash
vim grafana/secret.yaml

```

```bash
apiVersion: v1
kind: Secret
metadata:
  name: grafana
  namespace: monitoring
data:
  admin-password: YWRtaW4=              # base64 加解密
  admin-username: YWRtaW4=
type: Opaque

```

```bash
vim grafana/grafana.yaml

```

```bash
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: monitoring
  labels:
    app: grafana
  annotations:
    prometheus.io/scrape: 'true'
    prometheus.io/path: '/metrics'
spec:
  type: NodePort
  selector:
    app: grafana
  ports:
  - name: grafana
    port: 3000
    protocol: TCP
    targetPort: 3000
    nodePort: 32000  # 确保这个端口在你的范围内

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: monitoring
  labels:
    app: grafana
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
      - name: grafana
        image: grafana/grafana:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 3000
          name: grafana
        resources:
          limits:
            cpu: 100m
            memory: 100Mi
          requests:
            cpu: 100m
            memory: 100Mi
        env:
          - name: GF_AUTH_BASIC_ENABLED
            value: "true"
          - name: GF_AUTH_ANONYMOUS_ENABLED
            value: "false"
          - name: GF_AUTH_ANONYMOUS_ORG_ROLE
            value: Admin
          - name: GF_DASHBOARDS_JSON_ENABLED
            value: "true"
          - name: GF_INSTALL_PLUGINS
            value: grafana-kubernetes-app
          - name: GF_SECURITY_ADMIN_USER
            valueFrom:
              secretKeyRef:
                name: grafana
                key: admin-username
          - name: GF_SECURITY_ADMIN_PASSWORD
            valueFrom:
              secretKeyRef:
                name: grafana
                key: admin-password
        readinessProbe:
          httpGet:
            path: /login
            port: 3000
          initialDelaySeconds: 10
          timeoutSeconds: 5
        volumeMounts:
        - name: grafana-storage
          mountPath: /var/lib/grafana
      volumes:
      - name: grafana-storage
        emptyDir: {}

```

## 部署

```bash
kubectl apply -f namespace.yaml

kubectl apply -f node-exporter/

kubectl apply -f k8s/

kubectl apply -f kube-state-metrics/

kubectl apply -f blackbox-exporter/

kubectl apply -f dingtalk/

kubectl apply -f alertmanager/

kubectl apply -f prometheus/

kubectl apply -f grafana/

```

## 查看

```bash
kubectl get all -n monitoring

NAME                                      READY   STATUS    RESTARTS   AGE
pod/alertmanager-9c4bf8565-z9mp9          1/1     Running   0          2m54s
pod/blackbox-exporter-57d847fc4c-mq8mx    1/1     Running   0          2m58s
pod/dingtalk-957f5896-9bd9b               1/1     Running   0          2m56s
pod/grafana-76779dc8cf-2fk4x              1/1     Running   0          2m46s
pod/kube-state-metrics-5d5f7cd774-tw4sw   1/1     Running   0          2m58s
pod/node-exporter-29bkg                   1/1     Running   0          3m5s
pod/node-exporter-45k2d                   1/1     Running   0          3m5s
pod/node-exporter-8dbts                   1/1     Running   0          3m5s
pod/node-exporter-9kwwt                   1/1     Running   0          3m5s
pod/node-exporter-bxhcf                   1/1     Running   0          3m5s
pod/prometheus-65848cf9b4-m5kcf           1/1     Running   0          2m49s

NAME                         TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
service/alertmanager         ClusterIP   10.98.52.72      <none>        9093/TCP         2m55s
service/blackbox-exporter    NodePort    10.106.73.127    <none>        9115:30115/TCP   2m58s
service/dingtalk             ClusterIP   10.103.205.136   <none>        8060/TCP         2m57s
service/grafana              ClusterIP   10.103.12.113    <none>        3000/TCP         2m47s
service/kube-state-metrics   ClusterIP   10.98.99.215     <none>        8080/TCP         3m1s
service/node-exporter        ClusterIP   None             <none>        9100/TCP         3m6s
service/prometheus           ClusterIP   10.99.50.109     <none>        9090/TCP         2m51s

NAME                           DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
daemonset.apps/node-exporter   5         5         5       5            5           <none>          3m5s

NAME                                 READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/alertmanager         1/1     1            1           2m55s
deployment.apps/blackbox-exporter    1/1     1            1           2m58s
deployment.apps/dingtalk             1/1     1            1           2m57s
deployment.apps/grafana              1/1     1            1           2m46s
deployment.apps/kube-state-metrics   1/1     1            1           3m
deployment.apps/prometheus           1/1     1            1           2m51s

NAME                                            DESIRED   CURRENT   READY   AGE
replicaset.apps/alertmanager-9c4bf8565          1         1         1       2m55s
replicaset.apps/blackbox-exporter-57d847fc4c    1         1         1       2m58s
replicaset.apps/dingtalk-957f5896               1         1         1       2m56s
replicaset.apps/grafana-76779dc8cf              1         1         1       2m46s
replicaset.apps/kube-state-metrics-5d5f7cd774   1         1         1       3m
replicaset.apps/prometheus-65848cf9b4           1         1         1       2m51s

```

## grafana模板

`8919`

## grafana配置kubernetes数据源

`启动插件：plugins--kubeernetes--enable`，然后配置集群访问地址及访问证书

`如果是通过kubeadm方式搭建的k8s集群，会有一个/etc/kubernetes/admin.conf文件，里面包含了客户端的证书和密码base64编码`

```bash
cat /etc/kubernetes/admin.conf

```

```bash
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUN5RENDQWJDZ0F3SUJBZ0lCQURBTkJna3Foa2lHOXcwQkFRc0ZBREFWTVJNd0VRWURWUVFERXdwcmRXSmwKY201bGRHVnpNQjRYRFRJd01EVXhNakV3TURBek1Gb1hEVE13TURVeE1ERXdNREF6TUZvd0ZURVRNQkVHQTFVRQpBeE1LYTNWaVpYSnVaWFJsY3pDQ0FTSXdEUVlKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTDVpCmYxTGcxUUlqN0VlWlZ0cVFmS3dGZjg4V3NVbVVialZldll5NDZTUittMWpwRWdvM2wxWEIvZHBFNzRWOGtqTGQKZkdGdmVWZkVxNy8rMzdyamNGMXRpSm1BbThLZnMrMW9QdEpLOE0yZjNTSm5FZVVIQUlBeFl2cUE4ZFNsbThTQwpmSkJWU2J3K1pROTBTelpKNzdQUzFuZTBmYnRod0Y2VHE0Uy9FV3h3cUZZMzF5cENub05lVUNtcElsSjVnYWdtCnJ2QmhkTmFNb2oyQlRrMWNDVjh3dkRVS3RlbXFVYVE4R2ZCalZLeHhkdWtwcjJ3S3RPbXZkem1vMEdLSE11MFcKWmQ1TVd0dStIQVZrTXhzcE95Yk41NkFkNnloUkN5YkFJbTN2ZWJlTFV5cjBEY2JhNzJXNVlPRHRCY3ZBOEJxOAoxR1JQc1EwaXBUdGtYbDVCZEhzQ0F3RUFBYU1qTUNFd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCCi93UUZNQU1CQWY4d0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFJS0lIb25wVllFWWpwR3JrN2wraGJyeGlxZXkKeGFQT1M3UW5TZEVZMC94TWtiUWxKcy9rUFcxU2lVemdoUk4wQWJxMnFtTXVuNHhlZ0pLdGVPNXhYRGJZNEhZbgpVVCtPWG0rQ1hBQjd3S3pYcDlmUTZBUDk3cmY0L2FRaXlGZEtsZUJ6Y3JNUkErZHZWTjk3NGlHUW94aFh3T1FNCmZXeGNrMDNhU0Qvc2s5UnJrcFhlL1g2NHQrV3BkUlFGRjE2YVFlSHVxNnJQRWZTR2VPUWVpcVIrQVgvdWpIOHoKZzJZY2JKWE85U3ZheXcyb3oxSlozTUx6K0FpeE5RTHFNYU00Tm43TklvMExxUHFqNzZoU3d1Qk1nREE0VnFtZAowZHRtS211OVZjTGZHcW9ITnZnajlTYlVlZ1crL3VEbzcwVXdvb2NGTmlnSnRnOVVSZWpEUXJJSm4rUT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo=
    server: https://192.168.30.188:6443
  name: kubernetes
contexts:
- context:
    cluster: kubernetes
    user: kubernetes-admin
  name: kubernetes-admin@kubernetes
current-context: kubernetes-admin@kubernetes
kind: Config
preferences: {}
users:
- name: kubernetes-admin
  user:
    client-certificate-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUM4akNDQWRxZ0F3SUJBZ0lJZWtMYS9Fc1ZDSGd3RFFZSktvWklodmNOQVFFTEJRQXdGVEVUTUJFR0ExVUUKQXhNS2EzVmlaWEp1WlhSbGN6QWVGdzB5TURBMU1USXhNREF3TXpCYUZ3MHlNVEExTVRJeE1EQXdNekphTURReApGekFWQmdOVkJBb1REbk41YzNSbGJUcHRZWE4wWlhKek1Sa3dGd1lEVlFRREV4QnJkV0psY201bGRHVnpMV0ZrCmJXbHVNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXJ2a084MUg0ZW9zak5kM3oKSy9UUEhHcGtCR1FvZm1hbm9ldjRlWXNmUTlPZW0wYzBvVUJ3cXoxM2JabmJUbmJweFFqbmdZMkc4bHF4UmkwaQpCdlA2ZmtmS0ZFQlZzUTd4dGlqZXBrdnByWEdPL08wUUE1U0k4NHJzTjVHOVhOa2pQbWdzYTBlblZxNUVvRTBGClRaNXpRRjlwUlkxWUZZZXYrTDE1bU5FaXlScUg4UDJRY3BoUmxWK09IUXVHaVdLNEhIRVB2QWw2QUpJeWN6d3MKWWMrdk1IdHlZbmF5NUMwUldVWHhyUmc0ZytKMksrY1h1YlF0elhXdjdxaTNhNjFDekpaZi9TZkNOd0Jyam9zRwp0b215WEJWNVZTVGJUYVk1OFZrLzFPK1NSc3BybjF3TDc0djdXUXVEaE9ydXhBRXpuYmRXWWxOMEZBMm5MTjlZCmwxWkVKUUlEQVFBQm95Y3dKVEFPQmdOVkhROEJBZjhFQkFNQ0JhQXdFd1lEVlIwbEJBd3dDZ1lJS3dZQkJRVUgKQXdJd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFHazlIRDAxRmRRUnd4THhGUi8yRjdPM2ZpdGRFV3pDTC9UawpsZUxZaGlQaVh3NjNwOGtWU0VabEIyNEYzNEd2WlB3YS9LWnNUQnZXM0Mwek9uNGpHQ2hueHEvaVdqTWFnVEdBCktPUFV2bUI2VzhvVzhlb0lrSStOOEs0NFhSRnZzeGIwNUtqaCtwd0VZZzJUQXpBNEFlQzlnSjZYaTBzbHpnVnIKcWRzbXZtV0QzNEdXYzJOcVIzSDA3cW43RlJwRHIrTjlrTHE4Ukt4L0YwMWNCV1I3VVRZcnJTLzJEQ2t1N3lsWgptdTcwcXZicndYWnF6TkI5b05hQk82SHJsZXpuU2JQbnFKZUo0Q1czc2NMNmJ1N3A3bEppV1VQb0VHT0xic3YvCnFjT0xqdnZSRFF6eC9Xak5DWFZLNFhxbzJjVERGYitXeFJ1U2xGaUlQclk1QjlkQlFJWT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo=
    client-key-data: LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFb2dJQkFBS0NBUUVBcnZrTzgxSDRlb3NqTmQzeksvVFBIR3BrQkdRb2ZtYW5vZXY0ZVlzZlE5T2VtMGMwCm9VQndxejEzYlpuYlRuYnB4UWpuZ1kyRzhscXhSaTBpQnZQNmZrZktGRUJWc1E3eHRpamVwa3ZwclhHTy9PMFEKQTVTSTg0cnNONUc5WE5ralBtZ3NhMGVuVnE1RW9FMEZUWjV6UUY5cFJZMVlGWWV2K0wxNW1ORWl5UnFIOFAyUQpjcGhSbFYrT0hRdUdpV0s0SEhFUHZBbDZBSkl5Y3p3c1ljK3ZNSHR5WW5heTVDMFJXVVh4clJnNGcrSjJLK2NYCnViUXR6WFd2N3FpM2E2MUN6SlpmL1NmQ053QnJqb3NHdG9teVhCVjVWU1RiVGFZNThWay8xTytTUnNwcm4xd0wKNzR2N1dRdURoT3J1eEFFem5iZFdZbE4wRkEybkxOOVlsMVpFSlFJREFRQUJBb0lCQUI4OHI0S1krN2RFNThCUwpJM3VSZFBncHRqbGllQ2c0dzJ5UTZBY3E0eVlFdmFnVENqNVBkczNiWjFyVndPVTlMWGJUcENEbzExS2xCa2owCi9jSW9CR3hPL0xDbzI2T0VlM3A5eVdIKzQzVG5kUk9LYnZWMHF3NXZtc1JBN0lHSzhsUE4zVUE1eHBJZkFubHIKeHFxWXd4S1c5Z0JJdjVUNGFGNEwxWTJHcUtNbUlhenVjLzVleU5rZjk3bnRyOFJncXQxcDJyaWJIVS9nRzFlYgpIWktyNm01UWx2MWJpYTFIYms2SWI2b1pYTVFIWWJSckpVemJSaWp6eE1RVkRmZ2tpalhSR3pSRjdZeVFZbTk5CmwwUzI1bDYzY1dIT3J6czM5R21xRmQ4Z0JJc0M3SkxuUThUY01nb1Axb0M5WXUzMGRrSDBvUi95M2lOTnFxRW8KZVJ2d0w0RUNnWUVBeG1tY2JDZXRlRDI5VWZDTE1kKzByTU14aVV4bHI3TTdrYUJOeWxPK2lOZWxKbUk5UHRXcwpkUzQzS2hkeElnSVNIQVRTdWxpR3VKMStEekxTWWNGZ2FkSmQxd25NNHppOUc2cW9NOXZTTVN2ZGtvK28ydXRqCmNscVBZcnVRbC9nK252dkE2N1ZyZzAyUXF0NFlqcmkrYmxQL1RNaDZGS3NGa0VQeXZPTHUxOTBDZ1lFQTRjSFgKUm43WUl2TWtMNGQrR3dkUmRwcXl5YStxVC9nbUtKTnNwb3VLUVZlaUd3aW9vR21BR0E0MEJBR2hyN24vMXB6Rwo5VkVQb201VDdPRnVmVWxGaUNURmJBblN2RWU5RTREUHJ3SDNhazlXR0JzcWxYcUZwMjdwWWFyZ3NSS2JDWU9UCm9Nc1FJR0wxelN4NEpkdFArMUxDQ1BuRnowMTNkajhRbmc4TVBPa0NnWUFwczF5cTVwUHc1NWo0dGNPcmtjYloKWUpUeXRGblMyYXExYXFtdTBuY0RMNytJRjdHam1Ta0wzOUM4U2Z6L0ZzeFRremZ1N2xneVNQZUxualRWVXQwKwpvSFlVa2Z5NzdOcmlDN1lhWUNNSExwNzlCTENLZ2xwK1dFWTJqQkZSdjF6NThST1U5cVpJREc5UldpaHpKcVR2CmJ6d0RHVWQvUElxSXpaOGd6OWsvQ1FLQmdIbEFRaDVEdkZReElNdENTM0c2NFg4QklXdC9wTXFrcmVIM0pGRGkKKzFPUy9LYm1aS01iWnNnRXdOMHgveVJCa3U0eWNBMk1Cd2lubHYzUUtpYXlOdDBqV3NGbkdUODBqSkd3Q2x1bApnN3dlZGxBbUx4M3ZtMTlOQzU0QVNBUHl5VUEzNGc5bllQYjBENjZ0NXEzMmQ2TzFWQys3N3dralF6bElMK1drCmtWOFpBb0dBVk01R1lLbnpNVjUzVzNXT3I0dFdLSm5XUHFiaHVlUEt5SXMzbTNkUzhGUE56SDU2UHhNKzRUM24Ka2NzT1VsZTlkQkFENXRXT3E5eHFmNWF4MXpaU2s1SzFhdUphSzRaa3RzNkdMRUgrU09WckdoK1JXQWtRcUFVbgo0Qmk4ZVA4MmR5M3N2RmV1UkNvTWFXRVQ0QlFHaGRQaFFCd1NNdlYrSWI2R3U0VldwN289Ci0tLS0tRU5EIFJTQSBQUklWQVRFIEtFWS0tLS0tCg==

```

`其中属性certificate-authority-data、client-certificate-data、client-key-data对应CA证书、client证书、、client私钥，文件里面的内容是base64编码过后的，分别执行echo "<base64 code>" | base64 -d 就能还原成证书源文件。`

# yaml文件创建

`先创建monitoring的名称空间：kubectl create namespace monitoring `

## alertmanager的yaml文件

```bash
---
apiVersion: apps/v1
kind: Deployment
metadata:
  annotations: {}
  labels: {}
  name: alertmanager
  namespace: monitoring
  resourceVersion: '28485'
spec:
  progressDeadlineSeconds: 600
  replicas: 1
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      app: alertmanager
  strategy:
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
    type: RollingUpdate
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: alertmanager
    spec:
      containers:
        - args:
            - '--config.file=/etc/alertmanager/config.yml'
            - '--storage.path=/alertmanager'
            - '--cluster.advertise-address=$(POD_IP):6783'
          env:
            - name: POD_IP
              valueFrom:
                fieldRef:
                  apiVersion: v1
                  fieldPath: status.podIP
          image: 'prom/alertmanager:latest'
          imagePullPolicy: IfNotPresent
          name: alertmanager
          ports:
            - containerPort: 9093
              protocol: TCP
          resources: {}
          terminationMessagePath: /dev/termination-log
          terminationMessagePolicy: File
          volumeMounts:
            - mountPath: /etc/alertmanager
              name: config
            - mountPath: /etc/templates
              name: templates
            - mountPath: /alertmanager
              name: alertmanager
      dnsPolicy: ClusterFirst
      restartPolicy: Always
      schedulerName: default-scheduler
      securityContext: {}
      terminationGracePeriodSeconds: 30
      volumes:
        - configMap:
            defaultMode: 420
            name: alertmanager-config
          name: config
        - configMap:
            defaultMode: 420
            name: alertmanager-templates
          name: templates
        - emptyDir: {}
          name: alertmanager

---
apiVersion: v1
kind: Service
metadata:
  annotations:
    prometheus.io/scrape: 'true'
  labels:
    name: alertmanager
  name: alertmanager
  namespace: monitoring
  resourceVersion: '28635'
spec:
  clusterIP: 10.233.20.249
  clusterIPs:
    - 10.233.20.249
  externalTrafficPolicy: Cluster
  internalTrafficPolicy: Cluster
  ipFamilies:
    - IPv4
  ipFamilyPolicy: SingleStack
  ports:
    - name: alertmanager
      nodePort: 30093
      port: 9093
      protocol: TCP
      targetPort: 9093
  selector:
    app: alertmanager
  sessionAffinity: None
  type: NodePort


```

## blackbox-exporter

```bash
---
apiVersion: apps/v1
kind: Deployment
metadata:
  annotations: {}
  labels: {}
  name: blackbox-exporter
  namespace: monitoring
  resourceVersion: '37640'
spec:
  progressDeadlineSeconds: 600
  replicas: 1
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      app: blackbox-exporter
  strategy:
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
    type: RollingUpdate
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: blackbox-exporter
    spec:
      containers:
        - args:
            - '--config.file=/etc/blackbox_exporter/blackbox.yml'
            - '--web.listen-address=:9115'
          image: 'prom/blackbox-exporter:latest'
          imagePullPolicy: IfNotPresent
          name: blackbox-exporter
          ports:
            - containerPort: 9115
              protocol: TCP
          readinessProbe:
            failureThreshold: 3
            initialDelaySeconds: 10
            periodSeconds: 10
            successThreshold: 1
            tcpSocket:
              port: 9115
            timeoutSeconds: 5
          resources:
            limits:
              cpu: 200m
              memory: 60Mi
            requests:
              cpu: 100m
              memory: 50Mi
          terminationMessagePath: /dev/termination-log
          terminationMessagePolicy: File
          volumeMounts:
            - mountPath: /etc/blackbox_exporter
              name: config
      dnsPolicy: ClusterFirst
      restartPolicy: Always
      schedulerName: default-scheduler
      securityContext: {}
      terminationGracePeriodSeconds: 30
      tolerations:
        - effect: NoSchedule
          key: node-role.kubernetes.io/master
          operator: Exists
      volumes:
        - configMap:
            defaultMode: 420
            name: blackbox-exporter
          name: config

---
apiVersion: v1
kind: Service
metadata:
  annotations:
    prometheus.io/scrape: 'true'
  labels:
    app: blackbox-exporter
  name: blackbox-exporter
  namespace: monitoring
  resourceVersion: '27344'
spec:
  clusterIP: 10.233.60.92
  clusterIPs:
    - 10.233.60.92
  externalTrafficPolicy: Cluster
  internalTrafficPolicy: Cluster
  ipFamilies:
    - IPv4
  ipFamilyPolicy: SingleStack
  ports:
    - name: blackbox
      nodePort: 30115
      port: 9115
      protocol: TCP
      targetPort: 9115
  selector:
    app: blackbox-exporter
  sessionAffinity: None
  type: NodePort


```

## dingtalk

```bash
---
apiVersion: apps/v1
kind: Deployment
metadata:
  annotations: {}
  labels:
    app: grafana
  name: grafana
  namespace: monitoring
  resourceVersion: '39074'
spec:
  progressDeadlineSeconds: 600
  replicas: 1
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      app: grafana
  strategy:
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
    type: RollingUpdate
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: grafana
    spec:
      containers:
        - env:
            - name: GF_AUTH_BASIC_ENABLED
              value: 'true'
            - name: GF_AUTH_ANONYMOUS_ENABLED
              value: 'false'
            - name: GF_AUTH_ANONYMOUS_ORG_ROLE
              value: Admin
            - name: GF_DASHBOARDS_JSON_ENABLED
              value: 'true'
            - name: GF_INSTALL_PLUGINS
              value: grafana-kubernetes-app
            - name: GF_SECURITY_ADMIN_USER
              valueFrom:
                secretKeyRef:
                  key: admin-username
                  name: grafana
            - name: GF_SECURITY_ADMIN_PASSWORD
              valueFrom:
                secretKeyRef:
                  key: admin-password
                  name: grafana
          image: 'grafana/grafana:latest'
          imagePullPolicy: IfNotPresent
          name: grafana
          ports:
            - containerPort: 3000
              name: grafana
              protocol: TCP
          readinessProbe:
            failureThreshold: 3
            httpGet:
              path: /login
              port: 3000
              scheme: HTTP
            initialDelaySeconds: 30
            periodSeconds: 10
            successThreshold: 1
            timeoutSeconds: 5
          resources:
            limits:
              cpu: 100m
              memory: 100Mi
            requests:
              cpu: 100m
              memory: 100Mi
          terminationMessagePath: /dev/termination-log
          terminationMessagePolicy: File
          volumeMounts:
            - mountPath: /var/lib/grafana
              name: grafana-storage
      dnsPolicy: ClusterFirst
      restartPolicy: Always
      schedulerName: default-scheduler
      securityContext: {}
      terminationGracePeriodSeconds: 30
      volumes:
        - emptyDir: {}
          name: grafana-storage

---
apiVersion: v1
kind: Service
metadata:
  annotations: {}
  labels:
    app: grafana
  name: grafana
  namespace: monitoring
  resourceVersion: '33834'
spec:
  clusterIP: 10.233.48.176
  clusterIPs:
    - 10.233.48.176
  externalTrafficPolicy: Cluster
  internalTrafficPolicy: Cluster
  ipFamilies:
    - IPv4
  ipFamilyPolicy: SingleStack
  ports:
    - name: grafana
      nodePort: 32000
      port: 3000
      protocol: TCP
      targetPort: 3000
  selector:
    app: grafana
  sessionAffinity: None
  type: NodePort

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations: {}
  name: grafana
  namespace: monitoring
  resourceVersion: '33841'
spec:
  rules:
    - host: grafana.lzxlinux.cn
      http:
        paths:
          - backend:
              service:
                name: grafana
                port:
                  number: 3000
            path: /
            pathType: Prefix


```

## kube-state-metrics

```bash
---
apiVersion: apps/v1
kind: Deployment
metadata:
  annotations: {}
  labels:
    app: kube-state-metrics
  name: kube-state-metrics
  namespace: monitoring
  resourceVersion: '38566'
spec:
  progressDeadlineSeconds: 600
  replicas: 1
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      app: kube-state-metrics
  strategy:
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
    type: RollingUpdate
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: kube-state-metrics
    spec:
      containers:
        - image: 'quay.io/coreos/kube-state-metrics:v1.8.0'
          imagePullPolicy: IfNotPresent
          name: kube-state-metrics
          ports:
            - containerPort: 8080
              protocol: TCP
          resources: {}
          terminationMessagePath: /dev/termination-log
          terminationMessagePolicy: File
      dnsPolicy: ClusterFirst
      restartPolicy: Always
      schedulerName: default-scheduler
      securityContext: {}
      serviceAccount: kube-state-metrics
      serviceAccountName: kube-state-metrics
      terminationGracePeriodSeconds: 30

---
apiVersion: v1
kind: Service
metadata:
  annotations:
    prometheus.io/http-probe: 'true'
    prometheus.io/http-probe-path: /healthz
    prometheus.io/http-probe-port: '8080'
    prometheus.io/scrape: 'true'
  labels:
    app: kube-state-metrics
  name: kube-state-metrics
  namespace: monitoring
  resourceVersion: '38207'
spec:
  clusterIP: 10.233.21.4
  clusterIPs:
    - 10.233.21.4
  internalTrafficPolicy: Cluster
  ipFamilies:
    - IPv4
  ipFamilyPolicy: SingleStack
  ports:
    - name: kube-state-metrics
      port: 8080
      protocol: TCP
      targetPort: 8080
  selector:
    app: kube-state-metrics
  sessionAffinity: None
  type: ClusterIP


```

## node-exporter

```bash
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  annotations:
    deprecated.daemonset.template.generation: '1'
  labels:
    app: node-exporter
  name: node-exporter
  namespace: monitoring
  resourceVersion: '27437'
spec:
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      app: node-exporter
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: node-exporter
      name: node-exporter
    spec:
      containers:
        - image: 'prom/node-exporter:latest'
          imagePullPolicy: IfNotPresent
          name: node-exporter
          ports:
            - containerPort: 9100
              hostPort: 9100
              protocol: TCP
          resources: {}
          terminationMessagePath: /dev/termination-log
          terminationMessagePolicy: File
      dnsPolicy: ClusterFirst
      hostNetwork: true
      hostPID: true
      restartPolicy: Always
      schedulerName: default-scheduler
      securityContext: {}
      terminationGracePeriodSeconds: 30
      tolerations:
        - effect: NoSchedule
          key: node-role.kubernetes.io/master
          operator: Exists
  updateStrategy:
    rollingUpdate:
      maxSurge: 0
      maxUnavailable: 1
    type: RollingUpdate

---
apiVersion: v1
kind: Service
metadata:
  annotations:
    prometheus.io/scrape: 'true'
  labels:
    app: node-exporter
  name: node-exporter
  namespace: monitoring
  resourceVersion: '27267'
spec:
  clusterIP: None
  clusterIPs:
    - None
  internalTrafficPolicy: Cluster
  ipFamilies:
    - IPv4
  ipFamilyPolicy: SingleStack
  ports:
    - name: node-exporter
      port: 9100
      protocol: TCP
      targetPort: 9100
  selector:
    app: node-exporter
  sessionAffinity: None
  type: ClusterIP


```

## promethues

```sbash
---
apiVersion: apps/v1
kind: Deployment
metadata:
  annotations: {}
  labels:
    app: prometheus
    k8s.kuboard.cn/name: prometheus
  name: prometheus
  namespace: monitoring
  resourceVersion: '33415'
spec:
  progressDeadlineSeconds: 600
  replicas: 1
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      app: prometheus
  strategy:
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
    type: RollingUpdate
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: prometheus
    spec:
      containers:
        - args:
            - '--storage.tsdb.path=/prometheus'
            - '--storage.tsdb.retention.time=30d'
            - '--config.file=/etc/prometheus/prometheus.yml'
          image: 'prom/prometheus:latest'
          imagePullPolicy: IfNotPresent
          name: prometheus
          ports:
            - containerPort: 9090
              protocol: TCP
          resources:
            limits:
              cpu: 500m
              memory: 500M
            requests:
              cpu: 500m
              memory: 500M
          terminationMessagePath: /dev/termination-log
          terminationMessagePolicy: File
          volumeMounts:
            - mountPath: /etc/prometheus
              name: config
            - mountPath: /etc/prometheus-rules
              name: rules
            - mountPath: /prometheus
              name: prometheus
      dnsPolicy: ClusterFirst
      restartPolicy: Always
      schedulerName: default-scheduler
      securityContext: {}
      serviceAccount: prometheus
      serviceAccountName: prometheus
      terminationGracePeriodSeconds: 30
      tolerations:
        - effect: NoSchedule
          key: node-role.kubernetes.io/control-plane
          operator: Exists
      volumes:
        - configMap:
            defaultMode: 420
            name: prometheus-config
          name: config
        - configMap:
            defaultMode: 420
            name: prometheus-rules
          name: rules
        - emptyDir: {}
          name: prometheus

---
apiVersion: v1
kind: Service
metadata:
  annotations:
    prometheus.io/scrape: 'true'
  labels:
    app: prometheus
  name: prometheus
  namespace: monitoring
  resourceVersion: '33519'
spec:
  clusterIP: 10.233.51.128
  clusterIPs:
    - 10.233.51.128
  externalTrafficPolicy: Cluster
  internalTrafficPolicy: Cluster
  ipFamilies:
    - IPv4
  ipFamilyPolicy: SingleStack
  ports:
    - name: prometheus
      nodePort: 30090
      port: 9090
      protocol: TCP
      targetPort: 9090
  selector:
    app: prometheus
  sessionAffinity: None
  type: NodePort

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations: {}
  name: prometheus
  namespace: monitoring
  resourceVersion: '33391'
spec:
  rules:
    - host: prometheus.lzxlinux.cn
      http:
        paths:
          - backend:
              service:
                name: prometheus
                port:
                  number: 9090
            path: /
            pathType: Prefix


```

