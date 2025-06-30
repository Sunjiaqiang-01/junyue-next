#!/bin/bash

# 君悦彩虹SPA技师展示网站 - 添加新域名脚本
# 为junyuecaihong.com申请SSL证书并配置Docker

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
NEW_DOMAIN="junyuecaihong.com"
EMAIL="admin@$NEW_DOMAIN"  # 请修改为您的真实邮箱
SSL_DIR="./ssl"
NGINX_CONTAINER="junyue-nginx"
DOCKER_COMPOSE_FILE="./docker-compose.yml"
DOCKER_COMPOSE_BACKUP="./docker-compose.yml.bak"

# 函数：打印带颜色的消息
print_message() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] 警告: $1${NC}"
}

print_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] 错误: $1${NC}"
}

print_info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] 信息: $1${NC}"
}

# 函数：检查必要的工具
check_requirements() {
    print_message "检查环境..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    # 检查Certbot
    if ! command -v certbot &> /dev/null; then
        print_info "Certbot未安装，正在安装..."
        apt-get update
        apt-get install -y certbot
    fi
    
    print_message "环境检查完成"
}

# 函数：备份Docker Compose文件
backup_docker_compose() {
    print_message "备份Docker Compose文件..."
    cp $DOCKER_COMPOSE_FILE $DOCKER_COMPOSE_BACKUP
    print_info "备份完成: $DOCKER_COMPOSE_BACKUP"
}

# 函数：停止Nginx容器
stop_nginx() {
    print_message "停止Nginx容器..."
    docker stop $NGINX_CONTAINER || true
    print_info "Nginx已停止"
}

# 函数：获取SSL证书
get_certificate() {
    print_message "正在获取SSL证书..."
    
    # 使用Certbot获取证书
    certbot certonly --standalone \
        --preferred-challenges http \
        --agree-tos \
        --email $EMAIL \
        --domains $NEW_DOMAIN,www.$NEW_DOMAIN
    
    print_message "SSL证书获取成功"
}

# 函数：修改Docker Compose文件
update_docker_compose() {
    print_message "更新Docker Compose配置..."
    
    # 创建新的配置
    cat > $DOCKER_COMPOSE_FILE <<EOF
version: '3.8'

services:
  # Next.js应用服务
  junyue-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: junyue-nextjs
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3000
      - HOSTNAME=0.0.0.0
    env_file:
      - .env.production
    volumes:
      # 数据持久化
      - ./data:/app/data
      # 上传文件持久化
      - ./public/uploads:/app/public/uploads
      # 日志持久化
      - ./logs:/app/logs
    networks:
      - junyue-network
    # healthcheck:
    #   test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/"]
    #   interval: 30s
    #   timeout: 10s
    #   retries: 3
    #   start_period: 40s
    # 资源限制（针对2核4G服务器）
    deploy:
      resources:
        limits:
          cpus: '1.5'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G

  # Nginx反向代理服务
  junyue-nginx:
    image: nginx:1.25-alpine
    container_name: junyue-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      # Nginx配置文件
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      # SSL证书
      - ./ssl:/etc/nginx/ssl:ro
      # 静态文件直接服务
      - ./public:/var/www/public:ro
      # 日志持久化
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - junyue-app
    networks:
      - junyue-network
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3
    # 资源限制
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.1'
          memory: 128M

  # Watchtower - 自动更新容器（可选）
  watchtower:
    image: containrrr/watchtower
    container_name: junyue-watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_POLL_INTERVAL=86400  # 24小时检查一次
      - WATCHTOWER_INCLUDE_STOPPED=true
    command: junyue-nextjs junyue-nginx
    networks:
      - junyue-network

networks:
  junyue-network:
    driver: bridge
    name: junyue-network

volumes:
  # 数据卷定义
  junyue-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./data
  
  junyue-uploads:
    driver: local
    driver_opts:
      type: none  
      o: bind
      device: ./public/uploads
      
  junyue-logs:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./logs
EOF
    
    print_info "Docker Compose配置已更新"
}

