# FitTracker — PWA трекер тренировок

Мобильное PWA приложение для трекинга тренировок с AI-генерацией программ.

## Стек

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Zustand** + localStorage для состояния (готово к замене на API)
- **Framer Motion** для анимаций (сворачивание календаря, переходы шагов)
- **date-fns** для работы с датами (русская локаль)
- **lucide-react** иконки
- PWA: manifest + service worker (минимальный shell-cache)

## Запуск

```bash
cd fittracker
npm install
npm run dev
```

Открыть `http://localhost:3000`. Чтобы проверить как PWA — в Chrome DevTools → Application → Manifest, или `npm run build && npm start` (SW активен только в production).

## Переменные окружения (`.env`)

```bash
DATABASE_URL="file:./prisma/dev.db"   # libSQL/Turso connection string (локально — sqlite file)
JWT_SECRET="..."                      # секрет для подписи cookie пользователя и админа

# Email-верификация (опционально)
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM="Ai Gymly"
APP_URL="http://localhost:3000"

# Админ-панель — бутстрап первого администратора
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="смените-меня"

# OpenAI — опциональный фолбэк. Основной ключ задаётся в админке (/admin/settings)
OPENAI_API_KEY=""

# T-Bank эквайринг — опциональный фолбэк. Основные реквизиты задаются в админке
# (/admin/settings). Приоритет у значений из БД; env используется, если в БД пусто.
TBANK_TERMINAL_KEY=""
TBANK_PASSWORD=""

# Путь к PEM с корневым (и подчинённым) сертификатом Russian Trusted Root CA
# (Минцифры). Нужен, чтобы Node доверял TLS-цепочке securepay.tinkoff.ru.
# Добавляется поверх стандартных корней (проверка TLS не отключается).
TBANK_CA_CERT_PATH=""

# Автосписание подписок (cron). CRON_SECRET защищает POST /api/cron/charge-subscriptions.
CRON_SECRET=""

# Шифрование секретов в БД (ключи OpenAI/T-Bank, пароль терминала). AES-256-GCM.
# 64 hex-символа (32 байта) — используется как ключ напрямую; иначе строка
# хешируется в ключ (SHA-256). Если не задан — секреты хранятся в открытом виде.
# Сгенерировать: openssl rand -hex 32
SETTINGS_ENCRYPTION_KEY=""
```

> **Секреты в БД шифруются.** Значения ключей/паролей, введённые в админке,
> сохраняются зашифрованными (AES-256-GCM) с префиксом `enc:v1:`. Ранее
> сохранённые открытым текстом значения продолжают читаться и перешифровываются
> при следующем сохранении. Меняя `SETTINGS_ENCRYPTION_KEY`, заново введите
> секреты в админке (старые значения не расшифруются).

> `APP_URL` также используется как базовый адрес для колбэков T-Bank
> (`NotificationURL`/`SuccessURL`/`FailURL`). На проде задайте публичный HTTPS-URL.

После изменения схемы Prisma: `npx prisma migrate dev`.

### Деплой

На проде после `git pull` нужно применить миграции к боевой БД **до** пересборки — иначе Prisma-клиент будет знать про новые колонки, которых ещё нет в базе (ошибки вида `SQLITE_ERROR: no such column`):

Рекомендуемая последовательность (миграции — строго **до** перезапуска):

```bash
git pull
npm ci                 # если менялись зависимости
npm run migrate:deploy # применить новые миграции к боевой БД
npm run build          # prisma generate && next build
pm2 restart aigymly
```

Короткий вариант: `npm run deploy` (`prisma migrate deploy && prisma generate && next build`), затем `pm2 restart aigymly`.

Проверить состояние миграций — `npx prisma migrate status` (все должны быть *Applied*).

> **Подстраховка:** скрипт `start` теперь сам прогоняет `prisma migrate deploy` перед `next start`,
> поэтому `pm2 restart aigymly` донакатит недостающие миграции — **но только если процесс запущен
> как `npm start`**. Если он поднят через `next start`/ecosystem-файл, обязательно выполняйте
> `npm run migrate:deploy` вручную. Забытая миграция проявляется ошибкой вида
> `SQLITE_ERROR: no such table: ...` в `pm2 logs aigymly` — лечится тем же `npm run migrate:deploy`.

## Админ-панель (`/admin`)

- Вход по логину/паролю администратора (`/admin/login`). Первый админ создаётся автоматически из `ADMIN_USERNAME`/`ADMIN_PASSWORD` при первом входе и сохраняется в БД (таблица `Admin`).
- **Пользователи** — таблица зарегистрированных пользователей с датой регистрации, статусом подтверждения email, числом тренировок и программ.
- **Настройки** — ввод API-ключа OpenAI и выбор модели, а также реквизиты T-Bank (Terminal Key, пароль, контур test/боевой, параметры чека 54-ФЗ) (`/admin/settings`). Секреты хранятся в БД (таблица `Setting`) и не возвращаются клиенту в открытом виде.
- **Тарифы** — CRUD планов подписки (`/admin/plans`): название, цена (в рублях, хранится в копейках), период в днях, активность, порядок. По умолчанию засеяны три тарифа: 499 ₽/мес, 2990 ₽/полгода, 4990 ₽/год.

