# 🚀 君悦彩虹SPA - 快速部署检查清单

## ✅ 部署前检查

### 1. 环境准备
- [ ] 服务器满足最低要求（2核4G）
- [ ] 已安装Docker和Docker Compose
- [ ] 已开放80和443端口
- [ ] 域名DNS已正确配置

### 2. 文件配置
- [ ] 复制 `env.production` 为 `.env.production`
- [ ] 修改 `.env.production` 中的安全密钥
- [ ] 设置强管理员密码
- [ ] 配置正确的域名和URL

### 3. SSL证书（生产环境）
- [ ] 创建 `ssl/` 目录
- [ ] 放置SSL证书文件（cert.pem, key.pem）
- [ ] 在nginx.conf中启用HTTPS配置

## 🛠️ 部署步骤

### 快速部署（推荐）
```bash
# 1. 进入项目目录
cd /path/to/junyue3

# 2. 配置环境变量
cp env.production .env.production
nano .env.production  # 修改必要配置

# 3. 一键部署
./deploy.sh
```

### 手动部署
```bash
# 1. 构建镜像
docker-compose build

# 2. 启动服务
docker-compose up -d

# 3. 检查状态
docker-compose ps
```

## 🔍 部署后验证

### 1. 服务状态检查
- [ ] 所有容器正常运行：`docker-compose ps`
- [ ] 健康检查通过：`./health-check.sh`
- [ ] 网站可访问：`curl http://localhost`

### 2. 功能验证
- [ ] 首页正常加载
- [ ] API接口正常：`curl http://localhost/api/technicians`
- [ ] 管理后台可访问：`http://localhost/admin`
- [ ] 文件上传功能正常

### 3. 性能检查
- [ ] 响应时间正常（<2秒）
- [ ] 内存使用合理（<2GB）
- [ ] CPU使用正常（<50%）

## 📋 必需修改的配置项

### .env.production 文件
```bash
# 🔴 必须修改的项目
JWT_SECRET=your-super-secret-jwt-key-change-this-now-2024
SESSION_SECRET=your-super-secret-session-key-change-this-now-2024
ADMIN_PASSWORD=your-strong-password

# 🔴 根据实际情况修改
SITE_URL=https://junyuecaihong.com
SITE_DOMAIN=junyuecaihong.com
API_BASE_URL=https://junyuecaihong.com/api
```

### 生成安全密钥
```bash
# 生成JWT密钥
openssl rand -base64 32

# 生成Session密钥  
openssl rand -base64 32
```

## 🚨 常见问题快速解决

### 容器启动失败
```bash
# 查看错误日志
docker-compose logs

# 重新构建
docker-compose build --no-cache
docker-compose up -d
```

### 端口被占用
```bash
# 查看端口占用
netstat -tlnp | grep :80

# 停止冲突服务
sudo systemctl stop nginx  # 如果有系统nginx
sudo systemctl stop apache2  # 如果有apache
```

### 权限问题
```bash
# 修复数据目录权限
sudo chown -R 1001:1001 ./data
sudo chown -R 1001:1001 ./public/uploads
```

## 📊 监控设置

### 设置定时备份
```bash
# 编辑crontab
crontab -e

# 添加每日备份（凌晨2点）
0 2 * * * /path/to/junyue3/backup.sh daily
```

### 设置健康检查
```bash
# 每5分钟快速检查
*/5 * * * * /path/to/junyue3/health-check.sh quick

# 每小时完整检查
0 * * * * /path/to/junyue3/health-check.sh full
```

## 🔗 有用的命令

### 日常管理
```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新应用
git pull && ./deploy.sh
```

### 备份管理
```bash
# 手动备份
./backup.sh daily

# 查看备份状态
./backup.sh status

# 恢复备份
./backup.sh restore [backup-file]
```

### 健康检查
```bash
# 完整检查
./health-check.sh

# 快速检查
./health-check.sh quick

# 生成报告
./health-check.sh report
```

## 📞 紧急联系

如果遇到严重问题：
1. 🔍 查看日志：`docker-compose logs`
2. 🏥 运行健康检查：`./health-check.sh`
3. 📋 生成报告：`./health-check.sh report`
4. 🔄 尝试重启：`docker-compose restart`
5. 📦 恢复备份：`./backup.sh restore [latest-backup]`

---

**💡 提示**: 首次部署建议在测试环境先验证，确保所有功能正常后再部署到生产环境！ 