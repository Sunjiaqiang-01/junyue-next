#!/bin/bash

# 君悦彩虹SPA技师展示网站 - 数据备份脚本
# 用于备份JSON数据文件和上传的媒体文件

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="junyue3"
BACKUP_DIR="./backups"
DATA_DIR="./data"
UPLOADS_DIR="./public/uploads"
LOG_DIR="./logs"
BACKUP_LOG="$LOG_DIR/backup.log"

# 备份保留设置
DAILY_RETENTION=7      # 保留7天的每日备份
WEEKLY_RETENTION=4     # 保留4周的每周备份
MONTHLY_RETENTION=12   # 保留12个月的每月备份

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
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $BACKUP_LOG
}

# 函数：检查目录是否存在
check_directories() {
    print_message "检查目录结构..."
    
    # 检查数据目录
    if [ ! -d "$DATA_DIR" ]; then
        print_error "数据目录不存在: $DATA_DIR"
        exit 1
    fi
    
    # 检查上传目录
    if [ ! -d "$UPLOADS_DIR" ]; then
        print_warning "上传目录不存在: $UPLOADS_DIR"
    fi
    
    # 创建备份目录
    mkdir -p $BACKUP_DIR/{daily,weekly,monthly}
    mkdir -p $LOG_DIR
    
    print_info "目录检查完成"
}

# 函数：获取目录大小
get_directory_size() {
    local dir=$1
    if [ -d "$dir" ]; then
        du -sh "$dir" 2>/dev/null | cut -f1
    else
        echo "0B"
    fi
}

# 函数：创建备份
create_backup() {
    local backup_type=$1  # daily, weekly, monthly
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="$BACKUP_DIR/$backup_type/${PROJECT_NAME}_${backup_type}_${timestamp}.tar.gz"
    
    print_message "创建 $backup_type 备份..."
    
    # 计算备份前的大小
    local data_size=$(get_directory_size "$DATA_DIR")
    local uploads_size=$(get_directory_size "$UPLOADS_DIR")
    
    print_info "数据目录大小: $data_size"
    print_info "上传目录大小: $uploads_size"
    
    # 创建临时备份清单
    local manifest_file="/tmp/backup_manifest_$timestamp.txt"
    echo "# 君悦彩虹SPA备份清单" > $manifest_file
    echo "# 创建时间: $(date)" >> $manifest_file
    echo "# 备份类型: $backup_type" >> $manifest_file
    echo "# 数据目录: $DATA_DIR ($data_size)" >> $manifest_file
    echo "# 上传目录: $UPLOADS_DIR ($uploads_size)" >> $manifest_file
    echo "" >> $manifest_file
    
    # 列出数据文件
    echo "## 数据文件列表:" >> $manifest_file
    if [ -d "$DATA_DIR" ]; then
        find "$DATA_DIR" -type f -name "*.json" -exec ls -lh {} \; >> $manifest_file
    fi
    echo "" >> $manifest_file
    
    # 列出上传文件统计
    echo "## 上传文件统计:" >> $manifest_file
    if [ -d "$UPLOADS_DIR" ]; then
        find "$UPLOADS_DIR" -type f | wc -l | xargs echo "总文件数:" >> $manifest_file
        find "$UPLOADS_DIR" -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" | wc -l | xargs echo "图片文件数:" >> $manifest_file
        find "$UPLOADS_DIR" -name "*.mp4" -o -name "*.webm" -o -name "*.mov" | wc -l | xargs echo "视频文件数:" >> $manifest_file
    fi
    
    # 开始备份
    local start_time=$(date +%s)
    
    # 创建tar.gz备份
    if [ -d "$UPLOADS_DIR" ]; then
        tar -czf "$backup_file" "$DATA_DIR" "$UPLOADS_DIR" -C /tmp "backup_manifest_$timestamp.txt" 2>/dev/null
    else
        tar -czf "$backup_file" "$DATA_DIR" -C /tmp "backup_manifest_$timestamp.txt" 2>/dev/null
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # 清理临时文件
    rm -f $manifest_file
    
    # 检查备份是否成功
    if [ -f "$backup_file" ]; then
        local backup_size=$(get_directory_size "$backup_file")
        print_message "$backup_type 备份创建成功"
        print_info "备份文件: $backup_file"
        print_info "备份大小: $backup_size"
        print_info "备份耗时: ${duration}秒"
        
        # 记录日志
        log_message "$backup_type 备份成功: $backup_file (大小: $backup_size, 耗时: ${duration}秒)"
        
        return 0
    else
        print_error "$backup_type 备份创建失败"
        log_message "$backup_type 备份失败"
        return 1
    fi
}

# 函数：清理旧备份
cleanup_old_backups() {
    local backup_type=$1
    local retention_days=$2
    
    print_info "清理旧的 $backup_type 备份 (保留 $retention_days 个)"
    
    local backup_dir="$BACKUP_DIR/$backup_type"
    if [ -d "$backup_dir" ]; then
        # 获取备份文件列表（按时间排序）
        local backup_files=$(ls -t "$backup_dir"/${PROJECT_NAME}_${backup_type}_*.tar.gz 2>/dev/null || true)
        local file_count=$(echo "$backup_files" | wc -w)
        
        if [ $file_count -gt $retention_days ]; then
            local files_to_delete=$(echo "$backup_files" | tail -n +$((retention_days + 1)))
            
            for file in $files_to_delete; do
                if [ -f "$file" ]; then
                    local file_size=$(get_directory_size "$file")
                    rm -f "$file"
                    print_info "删除旧备份: $(basename "$file") ($file_size)"
                    log_message "删除旧备份: $file"
                fi
            done
        else
            print_info "当前 $backup_type 备份数量: $file_count，无需清理"
        fi
    fi
}

