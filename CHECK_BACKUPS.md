# 🔍 Проверка найденных баз данных

## Найдены базы данных:
1. `/opt/arenda-neba/database.db` - текущая база
2. `/root/New-arenda-neba/database.db` - возможно, бэкап

## Проверьте, какая содержит схемы:

```bash
cd /opt/arenda-neba
node check-which-backup.js
```

Этот скрипт проверит обе базы и покажет, какая содержит схемы вылета стрелы.

## После проверки:

Если `/root/New-arenda-neba/database.db` содержит схемы, используйте её для восстановления:

```bash
node restore-reach-diagrams.js /root/New-arenda-neba/database.db
```

## Или ищите бэкап "slightly done":

```bash
# Ищите папку "slightly done"
find /opt -type d -name "*slightly*" 2>/dev/null
find /root -type d -name "*slightly*" 2>/dev/null

# Или ищите все папки backups
find /opt -type d -name "*backup*" 2>/dev/null
find /root -type d -name "*backup*" 2>/dev/null
```

