# Aprozar Românesc

Codul sursă al aplicației de pe https://aprozar-romanesc-ro.grok.me/

## Pornire

```bash
npm install
npm run dev
```

Apoi deschizi http://localhost:8080

Pe Windows, dacă `npm run dev` dă `spawn vite ENOENT`:

```powershell
$env:CHOKIDAR_USEPOLLING = "1"
.\\node_modules\\.bin\\vite.cmd dev --host 127.0.0.1 --port 8080
```

| Folder | Conținut |
|---|---|
| `src/routes` | paginile |
| `src/components` | ecranele |
| `src/lib` | reclame, catalog, admin |
| `migrations` | tabelele |