## Подписка и оплата (T-Bank)

Бесплатно доступны календарь, статистика с AI-анализом и **одна** программа от AI. По подписке
Ai Gymly Pro открываются AI-чат и создание дополнительных программ.

- Планы и цены редактируются в админке (`/admin/plans`); реквизиты терминала — в настройках.
- Оформление: `/subscribe` → `POST /api/payments/create` вызывает T-Bank `Init`
  (`Recurrent=Y`, `CustomerKey`, фискальный `Receipt`) и редиректит на форму оплаты.
- Вебхук `POST /api/payments/notification` проверяет подпись и активирует/продлевает подписку.
- Автопродление: внешний планировщик раз в день вызывает
  `POST /api/cron/charge-subscriptions` с заголовком `Authorization: Bearer $CRON_SECRET`;
  роут списывает по сохранённому `RebillId` (`Init` без `Recurrent` → `Charge`).

  В репозитории есть готовый скрипт `scripts/charge-subscriptions.sh`: он подхватывает
  `APP_URL` и `CRON_SECRET` из окружения (или из `.env.local` / `.env` проекта), делает
  POST-запрос и завершается с ненулевым кодом при ошибке (удобно для мониторинга).

  Установка в системный cron (например, каждый день в 03:00):

  ```bash
  chmod +x scripts/charge-subscriptions.sh
  crontab -e
  # добавить строку (укажите абсолютный путь к проекту и лог):
  0 3 * * * /path/to/aigymly/scripts/charge-subscriptions.sh >> /var/log/aigymly-cron.log 2>&1
  ```

  Если переменные не лежат в `.env`, задайте их прямо в crontab:

  ```bash
  0 3 * * * APP_URL=https://aigymly.example.com CRON_SECRET=xxxx /path/to/aigymly/scripts/charge-subscriptions.sh >> /var/log/aigymly-cron.log 2>&1
  ```

  Альтернативы: `curl -fsS -X POST https://<APP_URL>/api/cron/charge-subscriptions -H "Authorization: Bearer $CRON_SECRET"`
  напрямую, либо на Vercel — `vercel.json` `crons` на тот же путь.
- Автопродление можно выключить в профиле (тумблер), тогда подписка завершится в конце периода.

### TLS: доверие к сертификату T-Bank (Russian Trusted Root CA)

`securepay.tinkoff.ru` отдаёт TLS-цепочку с корнем **Russian Trusted Root CA (Минцифры)**,
которого нет в стандартном хранилище Node. Без него запросы к T-Bank падают с
`Error: self-signed certificate in certificate chain` (`SELF_SIGNED_CERT_IN_CHAIN`).
Проверку TLS отключать нельзя (`NODE_TLS_REJECT_UNAUTHORIZED=0` — недопустимо) — нужно
**добавить** российский корень в доверие.

1. Скачайте официальные сертификаты Минцифры (корневой + подчинённый) с Госуслуг
   (`https://www.gosuslugi.ru/crt`) и объедините в один PEM:

   ```bash
   mkdir -p /var/www/aigymly/certs
   # если файлы в DER (.cer): openssl x509 -inform der -in root.cer -out root.pem
   cat russian_trusted_root_ca_pem.crt russian_trusted_sub_ca_pem.crt \
     > /var/www/aigymly/certs/russian-trusted.pem
   # проверка (ожидаем Verify return code: 0 (ok)):
   openssl s_client -connect securepay.tinkoff.ru:443 \
     -CAfile /var/www/aigymly/certs/russian-trusted.pem </dev/null 2>/dev/null | grep "Verify return code"
   ```

2. Включите доверие одним из способов:
   - **Через приложение** (читается из `.env.local`, добавляется поверх стандартных корней):
     `TBANK_CA_CERT_PATH="/var/www/aigymly/certs/russian-trusted.pem"`, затем `pm2 restart aigymly`.
   - **Глобально для Node**: `NODE_EXTRA_CA_CERTS=/var/www/aigymly/certs/russian-trusted.pem` —
     задавать нужно в **процессном** окружении (pm2 ecosystem `env` или экспорт перед стартом;
     в `.env.local` не сработает, т.к. Node читает переменную при запуске), затем
     `pm2 restart aigymly --update-env`.

## AI-генерация программ

После опроса (`/questionnaire`) кнопка «Сгенерировать программу» вызывает `POST /api/ai/generate-program`: ответы анкеты уходят в OpenAI (модель из настроек админки), результат нормализуется в формат `Program` и сохраняется в БД для текущего пользователя. На странице программы (`/programs/[id]`) каждую тренировку можно добавить в календарь на выбранную дату, либо запланировать всю программу сразу по удобным дням недели из опроса.

