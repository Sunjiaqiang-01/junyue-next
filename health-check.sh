#!/bin/bash

# 君悦彩虹SPA技师展示网站 - 健康检查脚本
# 用于监控应用状态、系统资源和服务可用性

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="junyue3"
APP_URL="http://localhost:3000"
NGINX_URL="http://localhost"
HEALTH_API="$APP_URL/api/health"
LOG_DIR="./logs"
HEALTH_LOG="$LOG_DIR/health-check.log"

# 阈值设置
CPU_THRESHOLD=80        # CPU使用率阈值 (%)
MEMORY_THRESHOLD=85     # 内存使用率阈值 (%)
DISK_THRESHOLD=90       # 磁盘使用率阈值 (%)
RESPONSE_TIME_THRESHOLD=5000  # 响应时间阈值 (ms)

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

# 函数：记录日志
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $HEALTH_LOG
}

# 函数：创建日志目录
setup_logging() {
    mkdir -p $LOG_DIR
    touch $HEALTH_LOG
}

# 函数：检查Docker容器状态
check_docker_containers() {
    print_info "检查Docker容器状态..."
    
    local containers=("junyue-nextjs" "junyue-nginx")
    local all_healthy=true
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container"; then
            local status=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep "$container" | awk '{print $2}')
            if [[ $status == "Up"* ]]; then
                print_message "容器 $container: 运行中"
                log_message "容器 $container 状态正常"
            else
                print_error "容器 $container: $status"
                log_message "容器 $container 状态异常: $status"
                all_healthy=false
            fi
        else
            print_error "容器 $container: 未找到"
            log_message "容器 $container 未运行"
            all_healthy=false
        fi
    done
    
    return $all_healthy
}

