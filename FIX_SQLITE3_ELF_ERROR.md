# 🔧 Исправление ошибки sqlite3: invalid ELF header

**Ошибка:** `Error: /opt/arenda-neba/node_modules/sqlite3/build/Release/node_sqlite3.node: invalid ELF header`

**Причина:** Модуль `sqlite3` был скомпилирован на другой платформе (Windows), а сервер работает на Linux. Нативные модули должны быть скомпилированы для конкретной ОС.

---

## ✅ БЫСТРОЕ РЕШЕНИЕ

Выполните на сервере:

```bash
cd /opt/arenda-neba

# 1. Остановите приложение
pm2 stop arenda-neba

# 2. Удалите node_modules и package-lock.json
rm -rf node_modules package-lock.json

# 3. Убедитесь, что установлены инструменты для компиляции
sudo apt-get update
sudo apt-get install -y build-essential python3

# 4. Переустановите зависимости (скомпилируются для Linux)
npm install

# 5. Запустите приложение
pm2 start server.js --name arenda-neba
pm2 save

# 6. Проверьте логи
pm2 logs arenda-neba --lines 20
```

---

## 🔍 ПОДРОБНАЯ ИНСТРУКЦИЯ

### Шаг 1: Остановите приложение

```bash
pm2 stop arenda-neba
```

### Шаг 2: Удалите старые модули

```bash
cd /opt/arenda-neba
rm -rf node_modules package-lock.json
```

**Важно:** Удаляйте `node_modules` и `package-lock.json`, чтобы заставить npm пересобрать нативные модули.

### Шаг 3: Установите инструменты для компиляции (если еще не установлены)

```bash
sudo apt-get update
sudo apt-get install -y build-essential python3
```

Эти инструменты нужны для компиляции нативных модулей Node.js.

### Шаг 4: Переустановите зависимости

```bash
npm install
```

Это займет несколько минут, так как `sqlite3` будет компилироваться из исходников для Linux.

### Шаг 5: Проверьте, что модуль установлен правильно

```bash
# Проверьте, что файл существует и имеет правильный формат
file node_modules/sqlite3/build/Release/node_sqlite3.node
```

Должно показать что-то вроде:
```
node_sqlite3.node: ELF 64-bit LSB shared object, x86-64, version 1 (SYSV), dynamically linked
```

### Шаг 6: Запустите приложение

```bash
pm2 start server.js --name arenda-neba
pm2 save
```

### Шаг 7: Проверьте логи

```bash
pm2 logs arenda-neba --lines 20
```

Не должно быть ошибок `invalid ELF header`.

---

## 🚨 ЕСЛИ ОШИБКА ПОВТОРЯЕТСЯ

### Вариант 1: Пересоберите только sqlite3

```bash
cd /opt/arenda-neba
npm rebuild sqlite3
pm2 restart arenda-neba
```

### Вариант 2: Используйте предкомпилированные бинарники

```bash
cd /opt/arenda-neba
npm install sqlite3 --build-from-source=false
pm2 restart arenda-neba
```

### Вариант 3: Проверьте версию Node.js

```bash
node --version
```

Убедитесь, что версия Node.js на сервере совместима. Рекомендуется Node.js 18.x или 20.x.

---

## 🛡️ ПРЕДОТВРАЩЕНИЕ ПРОБЛЕМЫ В БУДУЩЕМ

### 1. Добавьте в `.gitignore`:

```
node_modules/
package-lock.json
```

**Важно:** `package-lock.json` можно коммитить, но если возникают проблемы с платформами, лучше его не коммитить или использовать `npm ci` вместо `npm install`.

### 2. В `deploy.sh` всегда переустанавливайте зависимости:

```bash
#!/bin/bash
cd /opt/arenda-neba
git pull origin main
npm install  # Это пересоберет нативные модули для Linux
pm2 restart arenda-neba
```

### 3. Используйте `.npmrc` для принудительной пересборки:

Создайте файл `.npmrc` в корне проекта:

```
build-from-source=true
```

---

## 📋 ПРОВЕРКА ПОСЛЕ ИСПРАВЛЕНИЯ

1. **Проверьте статус:**
   ```bash
   pm2 status
   ```
   Должен быть `online`.

2. **Проверьте логи:**
   ```bash
   pm2 logs arenda-neba --lines 10
   ```
   Не должно быть ошибок.

3. **Проверьте доступность:**
   ```bash
   curl http://localhost:3000
   ```
   Должен вернуть HTML.

4. **Проверьте сайт в браузере:**
   Откройте сайт - должен загрузиться без ошибок.

---

## 🔧 АЛЬТЕРНАТИВНОЕ РЕШЕНИЕ (если компиляция не работает)

Если компиляция не работает, можно использовать альтернативную библиотеку:

```bash
cd /opt/arenda-neba

# Удалите sqlite3
npm uninstall sqlite3

# Установите better-sqlite3 (быстрее и проще)
npm install better-sqlite3

# Обновите server.js для использования better-sqlite3
# (требуются изменения в коде)
```

Но это потребует изменений в коде. Лучше исправить проблему с `sqlite3`.

---

## ✅ ГОТОВО

После выполнения всех шагов приложение должно работать корректно.

**Если проблема осталась, пришлите:**
- Вывод `node --version`
- Вывод `npm --version`
- Вывод `pm2 logs arenda-neba --lines 50`
- Вывод `file node_modules/sqlite3/build/Release/node_sqlite3.node`