## Реализованные ключевые экраны

### 1. Главный — календарь + список тренировок (`/`)
- **Сворачиваемый календарь**: переключение неделя ↔ месяц с анимацией высоты через Framer Motion (`Calendar.tsx`)
- Цветные точки-маркеры под датами (до 3 разных типов тренировок)
- Группировка карточек по датам с заголовками вида «24 января, четверг»
- Карточки с эмодзи-аватарами (6 кастомных SVG-смайлов), временем и кнопкой дублирования
- FAB справа внизу для создания
- Empty state, если нет тренировок

### 2. Редактор тренировки (`/workout/[id]` и `/workout/new`)
- Название, дата/время, напоминание
- Список упражнений с раскрывающимися блоками
- **Силовые**: подходы с #, повторы, вес, чекбокс «выполнено», удаление
- **Кардио**: продолжительность в минутах
- Bottom sheet для выбора упражнения из библиотеки (40+ упражнений, поиск + фильтр по группам мышц)
- Bottom bar: Действия / Сохранить / Действия (как в референсе)

### 3. Опросник для AI (`/questionnaire`)
- 10 шагов с прогресс-баром и переходами слайдами
- Вопросы: цель, уровень, биометрия, частота, локация, оборудование, приоритетные мышцы, травмы, расписание, summary
- Кнопка «Сгенерировать программу» с loader-анимацией (готовое место для интеграции Claude/OpenAI API)

### Дополнительно для целостности навигации
- `/programs` — список программ, главный CTA «Программа от AI»
- `/chat` — заглушка AI-чата
- `/stats` — заглушка статистики с подсчётом из стора
- `/profile` — заглушка профиля

## Дизайн-решения

- **Типографика**: Geist (variable) подгружается с jsDelivr — современный, плотный, технологичный шрифт, отлично смотрится в мобильном UI. Tabular-numbers включены для всех дат, времени, чисел.
- **Палитра**:
  - `ink-*` — нейтральная шкала от #F7F8FA до #0B0D12
  - `brand` = #2F6BFF — синий акцент как в референсах
  - `marker-*` — 8 цветов для тегов тренировок
- **Спейсинг**: всё по сетке 4px, скругления 14px/20px/28px
- **Карточки**: тонкая тень + 1px бордер через box-shadow (читаемее, чем border)
- **Анимации**: только в местах, где это даёт смысл — раскрытие календаря, разворот деталей упражнения, переход между шагами опросника, ripple при тапе

## Архитектура состояния

`src/store/app.ts` — Zustand-стор с персистом в `localStorage`. Все CRUD операции для тренировок, упражнений и подходов плюс ответы опросника. Замена на серверные API позже — точечная: подменяются методы, не структура.

## Что нужно дальше (по твоему ТЗ, не вошло в этот итерат)

- **Auth по email** с подтверждением: страница `/auth`, API роут `/api/auth/signup` + email-провайдер (Resend/Postmark), JWT в HTTP-only cookie
- **AI генерация программы**: API роут `/api/ai/generate-program` с вызовом Claude API, system prompt с правилами безопасности тренировок, JSON-output → запись в стор как массив `Workout[]`
- **AI чат**: streaming через `app/api/chat/route.ts`, история в БД, контекст из последних N тренировок и ответов опросника
- **AI сводка статистики**: периодически генерируемая (или по запросу) сводка по `workouts[]`
- **БД**: Postgres + Prisma. Модели: `User`, `Workout`, `Exercise`, `ExerciseSet`, `Questionnaire`, `Program`, `ChatMessage`
- **Иконки PWA**: положить `/public/icon-192.png` и `/public/icon-512.png` (сейчас в манифесте указаны, но самих файлов нет — поставь любые до прод-деплоя)

## Структура

```
src/
├── app/
│   ├── layout.tsx              # корневой layout, PWA meta, SW reg
│   ├── globals.css             # шрифты, базовые стили, tappable
│   ├── page.tsx                # главный экран — календарь + список
│   ├── workout/[id]/page.tsx   # редактор тренировки
│   ├── questionnaire/page.tsx  # многошаговый AI-опросник
│   ├── programs/page.tsx
│   ├── chat/page.tsx
│   ├── stats/page.tsx
│   └── profile/page.tsx
├── components/
│   ├── Calendar.tsx            # сворачиваемый календарь
│   ├── WorkoutCard.tsx
│   ├── ExerciseRow.tsx         # раскрывающаяся карточка упражнения
│   ├── ExercisePicker.tsx      # bottom sheet выбора из библиотеки
│   ├── EmojiFace.tsx           # 6 кастомных SVG-эмодзи
│   ├── BottomNav.tsx
│   └── ServiceWorkerRegister.tsx
├── store/app.ts                # Zustand стор
├── lib/
│   ├── utils.ts
│   └── exercises.ts            # библиотека из 40+ упражнений
└── types/index.ts
```
