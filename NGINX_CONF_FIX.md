# 🔧 Готовый конфиг nginx.conf

## Что добавить:

В секцию `http {` добавьте в конец (перед закрывающей скобкой `}`):

```nginx
client_max_body_size 50M;
```

## Или замените весь блок http { } на:

```nginx
http {

	##
	# Basic Settings
	##

	sendfile on;
	tcp_nopush on;
	tcp_nodelay on;
	keepalive_timeout 65;
	types_hash_max_size 2048;
	# server_tokens off;

	# server_names_hash_bucket_size 64;
	# server_name_in_redirect off;

	include /etc/nginx/mime.types;
	default_type application/octet-stream;

	##
	# SSL Settings
	##

	ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3; # Dropping SSLv3, ref: POODLE
	ssl_prefer_server_ciphers on;

	##
	# Logging Settings
	##

	access_log /var/log/nginx/access.log;
	error_log /var/log/nginx/error.log;

	##
	# Gzip Settings
	##

	gzip on;

	# gzip_vary on;
	# gzip_proxied any;
	# gzip_comp_level 6;
	# gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

	##
	# Virtual Host Configs
	##

	include /etc/nginx/conf.d/*.conf;
	include /etc/nginx/sites-enabled/*;

	##
	# File Upload Size Limit
	##

	client_max_body_size 50M;
}
```

## Как применить:

1. Откройте файл:
   ```bash
   sudo nano /etc/nginx/nginx.conf
   ```

2. Найдите секцию `http {` и добавьте в конец (перед `}`):
   ```nginx
   client_max_body_size 50M;
   ```

3. Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

4. Проверьте:
   ```bash
   sudo nginx -t
   ```

5. Перезагрузите:
   ```bash
   sudo systemctl reload nginx
   ```

## Важно:

- Добавьте `client_max_body_size 50M;` в секцию `http {` (глобально для всех сайтов)
- Или оставьте только в конфиге сайта `/etc/nginx/sites-available/arenda-neba`
- После изменений ОБЯЗАТЕЛЬНО перезагрузите Nginx!

