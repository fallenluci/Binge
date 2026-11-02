# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Синхронизация между устройствами (Firebase)

Без настройки приложение работает как раньше — данные хранятся только в браузере.
Чтобы включить вход по email и одинаковый список на телефоне и ПК:

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project** (Google Analytics можно выключить).
2. **Build → Authentication → Get started → Email/Password → Enable**.
3. **Build → Firestore Database → Create database** → регион `eur3 (europe)` → *production mode*.
   Во вкладке **Rules** вставь содержимое файла `firestore.rules` → **Publish**.
4. ⚙️ **Project settings → Your apps → Web (`</>`)** → зарегистрируй приложение и скопируй
   `apiKey`, `authDomain`, `projectId`, `appId`.
5. **Authentication → Settings → Authorized domains** → добавь домен сайта (например `binge-gold.vercel.app`).
6. **Vercel → проект → Settings → Environment Variables** → добавь 4 переменные из `.env.example`
   → **Deployments → Redeploy**.
7. Для локального запуска: скопируй `.env.example` в `.env.local` и заполни те же значения.

Данные лежат в Firestore по путям `users/{uid}/categories/{id}` и `users/{uid}/profile/main` (имя, аватар, баннер); правила разрешают
каждому пользователю доступ только к своим данным.

## Постеры фильмов (TMDB)

Постеры подтягиваются из [TMDB](https://www.themoviedb.org) через серверную функцию `api/tmdb.js`
на Vercel (TMDB недоступен из России напрямую, серверы Vercel — доступны; ключ остаётся на сервере).

1. Зарегистрируйся на themoviedb.org → Settings → API → получи ключ (подойдёт и «API Key», и «API Read Access Token»).
2. Vercel → проект → Settings → Environment Variables → `TMDB_API_KEY` = ключ (без приставки `VITE_`).
3. Redeploy. Постеры для всех фильмов найдутся сами в фоне; неверный можно поменять в меню фильма → «Выбрать постер».

## Публичный профиль, друзья и общие категории

- Профиль открывается по ссылке `/u/<id>` (и по QR-коду) — даже без аккаунта.
- Категорию можно сделать публичной (видна в профиле) или открыть по ссылке; друзьям её можно отправить.
- Друзья — взаимные заявки. Отправленные тебе категории — в «Профиль → Друзья → Поделились с тобой».

**После обновления обязательно опубликуй новые правила**: Firebase Console → Firestore Database →
Rules → вставь содержимое `firestore.rules` → Publish. Без этого публичные профили и друзья не заработают.
`vercel.json` нужен, чтобы ссылки вида `/u/...` открывались на Vercel.
