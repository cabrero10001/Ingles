# LinguaPath

Aplicacion web para aprender ingles con rutas personalizadas por objetivo, lecciones diarias, deteccion de errores y retos interactivos.

## Estructura del proyecto

- `client/`: Frontend (Vite + React + TypeScript + Tailwind)
- `backend/`: API (Node.js + Express + TypeScript + Prisma)

## Requisitos

- Node.js 18+
- PostgreSQL 14+

## Variables de entorno

### Backend

Archivo: `backend/.env`

Variables base:

```env
NODE_ENV=development
PORT=4000
CORS_ORIGINS=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/linguapath?schema=public
JWT_ACCESS_SECRET=change-me-access-secret
JWT_REFRESH_SECRET=change-me-refresh-secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
REFRESH_COOKIE_NAME=lp_refresh
REFRESH_COOKIE_SECURE=false
REFRESH_COOKIE_SAMESITE=lax
AI_ANALYZER_ENABLED=false
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

### Frontend

Archivo: `client/.env`

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

## Instalacion

```bash
npm --prefix backend i
npm --prefix client i
```

## Base de datos (Prisma)

```bash
npm --prefix backend run prisma:generate
npm --prefix backend run prisma:migrate
npm --prefix backend run prisma:seed
```

## Ejecutar en desarrollo

Terminal 1 (API):

```bash
npm --prefix backend run dev
```

Terminal 2 (Frontend):

```bash
npm --prefix client run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## Scripts utiles

### Root

- `npm run dev:client`
- `npm run dev:backend`
- `npm run build:client`
- `npm run build:backend`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:seed`

### Backend

- `npm --prefix backend run dev`
- `npm --prefix backend run build`
- `npm --prefix backend run start`

### Frontend

- `npm --prefix client run dev`
- `npm --prefix client run build`

## Endpoints principales (MVP)

### Auth y usuario

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/me`
- `POST /api/goal`

### Lecciones y errores

- `GET /api/lessons/today`
- `POST /api/lessons/complete`
- `GET /api/errors/top`
- `GET /api/errors/history`

### Retos diarios

- `GET /api/challenges/today`
- `GET /api/challenges/stats`
- `POST /api/challenges/answer`

### Conversaciones con IA

- `GET /api/ai-conversations/personas`
- `POST /api/ai-conversations/start`
- `GET /api/ai-conversations/:sessionId`
- `POST /api/ai-conversations/:sessionId/message`

## Funcionalidades actuales

- Registro/login con JWT + refresh token en cookie httpOnly
- Seleccion de objetivo de aprendizaje
- Reto de 30 dias con actividad alternada (writing o conversacion)
- Detector de errores (reglas + opcion IA)
- Dashboard con progreso, racha y errores frecuentes
- Retos diarios de opcion multiple con puntos semanales
- Conversacion IA por contexto (barista, reclutador, amigo extranjero)

## Troubleshooting rapido

- Si backend no inicia por Prisma:
  - Verifica `DATABASE_URL`
  - Ejecuta `npm --prefix backend run prisma:generate`
  - Ejecuta `npm --prefix backend run prisma:migrate`
- Si frontend no conecta al backend:
  - Verifica `VITE_API_BASE_URL` en `client/.env`
  - Verifica que backend este corriendo en puerto `4000`

## Deploy en Railway

Recomendado: 2 servicios separados en el mismo repo (backend + client).

### 1) Backend Service

- En Railway crea un servicio desde este repo.
- En **Root Directory** selecciona `backend`.
- Railway usara `backend/railway.json`:
  - Build: `npm install && npm run build`
  - Start: `npm run start:railway`
- Agrega variables de entorno del backend:
  - `DATABASE_URL` (usa Postgres de Railway)
  - `JWT_ACCESS_SECRET`
  - `JWT_REFRESH_SECRET`
  - `CORS_ORIGINS` (pon el dominio del frontend Railway)
  - opcionales IA: `AI_ANALYZER_ENABLED`, `OPENAI_API_KEY`, `OPENAI_MODEL`

### 2) Client Service

- Crea otro servicio desde el mismo repo.
- En **Root Directory** selecciona `client`.
- Railway usara `client/railway.json`:
  - Build: `npm install && npm run build`
  - Start: `npm run start`
- Variables frontend:
  - `VITE_API_BASE_URL=https://<tu-backend>.up.railway.app/api`

### 3) Post deploy checklist

- Verifica backend health: `https://<tu-backend>.up.railway.app/api/health`
- Verifica login/register desde frontend.
- Si CORS falla, revisa `CORS_ORIGINS` (separa multiples dominios por coma).