# 函数：验证备份完整性
verify_backup() {
    local backup_file=$1
    
    print_info "验证备份完整性: $(basename "$backup_file")"
    
    # 检查tar文件是否可以正常读取
    if tar -tzf "$backup_file" >/dev/null 2>&1; then
        print_message "备份文件完整性验证通过"
        log_message "备份验证成功: $backup_file"
        return 0
    else
        print_error "备份文件损坏: $backup_file"
        log_message "备份验证失败: $backup_file"
        return 1
    fi
}

# 函数：显示备份统计
show_backup_statistics() {
    print_message "备份统计信息"
    
    for backup_type in daily weekly monthly; do
        local backup_dir="$BACKUP_DIR/$backup_type"
        if [ -d "$backup_dir" ]; then
            local count=$(ls "$backup_dir"/${PROJECT_NAME}_${backup_type}_*.tar.gz 2>/dev/null | wc -l)
            local total_size=$(du -sh "$backup_dir" 2>/dev/null | cut -f1)
            
            print_info "$backup_type 备份: $count 个文件, 总大小: $total_size"
            
            # 显示最新备份
            local latest=$(ls -t "$backup_dir"/${PROJECT_NAME}_${backup_type}_*.tar.gz 2>/dev/null | head -1)
            if [ -n "$latest" ]; then
                local latest_date=$(stat -c %y "$latest" 2>/dev/null | cut -d' ' -f1)
                print_info "  最新备份: $(basename "$latest") ($latest_date)"
            fi
        fi
    done
}

# 函数：恢复备份
restore_backup() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        print_error "请指定要恢复的备份文件"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        print_error "备份文件不存在: $backup_file"
        exit 1
    fi
    
    print_warning "即将恢复备份，这将覆盖现有数据！"
    read -p "确认恢复? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_info "恢复操作已取消"
        exit 0
    fi
    
    print_message "恢复备份: $(basename "$backup_file")"
    
    # 创建当前数据的临时备份
    local temp_backup="/tmp/temp_backup_$(date +%s).tar.gz"
    if [ -d "$DATA_DIR" ] || [ -d "$UPLOADS_DIR" ]; then
        print_info "创建当前数据的临时备份..."
        tar -czf "$temp_backup" "$DATA_DIR" "$UPLOADS_DIR" 2>/dev/null || true
    fi
    
    # 恢复备份
    print_info "正在恢复数据..."
    tar -xzf "$backup_file" -C / 2>/dev/null
    
    if [ $? -eq 0 ]; then
        print_message "备份恢复成功"
        log_message "备份恢复成功: $backup_file"
        
        # 清理临时备份
        rm -f "$temp_backup"
    else
        print_error "备份恢复失败"
        
        # 尝试恢复临时备份
        if [ -f "$temp_backup" ]; then
            print_info "尝试恢复原始数据..."
            tar -xzf "$temp_backup" -C / 2>/dev/null || true
            rm -f "$temp_backup"
        fi
        
        exit 1
    fi
}

# 函数：显示帮助信息
show_help() {
    echo "君悦彩虹SPA技师展示网站 - 数据备份脚本"
    echo
    echo "用法: $0 [选项]"
    echo
    echo "选项:"
    echo "  daily              创建每日备份"
    echo "  weekly             创建每周备份"
    echo "  monthly            创建每月备份"
    echo "  cleanup            清理旧备份"
    echo "  status             显示备份统计"
    echo "  restore <file>     恢复指定备份"
    echo "  verify <file>      验证备份完整性"
    echo "  help               显示此帮助信息"
    echo
    echo "示例:"
    echo "  $0 daily           # 创建每日备份"
    echo "  $0 status          # 查看备份状态"
    echo "  $0 restore ./backups/daily/junyue3_daily_20241201_120000.tar.gz"
    echo
}

# 主函数
main() {
    local action=${1:-daily}
    
    case $action in
        daily)
            check_directories
            create_backup "daily"
            verify_backup "$BACKUP_DIR/daily/$(ls -t $BACKUP_DIR/daily/${PROJECT_NAME}_daily_*.tar.gz 2>/dev/null | head -1 | xargs basename)"
            cleanup_old_backups "daily" $DAILY_RETENTION
            ;;
        weekly)
            check_directories
            create_backup "weekly"
            verify_backup "$BACKUP_DIR/weekly/$(ls -t $BACKUP_DIR/weekly/${PROJECT_NAME}_weekly_*.tar.gz 2>/dev/null | head -1 | xargs basename)"
            cleanup_old_backups "weekly" $WEEKLY_RETENTION
            ;;
        monthly)
            check_directories
            create_backup "monthly"
            verify_backup "$BACKUP_DIR/monthly/$(ls -t $BACKUP_DIR/monthly/${PROJECT_NAME}_monthly_*.tar.gz 2>/dev/null | head -1 | xargs basename)"
            cleanup_old_backups "monthly" $MONTHLY_RETENTION
            ;;
        cleanup)
            cleanup_old_backups "daily" $DAILY_RETENTION
            cleanup_old_backups "weekly" $WEEKLY_RETENTION
            cleanup_old_backups "monthly" $MONTHLY_RETENTION
            ;;
        status)
            show_backup_statistics
            ;;
        restore)
            restore_backup "$2"
            ;;
        verify)
            if [ -n "$2" ]; then
                verify_backup "$2"
            else
                print_error "请指定要验证的备份文件"
                exit 1
            fi
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "未知选项: $action"
            show_help
            exit 1
            ;;
    esac
}

# 错误处理
trap 'print_error "备份过程中发生错误"; exit 1' ERR

# 执行主函数
main "$@" 