# Plan de Migración: Frontend Vanilla JS a React + TypeScript

Este documento detalla los pasos para evolucionar el frontend actual del juego "Impostor" a una arquitectura moderna basada en **React**, **Vite** y **TypeScript**.

## 🚀 Objetivos
- Migrar de Vanilla JS a React (SPA).
- Implementar TypeScript para mayor robustez.
- Mantener la lógica de juego actual y la comunicación por WebSockets.
- Mejorar la estética y la experiencia de usuario (UI/UX).

## 📋 Checklist de Fases

### Fase 1: Preparación y Estructura Base ✅ (Completada)
- [✅] Inicializar proyecto Vite con React + TypeScript.
- [✅] Configurar alias de rutas y estructura de carpetas (`components`, `hooks`, `context`, `services`, `types`).
- [✅] Configurar el cliente de Socket.io como un servicio/hook global.
- [✅] Migrar archivos de configuración (`config.js`, `words.js`).

### Fase 2: Definición de Tipos y Estado Core ✅ (Completada)
- [✅] Crear interfaces de TypeScript para `Player`, `Room`, `GameState`, `Clue`, `Vote`.
- [✅] Implementar un `GameContext` para manejar el estado global del juego.
- [✅] Migrar la lógica de conexión y eventos de `socket-client.js` a un hook `useSocket`.

### Fase 3: Migración de Componentes de UI ✅ (Completada)
- [✅] **Layout Principal**: Contenedor base y manejo de errores globales.
- [✅] **Autenticación**: Login y Registro con validación.
- [✅] **Gestión de Salas**: Crear, unirse y listar salas disponibles.
- [✅] **Lobby**: Sala de espera con lista de jugadores.
- [✅] **Fases del Juego**: Componentes para Roles, Pistas, Votación y Resultados.
- [✅] **Navegación**: Sistema de routing basado en el estado del juego.

### Fase 4: Lógica de Negocio y Ciclo de Vida ✅ (Completada)
- [✅] Reconexión automática con tokens almacenados.
- [✅] Sincronización de estado entre servidor y cliente.
- [✅] Manejo de transiciones de fase (Roles -> Pistas -> Votación -> Resultados).

### Fase 5: Refinamiento y Estética ✨
- [ ] Aplicar diseño "Premium" con CSS avanzado (gradientes, animaciones, glassmorphism).
- [ ] Pulir micro-interacciones (hover effects, transiciones de carga).
- [ ] Verificación final del loop de juego.

---
*Última actualización: 19 de Dic, 2025*
