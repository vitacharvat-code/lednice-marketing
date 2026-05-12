# Lednice Marketing Kalendář

Roční marketingový plán pro **Pivovar Lednice** a **Resort Lednice**.

## Stack

- **Next.js 14** (App Router)
- **Vercel KV** (Redis) — sdílená data pro všechny uživatele
- **TypeScript**

---

## Nasazení (krok za krokem)

### 1. GitHub

```bash
git init
git add .
git commit -m "init: lednice marketing calendar"
```

Vytvoř nový repozitář na [github.com/new](https://github.com/new), pak:

```bash
git remote add origin https://github.com/TVUJ-USERNAME/lednice-marketing.git
git branch -M main
git push -u origin main
```

---

### 2. Vercel — deploy

1. Jdi na [vercel.com/new](https://vercel.com/new)
2. Importuj svůj GitHub repozitář
3. Klikni **Deploy** (bez dalšího nastavení)

---

### 3. Vercel KV — databáze

1. V Vercel dashboardu jdi na **Storage** → **Create Database** → **KV**
2. Pojmenuj ji např. `lednice-kv`
3. Klikni **Connect to Project** a vyber svůj projekt
4. Vercel automaticky přidá env proměnné do projektu

> Pro lokální vývoj: klikni na KV store → **`.env.local`** tab → zkopíruj proměnné do souboru `.env.local`

---

### 4. Redeploy (po propojení KV)

V Vercel dashboardu: **Deployments** → tři tečky u posledního deploye → **Redeploy**.

---

## Lokální vývoj

```bash
npm install
cp .env.local.example .env.local
# Doplň hodnoty z Vercel KV dashboardu
npm run dev
```

Otevři [http://localhost:3000](http://localhost:3000)

---

## Přidání nových služeb nebo typů aktivit

Edituj soubor `app/components/data.ts` — tam jsou všechny konfigurace služeb, sezónnosti a typů aktivit.
