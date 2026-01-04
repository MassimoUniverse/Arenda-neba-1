# Инструкция по работе с Git

## Первый коммит и push

После подготовки проекта выполните:

```bash
cd deploy

# Проверьте статус
git status

# Добавьте все файлы
git add .

# Создайте первый коммит
git commit -m "Initial commit: Production-ready version"

# Установите ветку main (если нужно)
git branch -M main

# Отправьте в GitHub
git push -u origin main
```

## Обновление через Git

### На локальной машине (разработка)

1. Внесите изменения в проект
2. Добавьте изменения:
```bash
git add .
git commit -m "Описание изменений"
git push origin main
```

### На сервере (автоматическое обновление)

Если настроен webhook, изменения применятся автоматически.

Или вручную:
```bash
cd /path/to/Arenda-neba-1
git pull origin main
npm install  # если были изменения в package.json
pm2 restart arenda-neba
```

## Настройка Webhook для автоматического деплоя

1. На сервере создайте скрипт `deploy.sh`:
```bash
#!/bin/bash
cd /path/to/Arenda-neba-1
git pull origin main
npm install
pm2 restart arenda-neba
echo "Deployment completed at $(date)"
```

2. Сделайте его исполняемым:
```bash
chmod +x deploy.sh
```

3. Настройте GitHub Webhook:
   - Перейдите в Settings → Webhooks
   - Добавьте новый webhook
   - URL: `http://your-server:port/webhook` (или используйте сервис типа webhook.site)
   - Content type: `application/json`
   - Events: `Just the push event`

4. Или используйте GitHub Actions для автоматического деплоя

## Важные замечания

- **НЕ коммитьте** файл `.env` - он содержит секретные данные
- **НЕ коммитьте** `database.db` - база данных создается на сервере
- **НЕ коммитьте** файлы из `uploads/` - только структура папки
- Всегда проверяйте `git status` перед коммитом

## Откат изменений

Если что-то пошло не так:
```bash
# Отменить последний коммит (локально)
git reset --soft HEAD~1

# Вернуться к определенному коммиту
git checkout <commit-hash>

# Откатить изменения в файле
git checkout -- <filename>
```


