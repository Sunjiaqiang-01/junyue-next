# 君悦彩虹SPA技师展示网站 - 域名配置步骤

## 配置域名的步骤

### 1. 域名解析
1. 登录域名管理平台（如阿里云、腾讯云等）
2. 添加域名解析记录：
   - 记录类型：A记录
   - 主机记录：@ (代表根域名)
   - 记录值：154.19.84.31 (服务器IP)
   - TTL：600秒（或默认值）
3. 添加www子域名解析：
   - 记录类型：A记录
   - 主机记录：www
   - 记录值：154.19.84.31 (服务器IP)
   - TTL：600秒（或默认值）

### 2. 服务器配置

#### 2.1 创建Nginx配置文件
我们已经创建了`nginx/conf.d/default.conf`文件，配置了域名和HTTPS设置。

#### 2.2 上传配置文件到服务器
1. 连接到服务器：
```bash
ssh root@154.19.84.31
```

2. 创建必要的目录：
```bash
mkdir -p /root/junyue3/nginx/conf.d
mkdir -p /root/junyue3/ssl
```

3. 退出服务器连接：
```bash
exit
```

4. 上传Nginx配置文件：
```bash
scp ./nginx/conf.d/default.conf root@154.19.84.31:/root/junyue3/nginx/conf.d/
```

5. 上传SSL证书获取脚本：
```bash
scp ./get-ssl-cert.sh root@154.19.84.31:/root/junyue3/
```

#### 2.3 获取SSL证书
1. 连接到服务器：
```bash
ssh root@154.19.84.31
```

2. 进入项目目录：
```bash
cd /root/junyue3
```

3. 给脚本添加执行权限：
```bash
chmod +x get-ssl-cert.sh
```

4. 执行SSL证书获取脚本：
```bash
./get-ssl-cert.sh
```

#### 2.4 更新Docker容器配置
1. 在服务器上，进入项目目录：
```bash
cd /root/junyue3
```

2. 编辑docker-compose.yml文件，确保正确映射了Nginx配置目录：
```bash
nano docker-compose.yml
```

3. 重启Docker容器：
```bash
docker-compose restart
```

### 3. 验证配置

#### 3.1 验证HTTP访问
在浏览器中访问：http://junyuecaihong.xyz

应该会自动重定向到HTTPS版本。

#### 3.2 验证HTTPS访问
在浏览器中访问：https://junyuecaihong.xyz

应该能正常访问网站，并显示安全锁标志。

#### 3.3 验证API访问
测试API端点：https://junyuecaihong.xyz/api/technicians

应该返回技师数据JSON。

### 4. 更新环境变量

确保`.env.production`文件中的域名配置正确：
```
SITE_URL=https://junyuecaihong.xyz
SITE_DOMAIN=junyuecaihong.xyz
API_BASE_URL=https://junyuecaihong.xyz/api
```

### 5. 自动续期SSL证书

SSL证书通常有效期为90天，需要定期续期。我们已经设置了自动续期脚本，每月1日凌晨3点自动执行。

可以通过以下命令查看定时任务：
```bash
crontab -l
```

## 常见问题排查

### 1. 域名无法访问
- 检查域名解析是否生效：`nslookup junyuecaihong.xyz`
- 检查服务器防火墙是否开放80和443端口
- 检查Nginx配置是否正确：`docker exec junyue-nginx nginx -t`

### 2. SSL证书问题
- 检查证书文件是否存在：`ls -la /root/junyue3/ssl/`
- 检查证书权限：`chmod 644 /root/junyue3/ssl/cert.pem`
- 检查私钥权限：`chmod 600 /root/junyue3/ssl/key.pem`

### 3. HTTPS重定向不生效
- 检查Nginx配置中的重定向设置是否已取消注释
- 重启Nginx容器：`docker restart junyue-nginx`

### 4. 证书续期失败
- 手动执行续期命令：`certbot renew --dry-run`
- 检查crontab任务：`crontab -l | grep renew-ssl` 