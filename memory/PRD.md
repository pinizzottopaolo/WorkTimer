# WorkTimer - PRD

## Problem Statement
App per gestire i tempi di lavoro (SCHEDA LAV. CONFEZIONE) con operazioni come Taglio, Rilegatura, Incollaggio, Fustellatura, Plastificazione, Impacchettamento.

## User Personas
- **Admin**: Gestisce utenti, visualizza report globali, accesso completo
- **Operatore**: Crea e gestisce le proprie schede lavoro, registra tempi

## Core Requirements
- ✅ Autenticazione multi-ruolo (admin/operatore)
- ✅ Gestione Clienti (CRUD)
- ✅ Gestione Operazioni Template (dinamiche)
- ✅ Schede Lavoro con operazioni, quantità, tempi stimati/effettivi
- ✅ Timer integrato per registrare tempi in tempo reale
- ✅ Inserimento manuale tempi
- ✅ Report e statistiche (per cliente, operatore, periodo, operazione)
- ✅ Export Excel
- ✅ Tema scuro moderno industriale

## What's Been Implemented (05/04/2026)
### Backend (FastAPI + MongoDB)
- JWT Authentication con httpOnly cookies
- Brute force protection
- Admin seeding automatico
- API complete per: auth, clienti, operazioni-template, schede-lavoro, stats
- Report aggregati per cliente/operatore/periodo/operazione

### Frontend (React + Tailwind + Shadcn)
- Login/Register con tema scuro industriale
- Dashboard con statistiche overview
- Gestione Schede Lavoro (lista, dettaglio, form con timer)
- Gestione Clienti
- Gestione Operazioni Template
- Report con grafici (Recharts)
- Pannello Admin per gestione ruoli
- Export Excel con xlsx

## Architecture
```
Frontend (React) --> Backend (FastAPI) --> MongoDB
     |                    |
  Shadcn UI          JWT Auth
  Recharts           Motor (async)
  Phosphor Icons
```

## Prioritized Backlog
### P0 (Done)
- [x] Auth completa
- [x] CRUD schede lavoro
- [x] Timer operazioni
- [x] Report base

### P1 (Next)
- [ ] Notifiche in-app quando timer attivo da troppo tempo
- [ ] Filtri avanzati per schede
- [ ] Duplicazione schede

### P2 (Future)
- [ ] PDF export
- [ ] Firma digitale su scheda completata
- [ ] Integrazione calendario

## Test Credentials
- Admin: admin@worktimer.com / Admin123!

## Tech Stack
- Backend: FastAPI, Motor, PyJWT, bcrypt
- Frontend: React 19, Tailwind CSS, Shadcn/UI, Recharts, Phosphor Icons
- Database: MongoDB
