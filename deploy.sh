#!/bin/bash

# 君悦彩虹SPA技师展示网站 - 一键部署脚本
# 适用于香港云服务器（2核4G配置）

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="junyue3"
DOMAIN="junyuecaihong.com"
DOCKER_COMPOSE_FILE="docker-compose.yml"
BACKUP_DIR="./backups"
LOG_DIR="./logs"

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
    print_message "检查部署环境..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    # 检查Git（可选）
    if command -v git &> /dev/null; then
        print_info "Git可用，将记录部署版本"
        GIT_AVAILABLE=true
    else
        print_warning "Git不可用，跳过版本记录"
        GIT_AVAILABLE=false
    fi
    
    print_message "环境检查完成"
}

# 函数：创建必要的目录
create_directories() {
    print_message "创建必要的目录..."
    
    # 创建备份目录
    mkdir -p $BACKUP_DIR
    print_info "备份目录: $BACKUP_DIR"
    
    # 创建日志目录
    mkdir -p $LOG_DIR/nginx
    print_info "日志目录: $LOG_DIR"
    
    # 创建SSL证书目录（如果不存在）
    mkdir -p ./ssl
    print_info "SSL证书目录: ./ssl"
    
    # 创建Nginx配置目录
    mkdir -p ./nginx/conf.d
    print_info "Nginx配置目录: ./nginx/conf.d"
    
    print_message "目录创建完成"
}

# 函数：备份现有数据
backup_data() {
    print_message "备份现有数据..."
    
    BACKUP_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/backup_$BACKUP_TIMESTAMP.tar.gz"
    
    if [ -d "./data" ] && [ "$(ls -A ./data)" ]; then
        tar -czf $BACKUP_FILE ./data ./public/uploads 2>/dev/null || true
        print_info "数据备份完成: $BACKUP_FILE"
    else
        print_warning "没有找到现有数据，跳过备份"
    fi
}

# 函数：检查环境配置
check_environment() {
    print_message "检查环境配置..."
    
    # 检查生产环境配置文件
    if [ ! -f "env.production" ]; then
        print_error "生产环境配置文件 env.production 不存在"
        print_info "请从 env.example 复制并修改配置"
        exit 1
    fi
    
    # 复制环境配置文件
    cp env.production .env.production
    print_info "环境配置文件已准备就绪"
    
    # 检查关键配置
    if grep -q "your-super-secret" .env.production; then
        print_warning "检测到默认密钥，建议修改生产环境密钥"
    fi
}

# 函数：构建和部署
deploy_application() {
    print_message "开始部署应用..."
    
    # 停止现有容器
    print_info "停止现有容器..."
    docker-compose down --remove-orphans || true
    
    # 清理未使用的镜像（可选）
    print_info "清理未使用的Docker镜像..."
    docker image prune -f || true
    
    # 构建新镜像
    print_info "构建应用镜像..."
    docker-compose build --no-cache
    
    # 启动服务
    print_info "启动服务..."
    docker-compose up -d
    
    print_message "应用部署完成"
}

# 函数：等待服务启动
wait_for_services() {
    print_message "等待服务启动..."
    
    # 等待应用服务
    print_info "检查应用服务..."
    for i in {1..30}; do
        if curl -f http://localhost:3000/api/health &>/dev/null; then
            print_message "应用服务启动成功"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "应用服务启动超时"
            docker-compose logs junyue-app
            exit 1
        fi
        sleep 2
    done
    
    # 等待Nginx服务
    print_info "检查Nginx服务..."
    for i in {1..10}; do
        if curl -f http://localhost/nginx-health &>/dev/null; then
            print_message "Nginx服务启动成功"
            break
        fi
        if [ $i -eq 10 ]; then
            print_error "Nginx服务启动超时"
            docker-compose logs junyue-nginx
            exit 1
        fi
        sleep 2
    done
}

# 函数：运行健康检查
run_health_check() {
    print_message "运行健康检查..."
    
    # 检查应用健康状态
    HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health)
    HEALTH_STATUS=$(echo $HEALTH_RESPONSE | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$HEALTH_STATUS" = "healthy" ]; then
        print_message "应用健康检查通过"
    else
        print_error "应用健康检查失败"
        echo $HEALTH_RESPONSE
        exit 1
    fi
    
    # 检查网站可访问性
    if curl -f http://localhost/ &>/dev/null; then
        print_message "网站可访问性检查通过"
    else
        print_error "网站无法访问"
        exit 1
    fi
}

# 函数：显示部署信息
show_deployment_info() {
    print_message "部署完成！"
    echo
    print_info "服务状态:"
    docker-compose ps
    echo
    print_info "访问地址:"
    echo "  - 本地访问: http://localhost"
    echo "  - 域名访问: http://$DOMAIN (需要DNS配置)"
    echo "  - 管理后台: http://localhost/admin"
    echo "  - 健康检查: http://localhost:3000/api/health"
    echo
    print_info "日志查看:"
    echo "  - 应用日志: docker-compose logs junyue-app"
    echo "  - Nginx日志: docker-compose logs junyue-nginx"
    echo "  - 实时日志: docker-compose logs -f"
    echo
    print_info "管理命令:"
    echo "  - 停止服务: docker-compose down"
    echo "  - 重启服务: docker-compose restart"
    echo "  - 查看状态: docker-compose ps"
    echo
    
    # 记录部署信息
    DEPLOY_LOG="$LOG_DIR/deploy.log"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 部署成功" >> $DEPLOY_LOG
    if [ "$GIT_AVAILABLE" = true ]; then
        git rev-parse HEAD >> $DEPLOY_LOG 2>/dev/null || echo "无Git版本信息" >> $DEPLOY_LOG
    fi
}

# 函数：清理资源
cleanup() {
    print_info "清理临时资源..."
    # 可以在这里添加清理逻辑
}

# 主函数
main() {
    print_message "开始部署君悦彩虹SPA技师展示网站"
    print_info "目标域名: $DOMAIN"
    print_info "项目名称: $PROJECT_NAME"
    echo
    
    # 检查是否在正确的目录
    if [ ! -f "package.json" ] || [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        print_error "请在项目根目录执行此脚本"
        exit 1
    fi
    
    # 执行部署步骤
    check_requirements
    create_directories
    backup_data
    check_environment
    deploy_application
    wait_for_services
    run_health_check
    show_deployment_info
    cleanup
    
    print_message "部署流程全部完成！"
}

# 错误处理
trap 'print_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@" 