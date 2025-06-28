# 君悦彩虹SPA技师展示网站 - 部署指南

## 📋 目录
- [部署前准备](#部署前准备)
- [环境配置](#环境配置)
- [Docker部署](#docker部署)
- [脚本使用](#脚本使用)
- [监控和维护](#监控和维护)
- [故障排除](#故障排除)
- [安全配置](#安全配置)

## 🚀 部署前准备

### 系统要求
- **服务器配置**: 2核CPU, 4GB内存, 40GB存储空间
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **网络**: 稳定的网络连接，开放80和443端口

### 必需软件
```bash
# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

## ⚙️ 环境配置

### 1. 环境变量配置

#### 开发环境
```bash
# 复制环境变量模板
cp env.example .env.local

# 编辑配置文件
nano .env.local
```

#### 生产环境
```bash
# 复制生产环境配置
cp env.production .env.production

# 编辑生产环境配置
nano .env.production
```

**重要**: 请务必修改以下配置项：
- `JWT_SECRET`: 生成强随机字符串
- `SESSION_SECRET`: 生成强随机字符串
- `ADMIN_PASSWORD`: 设置强管理员密码
- `SITE_URL`: 设置正确的域名

### 2. 生成安全密钥
```bash
# 生成JWT密钥
openssl rand -base64 32

# 生成Session密钥
openssl rand -base64 32
```

### 3. SSL证书配置（生产环境）
```bash
# 创建SSL目录
mkdir -p ssl

# 放置SSL证书文件
# ssl/cert.pem - SSL证书
# ssl/key.pem - 私钥文件
```

## 🐳 Docker部署

### 快速部署
```bash
# 一键部署（推荐）
./deploy.sh

# 手动部署
docker-compose up -d
```

### 分步部署

#### 1. 构建镜像
```bash
# 构建应用镜像
docker-compose build

# 查看镜像
docker images
```

#### 2. 启动服务
```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

#### 3. 查看日志
```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs junyue-app
docker-compose logs junyue-nginx

# 实时日志
docker-compose logs -f
```

## 🛠️ 脚本使用

### 部署脚本 (deploy.sh)
```bash
# 一键部署
./deploy.sh

# 脚本功能：
# - 环境检查
# - 数据备份
# - 构建和部署
# - 健康检查
# - 显示部署信息
```

### 备份脚本 (backup.sh)
```bash
# 创建每日备份
./backup.sh daily

# 创建每周备份
./backup.sh weekly

# 创建每月备份
./backup.sh monthly

# 查看备份状态
./backup.sh status

# 恢复备份
./backup.sh restore ./backups/daily/junyue3_daily_20241201_120000.tar.gz

# 验证备份
./backup.sh verify ./backups/daily/junyue3_daily_20241201_120000.tar.gz

# 清理旧备份
./backup.sh cleanup
```

### 健康检查脚本 (health-check.sh)
```bash
# 完整健康检查
./health-check.sh

# 快速检查
./health-check.sh quick

# 仅检查Docker容器
./health-check.sh docker

# 仅检查应用状态
./health-check.sh app

# 仅检查系统资源
./health-check.sh system

# 生成健康报告
./health-check.sh report
```

## 📊 监控和维护

### 日常监控
```bash
# 查看容器状态
docker-compose ps

# 查看资源使用
docker stats

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

### 定期维护任务

#### 1. 设置定时备份
```bash
# 编辑crontab
crontab -e

# 添加以下内容：
# 每日凌晨2点备份
0 2 * * * /path/to/junyue3/backup.sh daily

# 每周日凌晨3点备份
0 3 * * 0 /path/to/junyue3/backup.sh weekly

# 每月1号凌晨4点备份
0 4 1 * * /path/to/junyue3/backup.sh monthly
```

#### 2. 设置健康检查
```bash
# 每5分钟检查一次
*/5 * * * * /path/to/junyue3/health-check.sh quick

# 每小时完整检查
0 * * * * /path/to/junyue3/health-check.sh full
```

#### 3. 日志轮转
```bash
# 创建logrotate配置
sudo nano /etc/logrotate.d/junyue3

# 配置内容：
/path/to/junyue3/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
}
```

## 🔧 故障排除

### 常见问题

#### 1. 容器启动失败
```bash
# 查看容器日志
docker-compose logs [service-name]

# 检查配置文件
docker-compose config

# 重新构建镜像
docker-compose build --no-cache [service-name]
```

#### 2. 端口占用
```bash
# 查看端口占用
netstat -tlnp | grep :80
netstat -tlnp | grep :443

# 停止占用端口的服务
sudo systemctl stop apache2  # 如果有Apache
sudo systemctl stop nginx    # 如果有系统Nginx
```

#### 3. 内存不足
```bash
# 查看内存使用
free -h

# 清理Docker资源
docker system prune -f

# 重启服务
docker-compose restart
```

#### 4. 磁盘空间不足
```bash
# 查看磁盘使用
df -h

# 清理日志文件
sudo journalctl --vacuum-time=7d

# 清理Docker
docker system prune -a -f
```

### 应急恢复

#### 1. 服务无响应
```bash
# 重启所有服务
docker-compose restart

# 强制重新创建容器
docker-compose down
docker-compose up -d
```

#### 2. 数据损坏
```bash
# 恢复最新备份
./backup.sh restore ./backups/daily/[latest-backup].tar.gz

# 重启服务
docker-compose restart
```

#### 3. 回滚部署
```bash
# 停止当前服务
docker-compose down

# 恢复备份
./backup.sh restore [backup-file]

# 重新启动
docker-compose up -d
```

## 🔒 安全配置

### 1. 防火墙配置
```bash
# 启用防火墙
sudo ufw enable

# 允许SSH
sudo ufw allow ssh

# 允许HTTP和HTTPS
sudo ufw allow 80
sudo ufw allow 443

# 查看防火墙状态
sudo ufw status
```

### 2. SSL/HTTPS配置
```bash
# 使用Let's Encrypt获取免费SSL证书
sudo apt install certbot

# 获取证书
sudo certbot certonly --standalone -d junyuecaihong.com

# 复制证书到项目目录
sudo cp /etc/letsencrypt/live/junyuecaihong.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/junyuecaihong.com/privkey.pem ./ssl/key.pem

# 设置权限
sudo chown root:root ./ssl/*.pem
sudo chmod 600 ./ssl/*.pem
```

### 3. 自动更新SSL证书
```bash
# 添加到crontab
0 3 * * * certbot renew --quiet && docker-compose restart junyue-nginx
```

### 4. 安全加固
```bash
# 禁用root SSH登录
sudo nano /etc/ssh/sshd_config
# 设置: PermitRootLogin no

# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装fail2ban
sudo apt install fail2ban
```

## 📈 性能优化

### 1. 服务器优化
```bash
# 调整文件描述符限制
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# 优化内核参数
echo "net.core.somaxconn = 65536" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65536" >> /etc/sysctl.conf
sysctl -p
```

### 2. Docker优化
```bash
# 限制日志大小
echo '{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}' > /etc/docker/daemon.json

sudo systemctl restart docker
```

## 📞 支持

如果遇到问题，请：
1. 查看日志文件：`./logs/`
2. 运行健康检查：`./health-check.sh`
3. 查看Docker状态：`docker-compose ps`
4. 检查系统资源：`htop` 或 `top`

---

**注意**: 请定期备份数据，并在生产环境部署前在测试环境充分验证！ 