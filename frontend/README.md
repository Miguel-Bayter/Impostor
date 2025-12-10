# 🎮 Impostor - Frontend

Frontend del juego Impostor multijugador - Aplicación web construida con HTML, CSS y JavaScript vanilla.

## 📋 Requisitos

- Navegador web moderno
- (Opcional) Node.js para servidor de desarrollo local

## 🚀 Instalación y Uso

### Opción 1: Servidor de desarrollo local (recomendado)

```bash
# Instalar dependencias
npm install

# Iniciar servidor local
npm run dev
```

El frontend estará disponible en `http://localhost:5500`

### Opción 2: Servidor estático

Puedes usar cualquier servidor estático como:
- Live Server (extensión de VS Code)
- Python: `python -m http.server 5500`
- Cualquier servidor web estático

### Opción 3: Abrir directamente

Puedes abrir `index.html` directamente en el navegador (limitaciones de CORS pueden aplicarse).

## 📁 Estructura

```
frontend/
├── index.html      # Página principal
├── styles.css      # Estilos del juego
├── game.js         # Lógica del juego
└── words.js        # Base de datos de palabras secretas
```

## 🔌 Conexión con Backend

El frontend se conecta al backend mediante:
- Socket.io para comunicación en tiempo real
- API REST para operaciones estándar

Asegúrate de que el backend esté corriendo en `http://localhost:3000` (o configurar la URL según corresponda).

## 📝 Notas

Este es un proyecto independiente. Para desarrollo completo, también necesitarás ejecutar el backend.

