# Drop Evolution

**Drop Evolution** è una piattaforma SaaS per l'automazione del dropshipping, sviluppata con un backend Python (FastAPI), un frontend in Next.js e database PostgreSQL.

## 🚀 Funzionalità principali
- Importazione automatica di prodotti
- Monitoraggio prezzi e disponibilità in tempo reale
- Generazione automatica di titoli e descrizioni via AI (OpenAI API)
- Dashboard intuitiva per gestione ordini e utenti
- Integrazione con Stripe per abbonamenti ricorrenti

## 🛠 Stack tecnologico
- **Backend**: Python, FastAPI
- **Frontend**: Next.js, React
- **Database**: PostgreSQL
- **Automazione**: Selenium
- **Autenticazione**: Firebase Auth
- **Pagamenti**: Stripe

## 📂 Installazione e avvio rapido

### Backend:
1. Vai nella cartella `backend`
2. Assicurati di avere Docker installato
3. Avvia con Docker o con:
```
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend:
1. Vai nella cartella `frontend`
2. Installa le dipendenze:
```
npm install
```
3. Avvia il frontend:
```
npm run dev
```

### Con Docker Compose (consigliato):
Dalla root del progetto:
```
docker-compose up --build
```

## 📜 Licenza
Questo progetto è rilasciato sotto licenza MIT.

## 👤 Autore
Luca — [GitHub/lukeeterna](https://github.com/lukeeterna)
