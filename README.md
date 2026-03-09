# Impostor Monorepo

Aplicacion multijugador tipo Impostor, organizada como monorepo con frontend y backend en TypeScript.

## Stack Tecnico

- Monorepo: pnpm workspaces
- Frontend: React 19, Vite, TypeScript, Tailwind CSS
- Backend: NestJS, TypeScript, Socket.IO
- Base de datos: MongoDB
- Cache/cola (configurable): Redis
- Tipos compartidos: `@impostor/types` (workspace package)

## Estructura del Proyecto

```txt
apps/
  backend/      # API REST + WebSocket gateway (NestJS)
  frontend/     # Cliente web (React + Vite)
packages/
  types/        # Contratos de tipos compartidos FE/BE
```

## Requisitos Previos

Instala antes de ejecutar:

1. Node.js >= 20
2. pnpm >= 10
3. MongoDB en ejecucion (local o remoto)
4. Redis disponible (si tu configuracion backend lo requiere)

Verifica versiones:

```bash
node -v
pnpm -v
```

## Instalacion

Desde la raiz del proyecto:

```bash
pnpm install
```

## Configuracion de Entorno

### Backend

Archivo: `apps/backend/.env`
Puedes basarte en `apps/backend/.env.example`.

Variables minimas recomendadas:

```env
NODE_ENV=development
PORT=3001
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=24h
MONGODB_URI=mongodb://localhost:27017/impostor
REDIS_URL=redis://localhost:6379
ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend

Archivo: `apps/frontend/.env`
Puedes basarte en `apps/frontend/.env.example`.

```env
VITE_SERVER_URL=http://localhost:3001
```

## Ejecucion en Desarrollo

Desde la raiz (levanta backend + frontend en paralelo):

```bash
pnpm dev
```

Servicios esperados:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

## Scripts Utiles (Raiz)

```bash
pnpm dev          # Ejecuta backend y frontend en paralelo
pnpm build        # Build de backend y frontend
pnpm validate     # Ejecuta format:check + lint:check + types:check en paralelo por app
pnpm lint:check   # Lint en modo verificacion
pnpm lint:fix     # Lint con auto-fix
pnpm test         # Tests de backend y frontend
pnpm types:check  # Verificacion de tipos TS en ambos apps
pnpm format:check # Verifica formato
pnpm format:fix   # Formatea codigo en ambos apps
```

## Scripts por Aplicacion

### Backend

```bash
pnpm --filter ./apps/backend dev
pnpm --filter ./apps/backend build
pnpm --filter ./apps/backend test
pnpm --filter ./apps/backend types:check
pnpm --filter ./apps/backend validate
pnpm --filter ./apps/backend lint:check
pnpm --filter ./apps/backend lint:fix
pnpm --filter ./apps/backend format:check
pnpm --filter ./apps/backend format:fix
```

### Frontend

```bash
pnpm --filter ./apps/frontend dev
pnpm --filter ./apps/frontend build
pnpm --filter ./apps/frontend test
pnpm --filter ./apps/frontend types:check
pnpm --filter ./apps/frontend validate
pnpm --filter ./apps/frontend lint:check
pnpm --filter ./apps/frontend lint:fix
pnpm --filter ./apps/frontend format:check
pnpm --filter ./apps/frontend format:fix
```

## Contratos Compartidos

El paquete `@impostor/types` define contratos comunes para frontend y backend.

Convenciones actuales:

- Identificador de usuario: `userId`
- Resultado de partida: `winner` (singular)

## Troubleshooting Rapido

- Si el frontend no conecta al backend:
  - revisa `VITE_SERVER_URL` en `apps/frontend/.env`
  - valida `ALLOWED_ORIGINS` en `apps/backend/.env`
- Si falla conexion DB:
  - verifica `MONGODB_URI`
- Si falla arranque del backend por configuracion:
  - valida `JWT_SECRET`, `PORT` y variables requeridas en `.env`
