# TaskManagerApp (React Native + Expo)

Jednoduchý Task Manager pre portfólio:

- Add / toggle / delete tasks
- Filtre: All / Active / Completed
- Persistencia cez AsyncStorage
- Safe-area a StatusBar pre iOS/Android

## Tech stack

- Expo (React Native, TypeScript)
- AsyncStorage
- Expo Router

## Lokálny beh

````bash
npm install
npm start


Lint & Format
npm run lint
npm run format

Štruktúra

app/(tabs)/tasks.tsx – hlavná obrazovka

app/(tabs)/index.tsx – home

app/(tabs)/about.tsx – info

Roadmap

Editácia tasku

Notifikácie (remindery)

Sync (Supabase/Firebase)


---

## 4) Husky + lint-staged (auto kontrola pred commitom)
```bash
npm i -D husky lint-staged
npx husky init
````
