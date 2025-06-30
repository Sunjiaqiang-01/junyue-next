#!/bin/bash
certbot renew --quiet

# 复制junyuecaihong.xyz证书
cp /etc/letsencrypt/live/junyuecaihong.xyz/fullchain.pem ./ssl/cert.pem
cp /etc/letsencrypt/live/junyuecaihong.xyz/privkey.pem ./ssl/key.pem

# 复制junyuecaihong.com证书
cp /etc/letsencrypt/live/junyuecaihong.com/fullchain.pem ./ssl/cert_com.pem
cp /etc/letsencrypt/live/junyuecaihong.com/privkey.pem ./ssl/key_com.pem

# 设置权限
chmod 644 ./ssl/*.pem
chmod 600 ./ssl/key*.pem

# 重启Nginx
docker restart junyue-nginx
