# Lugati

A mobile app to build and practice your Arabic vocabulary. Everything stays on your device—no account required.

---

## What you can do

### Home

- See how many words you have saved.
- Glance at quiz progress (how many answers you’ve given and your accuracy).
- Open the **Quiz** or **Add Vocabulary** in one tap.
- Browse the last few words you added and jump to any of them.

### Vocabulary

Each word is a **card** with:

- Arabic word and English meaning
- Up to **3 example sentences** (each can have its own meaning)
- Optional **notes** (description)
- Optional **photo** from your gallery

**List screen**

- Search your collection.
- Add a new word.
- Open a word to read the full card.
- **Edit** or **delete** a single word from the detail or edit screen.

**Import & export**

- **Export** your words to a JSON file and share it (all words or a hand-picked set).
- **Import** a JSON file from someone else or from a backup.
  - Choose **Skip duplicates** (same Arabic + meaning) or **Import all**.

**Bulk delete**

- Delete selected words, or delete everything (with a confirmation).
- If you’re searching, “delete all” applies only to words that match the search.

### Quiz

- You need **at least 2 words** with **different meanings** before a quiz can start.
- Pick how many questions (presets like 5, 10, 20, or type your own).
- Each question shows an **Arabic word**; you pick the correct **English meaning** from multiple choices.
- **10 seconds** per question—if time runs out, the answer counts as wrong.
- After each answer you see whether you were right or wrong.
- At the end you get a **score**, accuracy, and a short review of each question.
- Words you miss often are **more likely** to appear again in future quizzes.
- Leaving mid-quiz saves answers you already gave; the rest of that run is dropped.

### First launch

- On a fresh install, the app creates a local database and adds a small **starter set** of vocabulary so you can try the app immediately.

### Privacy & data

- **Offline first**: vocabulary and quiz history live in **SQLite** on your phone.
- There is **no sign-in** today. Stats are tied to a single local “user” row so real accounts could be added later without breaking stored data.

---

## How the app is organized (for developers)

Think of the flow in layers:

```text
Screens (UI)  →  Services (rules)  →  Repositories (SQL)  →  SQLite
```

| Area | Role |
|------|------|
| `src/app/` | Routes ([Expo Router](https://docs.expo.dev/router/introduction/)). File name = URL path. |
| `src/features/` | Vocabulary, quiz, auth (local user), review helpers—each with screens, services, repos, types. |
| `src/db/` | Database open, **migrations**, and **seed** data. |
| `src/components/` | Shared UI (buttons, headers, forms). |
| `src/constants/theme.ts` | Colors, spacing, typography tokens. |

**Main routes**

| Path | Screen |
|------|--------|
| `/` | Home |
| `/vocabulary` | Word list |
| `/vocabulary/new` | Add word |
| `/vocabulary/[id]` | Word detail |
| `/vocabulary/[id]/edit` | Edit word |
| `/quiz` | Quiz setup |
| `/quiz/session` | Live quiz |

**Startup**

1. `_layout.tsx` runs `initializeDatabase()`.
2. Migrations bring the schema up to date (vocabulary, examples, quiz tables, etc.).
3. Seed runs once per missing starter word.
4. Then the router shows your screens.

**Validation**

- Forms use **react-hook-form** + **Zod** schemas (vocabulary and quiz settings).
- Import files are validated against a versioned JSON export format.

---

## Download the Android app (APK)

Anyone can install the latest Android build from GitHub—no account required in the app itself.

- **Latest APK:** [github.com/shamsfarabii/Arabiyyah/releases/latest/download/Lugati.apk](https://github.com/shamsfarabii/Arabiyyah/releases/latest/download/Lugati.apk)
- **All releases:** [github.com/shamsfarabii/Arabiyyah/releases/latest](https://github.com/shamsfarabii/Arabiyyah/releases/latest)

Inside the app, open **Settings** for the same download links.

Maintainers: push a version tag from **current `main`** (e.g. `v1.0.1`). The workflow file at that tag is what runs—an older tag like `v1.0.0` will not pick up workflow fixes on `main`. Alternatively, run **Release APK** manually from the `main` branch on GitHub Actions.

---

## Get started

**Requirements:** Node.js and npm. For device builds, Android Studio and/or Xcode as needed.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the dev server:

   ```bash
   npm start
   ```

   Then open **iOS simulator**, **Android emulator**, or **Expo Go** from the menu.

**Other useful commands**

| Command | What it does |
|---------|----------------|
| `npm run android` | Run on Android (native) |
| `npm run ios` | Run on iOS (native) |
| `npm run web` | Run in the browser |
| `npm run lint` | ESLint |
| `npm run build:apk` | Local release APK (Android prebuild + Gradle) |

**EAS (cloud builds)** — profiles live in `eas.json` (`development`, `preview`, `production`). Use the [EAS CLI](https://docs.expo.dev/build/introduction/) when you want builds outside your machine.

---

## Typical learning workflow (using the app)

1. **Add words** from Home or the vocabulary list (or **import** a shared JSON file).
2. **Review cards** on the detail screen when you want context, examples, or a photo.
3. **Take a quiz** when you have at least two distinct meanings in your list.
4. **Export** your collection to back up or share with another device/user.
5. Repeat—quizzes gradually favor words you still struggle with.

---

## Tech stack (short)

- [Expo](https://expo.dev) ~57, [React Native](https://reactnative.dev), [Expo Router](https://docs.expo.dev/router/introduction/)
- [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) for local storage
- TypeScript, Zod, react-hook-form
- Document picker, file system, sharing, and image picker for import/export and photos

---

## License

See [LICENSE](./LICENSE).
