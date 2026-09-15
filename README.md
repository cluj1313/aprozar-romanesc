# Aprozar Românesc

Codul sursă al aplicației: piețe locale, fermieri, coș, comenzi, reclame, admin.

## Ce trebuie pe calculator

- Node.js 22 sau mai nou
- npm

## Pornire

```bash
npm install
npm run dev
```

Apoi deschizi în browser adresa pe care o afișează terminalul (de obicei `http://localhost:8080`).

Pentru versiunea de producție:

```bash
npm run build
npm run preview
```

## Unde e ce

| Folder | Conținut |
|---|---|
| `src/routes` | paginile (Acasă, produse, coș, admin, cont…) |
| `src/components` | ecranele și butoanele |
| `src/lib` | prețuri, reclame, catalog, admin, baza de date |
| `public/images` | pozele din tarabă |
| `migrations` | tabelele bazei de date |

Baza de date pornește local (PGLite). Dacă pui `DATABASE_URL` către Postgres, folosește Postgres.

Adminul e pagina `/admin`. Intrarea e cu numele, emailul și telefonul pe care le-ai setat în aplicație.

Aplicația a fost construită în Grok Build. Poți continua pe calculatorul tău sau pe GitHub.
