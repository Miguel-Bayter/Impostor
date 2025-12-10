# 🎮 Juego Impostor

Una aplicación web del juego social "Impostor" desarrollada con HTML, CSS y JavaScript puro (sin frameworks ni librerías externas).

## 📋 Descripción

El juego consiste en un grupo de jugadores donde uno o más serán impostores que deben adivinar una palabra oculta basada en las pistas que dan los demás jugadores.

## 🎯 Reglas del Juego

### Configuración
- **Mínimo de jugadores:** 4
- **Máximo de impostores:** 3
- **Impostores mínimos:** 1

### Mecánica
1. **Asignación de roles:** Los jugadores se dividen en impostores y ciudadanos
2. **Palabra secreta:** Los ciudadanos conocen una palabra secreta, los impostores no
3. **Ronda de pistas:** Cada jugador da una pista relacionada (sin repetir pistas)
4. **Votación:** Todos los jugadores votan quién creen que es el impostor
5. **Eliminación:** El jugador más votado es eliminado
6. **Victoria:**
   - Los ciudadanos ganan si todos los impostores son eliminados
   - Los impostores ganan si quedan igual o más impostores que ciudadanos

## 🚀 Cómo Jugar

1. Abre `index.html` en tu navegador
2. Ingresa el número de jugadores (mínimo 4)
3. Selecciona el número de impostores (1-3)
4. Haz clic en "Comenzar Juego"
5. Revisa los roles asignados
6. Sigue las instrucciones en pantalla para dar pistas y votar

## 📁 Estructura de Archivos

```
.
├── index.html                          # Estructura HTML principal
├── styles.css                          # Estilos CSS organizados
├── game.js                             # Lógica principal del juego
├── words.js                            # Base de datos de palabras secretas
├── game_impostor_implementation.md     # Plan de implementación y checklist
└── README.md                           # Este archivo
```

## 🛠️ Tecnologías Utilizadas

- **HTML5** - Estructura semántica
- **CSS3** - Estilos responsivos con variables CSS
- **JavaScript (ES6+)** - Lógica del juego sin frameworks

## ✨ Características

- ✅ Diseño responsivo para móviles y escritorio
- ✅ Tema oscuro estilo "Among Us"
- ✅ Animaciones suaves entre pantallas
- ✅ Validación completa de reglas del juego
- ✅ Sistema de turnos para pistas y votación
- ✅ Detección automática de condiciones de victoria
- ✅ Código completamente comentado
- ✅ Más de 200 palabras en la base de datos

## 🎨 Personalización

### Agregar más palabras

Edita el archivo `words.js` y agrega palabras al array `WORDS_DATABASE`.

### Modificar estilos

Edita `styles.css` y modifica las variables CSS en `:root` para cambiar colores, espaciado, etc.

## 📝 Notas

- El juego está diseñado para ser jugado localmente (todos los jugadores ven la misma pantalla)
- Para una experiencia multijugador en línea, se requeriría un backend y sistema de autenticación
- Las palabras están en español

## 🔧 Requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- No se requieren dependencias externas

## 📄 Licencia

Este proyecto es de código abierto y está disponible para uso educativo y personal.

---

¡Disfruta del juego! 🎉

