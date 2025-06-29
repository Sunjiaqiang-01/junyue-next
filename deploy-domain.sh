#!/bin/bash

# 君悦彩虹SPA技师展示网站 - 域名配置部署脚本
# 将本地配置文件部署到服务器

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
SERVER_IP="154.19.84.31"
SERVER_USER="root"
SERVER_PATH="/root/junyue3"
LOCAL_NGINX_CONF="./nginx/conf.d/default.conf"
LOCAL_ENV_PROD=".env.production"

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

# 函数：检查必要的文件
check_files() {
    print_message "检查配置文件..."
    
    if [ ! -f "$LOCAL_NGINX_CONF" ]; then
        print_error "Nginx配置文件不存在: $LOCAL_NGINX_CONF"
        exit 1
    fi
    
    if [ ! -f "$LOCAL_ENV_PROD" ]; then
        print_error "环境配置文件不存在: $LOCAL_ENV_PROD"
        exit 1
    fi
    
    print_message "配置文件检查完成"
}

# 函数：创建服务器上的目录
create_remote_dirs() {
    print_message "创建服务器上的目录..."
    
    ssh $SERVER_USER@$SERVER_IP "mkdir -p $SERVER_PATH/nginx/conf.d $SERVER_PATH/ssl"
    
    print_info "服务器目录创建完成"
}

# 函数：上传配置文件
upload_configs() {
    print_message "上传配置文件到服务器..."
    
    # 上传Nginx配置
    scp $LOCAL_NGINX_CONF $SERVER_USER@$SERVER_IP:$SERVER_PATH/nginx/conf.d/default.conf
    print_info "Nginx配置已上传"
    
    # 上传环境配置
    scp $LOCAL_ENV_PROD $SERVER_USER@$SERVER_IP:$SERVER_PATH/.env.production
    print_info "环境配置已上传"
    
    # 上传SSL证书获取脚本
    scp ./get-ssl-cert.sh $SERVER_USER@$SERVER_IP:$SERVER_PATH/get-ssl-cert.sh
    ssh $SERVER_USER@$SERVER_IP "chmod +x $SERVER_PATH/get-ssl-cert.sh"
    print_info "SSL证书获取脚本已上传"
    
    print_message "配置文件上传完成"
}

# 函数：重启Docker容器
restart_containers() {
    print_message "重启Docker容器..."
    
    ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && docker-compose restart"
    
    print_info "Docker容器已重启"
}

# 函数：显示部署信息
show_deployment_info() {
    print_message "域名配置部署完成！"
    echo
    print_info "下一步操作:"
    echo "1. 确保域名 junyuecaihong.xyz 已解析到服务器IP: $SERVER_IP"
    echo "2. 连接到服务器获取SSL证书:"
    echo "   ssh $SERVER_USER@$SERVER_IP"
    echo "   cd $SERVER_PATH"
    echo "   ./get-ssl-cert.sh"
    echo
    print_info "域名配置信息:"
    echo "  - 域名: junyuecaihong.xyz"
    echo "  - 服务器IP: $SERVER_IP"
    echo "  - Nginx配置: $SERVER_PATH/nginx/conf.d/default.conf"
    echo "  - 环境配置: $SERVER_PATH/.env.production"
    echo
}

# 主函数
main() {
    print_message "开始部署域名配置..."
    print_info "目标服务器: $SERVER_USER@$SERVER_IP:$SERVER_PATH"
    echo
    
    # 执行部署步骤
    check_files
    create_remote_dirs
    upload_configs
    restart_containers
    show_deployment_info
    
    print_message "部署流程全部完成！"
}

# 错误处理
trap 'print_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@" 