#!/bin/bash

# 君悦彩虹SPA技师展示网站备份脚本
# 用于备份数据文件和关键配置文件
    
    # 创建备份目录
BACKUP_DIR="backups/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "创建备份目录: $BACKUP_DIR"

# 备份数据文件
echo "备份数据文件..."
cp -r data/*.json "$BACKUP_DIR/"

# 备份关键配置文件
echo "备份配置文件..."
cp nginx.conf "$BACKUP_DIR/"
cp -r nginx/conf.d "$BACKUP_DIR/"
cp docker-compose.yml "$BACKUP_DIR/"
cp .env.production "$BACKUP_DIR/"
cp deploy.sh "$BACKUP_DIR/"

# 备份完成
echo "备份完成! 文件已保存到: $BACKUP_DIR"
echo "备份文件列表:"
ls -la "$BACKUP_DIR"

# 可选：压缩备份文件
echo "是否需要压缩备份文件? (y/n)"
read -r choice
if [ "$choice" = "y" ] || [ "$choice" = "Y" ]; then
    tar -czvf "${BACKUP_DIR}.tar.gz" "$BACKUP_DIR"
    echo "压缩完成: ${BACKUP_DIR}.tar.gz"
fi

echo "备份过程结束" 