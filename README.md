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

Данные лежат в Firestore по пути `users/{uid}/categories/{id}`; правила разрешают
каждому пользователю доступ только к своим данным.
