#!/bin/bash

echo "🔍 Проверка найденных бэкапов на наличие схем вылета стрелы..."
echo ""

backups=(
  "/opt/arenda-neba/database_backup_20260122_102927.db"
  "/opt/arenda-neba/database_temp_1769077767.db"
)

for backup in "${backups[@]}"; do
  if [ -f "$backup" ]; then
    echo "📂 Проверяем: $backup"
    node check-backup-structure.js "$backup"
    echo ""
  else
    echo "⚠️  Файл не найден: $backup"
    echo ""
  fi
done

echo "💡 Если в одном из бэкапов найдены схемы, используйте его для восстановления:"
echo "   node restore-all-images-and-diagrams.js \"/path/to/backup.db\""