# 函数：检查应用健康状态
check_application_health() {
    print_info "检查应用健康状态..."
    
    # 检查健康检查API
    local start_time=$(date +%s%3N)
    local health_response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$HEALTH_API" 2>/dev/null || echo "HTTPSTATUS:000")
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    local http_status=$(echo $health_response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    local response_body=$(echo $health_response | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ "$http_status" = "200" ]; then
        print_message "应用健康检查: 通过 (${response_time}ms)"
        log_message "应用健康检查通过，响应时间: ${response_time}ms"
        
        # 检查响应时间
        if [ $response_time -gt $RESPONSE_TIME_THRESHOLD ]; then
            print_warning "响应时间过长: ${response_time}ms (阈值: ${RESPONSE_TIME_THRESHOLD}ms)"
            log_message "响应时间警告: ${response_time}ms"
        fi
        
        # 解析健康检查详情
        if command -v jq &> /dev/null; then
            local app_status=$(echo "$response_body" | jq -r '.status' 2>/dev/null || echo "unknown")
            local uptime=$(echo "$response_body" | jq -r '.uptime' 2>/dev/null || echo "unknown")
            print_info "应用状态: $app_status, 运行时间: ${uptime}秒"
        fi
        
        return 0
    else
        print_error "应用健康检查: 失败 (HTTP $http_status)"
        log_message "应用健康检查失败: HTTP $http_status"
        return 1
    fi
}

# 函数：检查Nginx状态
check_nginx_status() {
    print_info "检查Nginx状态..."
    
    # 检查Nginx健康检查端点
    local nginx_health=$(curl -s -w "HTTPSTATUS:%{http_code}" "$NGINX_URL/nginx-health" 2>/dev/null || echo "HTTPSTATUS:000")
    local http_status=$(echo $nginx_health | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    
    if [ "$http_status" = "200" ]; then
        print_message "Nginx状态: 正常"
        log_message "Nginx状态正常"
        return 0
    else
        print_error "Nginx状态: 异常 (HTTP $http_status)"
        log_message "Nginx状态异常: HTTP $http_status"
        return 1
    fi
}

# 函数：检查网站可访问性
check_website_accessibility() {
    print_info "检查网站可访问性..."
    
    local endpoints=("/" "/admin" "/api/technicians" "/api/announcements")
    local failed_endpoints=()
    
    for endpoint in "${endpoints[@]}"; do
        local url="$NGINX_URL$endpoint"
        local http_status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
        
        if [[ $http_status =~ ^[2-3][0-9][0-9]$ ]]; then
            print_info "端点 $endpoint: 可访问 (HTTP $http_status)"
        else
            print_error "端点 $endpoint: 不可访问 (HTTP $http_status)"
            failed_endpoints+=("$endpoint")
        fi
    done
    
    if [ ${#failed_endpoints[@]} -eq 0 ]; then
        print_message "所有端点可访问"
        log_message "网站可访问性检查通过"
        return 0
    else
        print_error "以下端点不可访问: ${failed_endpoints[*]}"
        log_message "网站可访问性检查失败: ${failed_endpoints[*]}"
        return 1
    fi
}

# 函数：检查系统资源
check_system_resources() {
    print_info "检查系统资源..."
    
    # 检查CPU使用率
    if command -v top &> /dev/null; then
        local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
        local cpu_num=$(echo "$cpu_usage" | cut -d'.' -f1)
        
        if [ "$cpu_num" -gt "$CPU_THRESHOLD" ]; then
            print_warning "CPU使用率过高: ${cpu_usage}% (阈值: ${CPU_THRESHOLD}%)"
            log_message "CPU使用率警告: ${cpu_usage}%"
        else
            print_info "CPU使用率: ${cpu_usage}%"
        fi
    fi
    
    # 检查内存使用率
    if command -v free &> /dev/null; then
        local memory_info=$(free | grep Mem)
        local total_memory=$(echo $memory_info | awk '{print $2}')
        local used_memory=$(echo $memory_info | awk '{print $3}')
        local memory_usage=$((used_memory * 100 / total_memory))
        
        if [ "$memory_usage" -gt "$MEMORY_THRESHOLD" ]; then
            print_warning "内存使用率过高: ${memory_usage}% (阈值: ${MEMORY_THRESHOLD}%)"
            log_message "内存使用率警告: ${memory_usage}%"
        else
            print_info "内存使用率: ${memory_usage}%"
        fi
    fi
    
    # 检查磁盘使用率
    if command -v df &> /dev/null; then
        local disk_usage=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
        
        if [ "$disk_usage" -gt "$DISK_THRESHOLD" ]; then
            print_warning "磁盘使用率过高: ${disk_usage}% (阈值: ${DISK_THRESHOLD}%)"
            log_message "磁盘使用率警告: ${disk_usage}%"
        else
            print_info "磁盘使用率: ${disk_usage}%"
        fi
    fi
}

# 函数：检查Docker资源使用
check_docker_resources() {
    print_info "检查Docker容器资源使用..."
    
    local containers=("junyue-nextjs" "junyue-nginx")
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "$container"; then
            # 获取容器资源使用情况
            local stats=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep "$container")
            
            if [ -n "$stats" ]; then
                local cpu_perc=$(echo "$stats" | awk '{print $2}' | sed 's/%//')
                local mem_usage=$(echo "$stats" | awk '{print $3}')
                
                print_info "容器 $container: CPU ${cpu_perc}%, 内存 ${mem_usage}"
                log_message "容器 $container 资源使用: CPU ${cpu_perc}%, 内存 ${mem_usage}"
                
                # 检查CPU使用率
                local cpu_num=$(echo "$cpu_perc" | cut -d'.' -f1)
                if [ "$cpu_num" -gt "$CPU_THRESHOLD" ]; then
                    print_warning "容器 $container CPU使用率过高: ${cpu_perc}%"
                fi
            fi
        fi
    done
}

# 函数：检查数据文件完整性
check_data_integrity() {
    print_info "检查数据文件完整性..."
    
    local data_files=("./data/technicians.json" "./data/announcements.json" "./data/customer-service.json" "./data/admin.json")
    local corrupted_files=()
    
    for file in "${data_files[@]}"; do
        if [ -f "$file" ]; then
            # 检查JSON文件格式
            if command -v jq &> /dev/null; then
                if jq empty "$file" 2>/dev/null; then
                    print_info "数据文件 $(basename "$file"): 完整"
                else
                    print_error "数据文件 $(basename "$file"): JSON格式错误"
                    corrupted_files+=("$file")
                fi
            else
                # 简单的JSON格式检查
                if python3 -m json.tool "$file" >/dev/null 2>&1; then
                    print_info "数据文件 $(basename "$file"): 完整"
                else
                    print_error "数据文件 $(basename "$file"): JSON格式错误"
                    corrupted_files+=("$file")
                fi
            fi
        else
            print_error "数据文件不存在: $file"
            corrupted_files+=("$file")
        fi
    done
    
    if [ ${#corrupted_files[@]} -eq 0 ]; then
        print_message "所有数据文件完整"
        log_message "数据文件完整性检查通过"
        return 0
    else
        print_error "发现损坏的数据文件: ${corrupted_files[*]}"
        log_message "数据文件完整性检查失败: ${corrupted_files[*]}"
        return 1
    fi
}

# 函数：检查日志文件大小
check_log_sizes() {
    print_info "检查日志文件大小..."
    
    local log_files=("$LOG_DIR/nginx/access.log" "$LOG_DIR/nginx/error.log" "$HEALTH_LOG")
    local large_logs=()
    local max_size=$((100 * 1024 * 1024))  # 100MB
    
    for log_file in "${log_files[@]}"; do
        if [ -f "$log_file" ]; then
            local file_size=$(stat -c%s "$log_file" 2>/dev/null || echo 0)
            local size_mb=$((file_size / 1024 / 1024))
            
            if [ $file_size -gt $max_size ]; then
                print_warning "日志文件过大: $(basename "$log_file") (${size_mb}MB)"
                large_logs+=("$log_file")
            else
                print_info "日志文件 $(basename "$log_file"): ${size_mb}MB"
            fi
        fi
    done
    
    if [ ${#large_logs[@]} -gt 0 ]; then
        print_warning "建议清理大日志文件: ${large_logs[*]}"
        log_message "发现大日志文件: ${large_logs[*]}"
    fi
}

# 函数：生成健康报告
generate_health_report() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local report_file="$LOG_DIR/health-report-$(date +%Y%m%d).txt"
    
    print_info "生成健康报告: $report_file"
    
    {
        echo "======================================"
        echo "君悦彩虹SPA技师展示网站 - 健康检查报告"
        echo "生成时间: $timestamp"
        echo "======================================"
        echo
        
        echo "## 系统信息"
        echo "操作系统: $(uname -s)"
        echo "内核版本: $(uname -r)"
        echo "主机名: $(hostname)"
        echo
        
        echo "## Docker信息"
        docker --version 2>/dev/null || echo "Docker: 未安装"
        docker-compose --version 2>/dev/null || echo "Docker Compose: 未安装"
        echo
        
        echo "## 容器状态"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "无法获取容器信息"
        echo
        
        echo "## 系统资源"
        echo "CPU信息:"
        top -bn1 | grep "Cpu(s)" || echo "无法获取CPU信息"
        echo
        echo "内存信息:"
        free -h || echo "无法获取内存信息"
        echo
        echo "磁盘信息:"
        df -h / || echo "无法获取磁盘信息"
        echo
        
        echo "## 最近的健康检查日志"
        tail -20 "$HEALTH_LOG" 2>/dev/null || echo "无健康检查日志"
        
    } > "$report_file"
    
    print_message "健康报告已生成: $report_file"
}

# 函数：显示帮助信息
show_help() {
    echo "君悦彩虹SPA技师展示网站 - 健康检查脚本"
    echo
    echo "用法: $0 [选项]"
    echo
    echo "选项:"
    echo "  full               完整健康检查 (默认)"
    echo "  quick              快速健康检查"
    echo "  docker             仅检查Docker容器"
    echo "  app                仅检查应用状态"
    echo "  system             仅检查系统资源"
    echo "  data               仅检查数据完整性"
    echo "  report             生成健康报告"
    echo "  help               显示此帮助信息"
    echo
    echo "示例:"
    echo "  $0                 # 完整健康检查"
    echo "  $0 quick           # 快速检查"
    echo "  $0 docker          # 仅检查Docker"
    echo
}

# 主函数
main() {
    local check_type=${1:-full}
    local overall_status=0
    
    setup_logging
    
    print_message "开始健康检查 - $check_type"
    log_message "开始健康检查: $check_type"
    
    case $check_type in
        full)
            check_docker_containers || overall_status=1
            check_application_health || overall_status=1
            check_nginx_status || overall_status=1
            check_website_accessibility || overall_status=1
            check_system_resources
            check_docker_resources
            check_data_integrity || overall_status=1
            check_log_sizes
            ;;
        quick)
            check_docker_containers || overall_status=1
            check_application_health || overall_status=1
            check_nginx_status || overall_status=1
            ;;
        docker)
            check_docker_containers || overall_status=1
            check_docker_resources
            ;;
        app)
            check_application_health || overall_status=1
            check_website_accessibility || overall_status=1
            ;;
        system)
            check_system_resources
            check_log_sizes
            ;;
        data)
            check_data_integrity || overall_status=1
            ;;
        report)
            generate_health_report
            ;;
        help|--help|-h)
            show_help
            exit 0
            ;;
        *)
            print_error "未知选项: $check_type"
            show_help
            exit 1
            ;;
    esac
    
    if [ $overall_status -eq 0 ]; then
        print_message "健康检查完成 - 所有检查通过"
        log_message "健康检查完成 - 状态正常"
    else
        print_warning "健康检查完成 - 发现问题"
        log_message "健康检查完成 - 发现问题"
    fi
    
    exit $overall_status
}

# 执行主函数
main "$@" 