# 函数：复制证书到项目目录
copy_certificates() {
    print_message "复制证书到项目目录..."
    
    # 创建SSL目录
    mkdir -p $SSL_DIR
    
    # 复制junyuecaihong.xyz的证书
    cp /etc/letsencrypt/live/junyuecaihong.xyz/fullchain.pem $SSL_DIR/cert.pem
    cp /etc/letsencrypt/live/junyuecaihong.xyz/privkey.pem $SSL_DIR/key.pem
    
    # 复制junyuecaihong.com的证书
    cp /etc/letsencrypt/live/$NEW_DOMAIN/fullchain.pem $SSL_DIR/cert_com.pem
    cp /etc/letsencrypt/live/$NEW_DOMAIN/privkey.pem $SSL_DIR/key_com.pem
    
    # 设置适当的权限
    chmod 644 $SSL_DIR/*.pem
    chmod 600 $SSL_DIR/key*.pem
    
    print_message "证书复制完成"
}

# 函数：更新Nginx配置
update_nginx_config() {
    print_message "更新Nginx配置..."
    
    # 备份当前配置
    cp ./nginx/conf.d/default.conf ./nginx/conf.d/default.conf.bak
    
    # 创建新的配置
    cat > ./nginx/conf.d/default.conf <<EOF
# HTTP配置 - 重定向到HTTPS
server {
    listen 80;
    server_name junyuecaihong.xyz www.junyuecaihong.xyz;
    
    # 将所有HTTP请求重定向到HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
    
    # 健康检查
    location /nginx-health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# HTTP配置 - 重定向到HTTPS (junyuecaihong.com)
server {
    listen 80;
    server_name junyuecaihong.com www.junyuecaihong.com;
    
    # 将所有HTTP请求重定向到HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS配置 - junyuecaihong.xyz
server {
    listen 443 ssl;
    server_name junyuecaihong.xyz www.junyuecaihong.xyz;
    
    # SSL证书配置
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # 开启访问日志，便于调试
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log debug;
    
    # 静态资源处理 - 为图片添加适当缓存
    location /uploads/ {
        alias /var/www/public/uploads/;
        
        # 只有在访问管理后台时才禁用缓存
        if (\$http_referer ~* "/admin") {
            expires -1;
            add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
            add_header Pragma "no-cache";
        }
        
        # 前台用户访问时使用缓存
        if (\$http_referer !~* "/admin") {
            expires 7d;
            add_header Cache-Control "public, max-age=604800";
            add_header Vary Accept-Encoding;
        }
        
        # 添加文件类型特定的缓存规则
        location ~* \.(jpg|jpeg|png|gif|webp)\$ {
            expires 7d;
            add_header Cache-Control "public, max-age=604800";
            add_header Vary Accept-Encoding;
        }
        
        # 添加CORS头，允许客户端缓存
        add_header Access-Control-Allow-Origin "*";
        
        # 禁止访问目录列表
        autoindex off;
        
        try_files \$uri =404;
    }

    location /_next/static/ {
        proxy_pass http://junyue-app:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://junyue-app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}

# HTTPS配置 - junyuecaihong.com
server {
    listen 443 ssl;
    server_name junyuecaihong.com www.junyuecaihong.com;
    
    # SSL证书配置
    ssl_certificate /etc/nginx/ssl/cert_com.pem;
    ssl_certificate_key /etc/nginx/ssl/key_com.pem;
    
    # 开启访问日志，便于调试
    access_log /var/log/nginx/access_com.log;
    error_log /var/log/nginx/error_com.log debug;
    
    # 静态资源处理 - 为图片添加适当缓存
    location /uploads/ {
        alias /var/www/public/uploads/;
        
        # 只有在访问管理后台时才禁用缓存
        if (\$http_referer ~* "/admin") {
            expires -1;
            add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
            add_header Pragma "no-cache";
        }
        
        # 前台用户访问时使用缓存
        if (\$http_referer !~* "/admin") {
            expires 7d;
            add_header Cache-Control "public, max-age=604800";
            add_header Vary Accept-Encoding;
        }
        
        # 添加文件类型特定的缓存规则
        location ~* \.(jpg|jpeg|png|gif|webp)\$ {
            expires 7d;
            add_header Cache-Control "public, max-age=604800";
            add_header Vary Accept-Encoding;
        }
        
        # 添加CORS头，允许客户端缓存
        add_header Access-Control-Allow-Origin "*";
        
        # 禁止访问目录列表
        autoindex off;
        
        try_files \$uri =404;
    }

    location /_next/static/ {
        proxy_pass http://junyue-app:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://junyue-app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}

# 本地开发配置
server {
    listen 80;
    server_name localhost;

    # 静态资源处理 - 与生产环境保持一致的缓存策略
    location /uploads/ {
        alias /var/www/public/uploads/;
        
        # 只有在访问管理后台时才禁用缓存
        if (\$http_referer ~* "/admin") {
            expires -1;
            add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
            add_header Pragma "no-cache";
        }
        
        # 前台用户访问时使用缓存
        if (\$http_referer !~* "/admin") {
            expires 7d;
            add_header Cache-Control "public, max-age=604800";
            add_header Vary Accept-Encoding;
        }
        
        # 添加文件类型特定的缓存规则
        location ~* \.(jpg|jpeg|png|gif|webp)\$ {
            expires 7d;
            add_header Cache-Control "public, max-age=604800";
            add_header Vary Accept-Encoding;
        }
        
        # 添加CORS头，允许客户端缓存
        add_header Access-Control-Allow-Origin "*";
        
        # 禁止访问目录列表
        autoindex off;
        
        try_files \$uri =404;
    }

    location /_next/static/ {
        proxy_pass http://junyue-app:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://junyue-app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # 健康检查
    location /nginx-health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
    
    print_info "Nginx配置已更新"
}

# 函数：启动Nginx容器
start_nginx() {
    print_message "启动Nginx容器..."
    docker-compose up -d
    print_info "Nginx已启动"
}

# 函数：设置自动续期
setup_renewal() {
    print_message "设置证书自动续期..."
    
    # 创建续期脚本
    cat > ./renew-ssl.sh <<EOF
#!/bin/bash
certbot renew --quiet

# 复制junyuecaihong.xyz证书
cp /etc/letsencrypt/live/junyuecaihong.xyz/fullchain.pem $SSL_DIR/cert.pem
cp /etc/letsencrypt/live/junyuecaihong.xyz/privkey.pem $SSL_DIR/key.pem

# 复制junyuecaihong.com证书
cp /etc/letsencrypt/live/$NEW_DOMAIN/fullchain.pem $SSL_DIR/cert_com.pem
cp /etc/letsencrypt/live/$NEW_DOMAIN/privkey.pem $SSL_DIR/key_com.pem

# 设置权限
chmod 644 $SSL_DIR/*.pem
chmod 600 $SSL_DIR/key*.pem

# 重启Nginx
docker restart $NGINX_CONTAINER
EOF
    
    chmod +x ./renew-ssl.sh
    
    # 添加到crontab
    (crontab -l 2>/dev/null || echo "") | grep -v "renew-ssl.sh" | { cat; echo "0 3 1 * * $(pwd)/renew-ssl.sh"; } | crontab -
    
    print_info "证书自动续期已设置（每月1日凌晨3点）"
}

# 主函数
main() {
    print_message "开始配置新域名 $NEW_DOMAIN..."
    print_info "这将为 $NEW_DOMAIN 申请SSL证书并更新Docker配置"
    echo
    
    # 执行配置步骤
    check_requirements
    backup_docker_compose
    stop_nginx
    get_certificate
    update_docker_compose
    copy_certificates
    update_nginx_config
    start_nginx
    setup_renewal
    
    print_message "新域名配置完成！"
    echo
    print_info "现在可以通过以下地址访问网站:"
    echo "  - HTTPS: https://junyuecaihong.xyz"
    echo "  - HTTPS: https://$NEW_DOMAIN"
    echo "  - HTTP会自动重定向到HTTPS"
    echo
    print_info "证书信息:"
    echo "  - junyuecaihong.xyz 证书路径: $SSL_DIR/cert.pem"
    echo "  - junyuecaihong.xyz 密钥路径: $SSL_DIR/key.pem"
    echo "  - $NEW_DOMAIN 证书路径: $SSL_DIR/cert_com.pem"
    echo "  - $NEW_DOMAIN 密钥路径: $SSL_DIR/key_com.pem"
    echo "  - 自动续期: 每月1日凌晨3点"
}

# 错误处理
trap 'print_error "配置过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@" 