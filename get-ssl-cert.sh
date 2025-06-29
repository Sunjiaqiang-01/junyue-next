#!/bin/bash

# 君悦彩虹SPA技师展示网站 - SSL证书获取脚本
# 使用Let's Encrypt/Certbot获取免费SSL证书

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
DOMAIN="junyuecaihong.xyz"
EMAIL="admin@$DOMAIN"  # 请修改为您的真实邮箱
SSL_DIR="./ssl"
NGINX_CONTAINER="junyue-nginx"

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

# 函数：创建必要的目录
create_directories() {
    print_message "创建SSL证书目录..."
    mkdir -p $SSL_DIR
    print_info "SSL证书目录: $SSL_DIR"
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
        --domains $DOMAIN,www.$DOMAIN
    
    # 复制证书到项目目录
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/cert.pem
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/key.pem
    
    # 设置适当的权限
    chmod 644 $SSL_DIR/cert.pem
    chmod 600 $SSL_DIR/key.pem
    
    print_message "SSL证书获取成功"
}

# 函数：启用HTTPS配置
enable_https() {
    print_message "启用HTTPS配置..."
    
    # 取消注释HTTPS服务器配置
    sed -i 's/# server {/server {/' ./nginx/conf.d/default.conf
    sed -i 's/# listen 443/listen 443/' ./nginx/conf.d/default.conf
    sed -i 's/# server_name/server_name/' ./nginx/conf.d/default.conf
    sed -i 's/# ssl_certificate/ssl_certificate/' ./nginx/conf.d/default.conf
    
    # 启用HTTP到HTTPS重定向
    sed -i 's/# return 301/return 301/' ./nginx/conf.d/default.conf
    
    print_info "HTTPS配置已启用"
}

# 函数：启动Nginx容器
start_nginx() {
    print_message "启动Nginx容器..."
    docker start $NGINX_CONTAINER
    print_info "Nginx已启动"
}

# 函数：设置自动续期
setup_renewal() {
    print_message "设置证书自动续期..."
    
    # 创建续期脚本
    cat > ./renew-ssl.sh <<EOF
#!/bin/bash
certbot renew --quiet
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/cert.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/key.pem
docker restart $NGINX_CONTAINER
EOF
    
    chmod +x ./renew-ssl.sh
    
    # 添加到crontab
    (crontab -l 2>/dev/null || echo "") | grep -v "renew-ssl.sh" | { cat; echo "0 3 1 * * $(pwd)/renew-ssl.sh"; } | crontab -
    
    print_info "证书自动续期已设置（每月1日凌晨3点）"
}

# 主函数
main() {
    print_message "开始配置SSL证书..."
    print_info "域名: $DOMAIN"
    echo
    
    # 执行配置步骤
    check_requirements
    create_directories
    stop_nginx
    get_certificate
    enable_https
    start_nginx
    setup_renewal
    
    print_message "SSL证书配置完成！"
    echo
    print_info "现在可以通过以下地址访问网站:"
    echo "  - HTTPS: https://$DOMAIN"
    echo "  - HTTP会自动重定向到HTTPS"
    echo
    print_info "证书信息:"
    echo "  - 证书路径: $SSL_DIR/cert.pem"
    echo "  - 密钥路径: $SSL_DIR/key.pem"
    echo "  - 自动续期: 每月1日凌晨3点"
}

# 错误处理
trap 'print_error "配置过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@" 