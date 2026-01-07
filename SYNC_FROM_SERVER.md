# 📥 Синхронизация файлов с сервера на локальную машину

## Вариант 1: Через SCP (командная строка)

### На локальной машине (Windows PowerShell):

```powershell
# 1. Найдите бэкап на сервере
# Сначала подключитесь к серверу и найдите путь к бэкапу:
# ssh root@your-server-ip
# ls -lht /opt/arenda-neba/backups/

# 2. Скопируйте весь бэкап на локальную машину
scp -r root@your-server-ip:/opt/arenda-neba/backups/backup_2026-01-04_12-30-00 "F:\New site\backups\"

# 3. Или скопируйте только нужные файлы:
# База данных
scp root@your-server-ip:/opt/arenda-neba/backups/backup_2026-01-04_12-30-00/database.db "F:\New site\deploy\database.db"

# Папка public
scp -r root@your-server-ip:/opt/arenda-neba/backups/backup_2026-01-04_12-30-00/public "F:\New site\deploy\"

# server.js
scp root@your-server-ip:/opt/arenda-neba/backups/backup_2026-01-04_12-30-00/server.js "F:\New site\deploy\server.js"
```

## Вариант 2: Через WinSCP (графический интерфейс)

1. **Скачайте и установите WinSCP**: https://winscp.net/

2. **Подключитесь к серверу**:
   - Host: IP вашего сервера
   - Username: `root`
   - Password: ваш пароль
   - Protocol: SFTP

3. **Найдите бэкап**:
   - Перейдите в `/opt/arenda-neba/backups/`
   - Найдите папку с бэкапом (например, `backup_2026-01-04_12-30-00`)

4. **Скопируйте файлы**:
   - Выберите нужные файлы/папки
   - Перетащите их в локальную папку `F:\New site\deploy\`
   - Или используйте правую кнопку → Copy

## Вариант 3: Через Git (если изменения были закоммичены)

```powershell
cd "F:\New site\deploy"
git pull origin main
```

## Вариант 4: Скопировать текущие файлы с сервера (не из бэкапа)

```powershell
# Скопировать всю папку проекта
scp -r root@your-server-ip:/opt/arenda-neba/* "F:\New site\deploy\"

# Или только нужные файлы:
scp root@your-server-ip:/opt/arenda-neba/database.db "F:\New site\deploy\database.db"
scp -r root@your-server-ip:/opt/arenda-neba/public "F:\New site\deploy\"
scp root@your-server-ip:/opt/arenda-neba/server.js "F:\New site\deploy\server.js"
```

## Быстрая команда для копирования всего бэкапа

```powershell
# Замените IP и дату бэкапа на реальные значения
$SERVER_IP = "your-server-ip"
$BACKUP_DATE = "2026-01-04_12-30-00"

# Создайте папку для бэкапа
New-Item -ItemType Directory -Force -Path "F:\New site\backups\backup_$BACKUP_DATE"

# Скопируйте весь бэкап
scp -r root@${SERVER_IP}:/opt/arenda-neba/backups/backup_${BACKUP_DATE}/* "F:\New site\backups\backup_${BACKUP_DATE}\"
```

## Восстановление файлов из бэкапа на локальной машине

После копирования бэкапа на локальную машину:

```powershell
cd "F:\New site\deploy"

# Восстановить базу данных
Copy-Item "..\backups\backup_2026-01-04_12-30-00\database.db" -Destination "database.db" -Force

# Восстановить папку public
Remove-Item -Recurse -Force "public" -ErrorAction SilentlyContinue
Copy-Item -Recurse "..\backups\backup_2026-01-04_12-30-00\public" -Destination "public"

# Восстановить server.js
Copy-Item "..\backups\backup_2026-01-04_12-30-00\server.js" -Destination "server.js" -Force
```

## Проверка после копирования

```powershell
# Проверьте, что файлы скопировались
Get-ChildItem "F:\New site\deploy\public" | Select-Object Name
Get-Item "F:\New site\deploy\database.db" | Select-Object Length, LastWriteTime
```

## Важные замечания

⚠️ **Перед копированием:**
- Убедитесь, что у вас есть доступ к серверу (SSH ключ или пароль)
- Проверьте путь к бэкапу на сервере
- Создайте резервную копию текущих локальных файлов

⚠️ **После копирования:**
- Проверьте, что файлы скопировались полностью
- Убедитесь, что размеры файлов совпадают
- При необходимости перезапустите локальный сервер

