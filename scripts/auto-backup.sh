#!/bin/bash
# Автоматические резервные копии (запускается из cron, см. /etc/cron.d/arenda-neba-backup).
#   auto-backup.sh daily   — база данных + .env, хранятся 30 дней
#   auto-backup.sh weekly  — архив uploads/, хранятся 4 недели
# Пишет ТОЛЬКО в backups/auto/ и удаляет ТОЛЬКО свои старые файлы по строгим шаблонам имён —
# ручные копии в backups/backup_* не трогаются.

set -euo pipefail

APP_DIR=/opt/arenda-neba
DEST="$APP_DIR/backups/auto"
STAMP=$(date +%Y-%m-%d_%H-%M)
MIN_FREE_MB=3000

mkdir -p "$DEST/db" "$DEST/uploads"
chmod 700 "$DEST"
cd "$APP_DIR"

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') [$1] $2"; }

free_mb() { df -Pm "$DEST" | awk 'NR==2 {print $4}'; }

case "${1:-}" in
  daily)
    # .backup делает целостный снимок даже во время записи в базу
    sqlite3 database.db ".backup '$DEST/db/db-$STAMP.sqlite'"
    if [ "$(sqlite3 "$DEST/db/db-$STAMP.sqlite" 'PRAGMA integrity_check;')" != "ok" ]; then
      log daily "ОШИБКА: снимок базы не прошёл проверку целостности"
      exit 1
    fi
    gzip -f "$DEST/db/db-$STAMP.sqlite"
    [ -f .env ] && install -m 600 .env "$DEST/db/env-$STAMP"
    find "$DEST/db" -maxdepth 1 -type f \( -name 'db-*.sqlite.gz' -o -name 'env-*' \) -mtime +30 -delete
    log daily "ok: db-$STAMP.sqlite.gz ($(du -h "$DEST/db/db-$STAMP.sqlite.gz" | cut -f1)), копий: $(ls "$DEST/db" | grep -c '^db-')"
    ;;
  weekly)
    if [ "$(free_mb)" -lt "$MIN_FREE_MB" ]; then
      log weekly "ПРОПУСК: на диске меньше ${MIN_FREE_MB} МБ свободно ($(free_mb) МБ)"
      exit 1
    fi
    rm -f "$DEST/uploads/"*.part   # недописанный архив от прерванного запуска
    tar -czf "$DEST/uploads/uploads-$STAMP.tar.gz.part" uploads
    mv "$DEST/uploads/uploads-$STAMP.tar.gz.part" "$DEST/uploads/uploads-$STAMP.tar.gz"
    # оставляем 4 последних архива
    ls -1t "$DEST/uploads/" | grep -E '^uploads-[0-9_-]+\.tar\.gz$' | tail -n +5 | while read -r f; do rm -f "$DEST/uploads/$f"; done
    log weekly "ok: uploads-$STAMP.tar.gz ($(du -h "$DEST/uploads/uploads-$STAMP.tar.gz" | cut -f1)), архивов: $(ls "$DEST/uploads" | grep -c '^uploads-')"
    ;;
  *)
    echo "usage: $0 daily|weekly" >&2
    exit 2
    ;;
esac
