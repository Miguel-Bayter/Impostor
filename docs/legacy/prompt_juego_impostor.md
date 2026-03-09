# Prompt para LLM --- Juego "Impostor" (Web App: HTML, CSS y JavaScript)

Quiero que generes una **aplicación web** usando **HTML, CSS y
JavaScript puro** basada en el siguiente juego social llamado
**"Impostor"**.\
A continuación están TODAS las reglas y requerimientos exactos que debe
seguir el LLM para crear la aplicación.

------------------------------------------------------------------------

## 🎮 Descripción del Juego "Impostor"

El juego consiste en un grupo de jugadores donde **uno o más serán
impostores** que deben adivinar una palabra oculta basada en las pistas
que dan los demás.

------------------------------------------------------------------------

## 👥 1. Número de jugadores

-   **Mínimo:** 4 jugadores\
-   **Máximo de impostores:** 3\
-   Siempre debe haber **al menos 1 impostor**

------------------------------------------------------------------------

## 🃏 2. Asignación de roles

-   A todos los jugadores que NO son impostores se les da **una palabra
    secreta**.
-   Los impostores **no reciben la palabra**.
-   Los impostores deben deducir la palabra escuchando las pistas.

------------------------------------------------------------------------

## 🧩 3. Mecánica de cada ronda

1.  Los jugadores que conocen la palabra deben decir **una palabra
    relacionada**:
    -   Puede ser un sinónimo, concepto o elemento asociado.
    -   **No deben repetir pistas entre jugadores.**
2.  El impostor debe decir una palabra relacionada según lo que
    entienda.

### Ejemplo:

-   Palabra secreta: **vaca**\
-   Pistas de los jugadores: *leche*, *césped*, *granja*\
-   Impostor podría deducir mal y decir: *cereal*

------------------------------------------------------------------------

## 🗳️ 4. Fase de votación

-   Todos los jugadores votan quién creen que es el impostor.
-   Si el votado ES impostor:
    -   Es eliminado.
    -   Los jugadores ganan la ronda.
-   Si el votado NO es impostor:
    -   Ese jugador inocente es eliminado.
    -   El juego continúa.

------------------------------------------------------------------------

## 🏆 5. Condición de victoria

-   Si el impostor queda solo con **una persona** → **El impostor
    gana.**
-   Si todos los impostores son eliminados → **Ganan los jugadores.**

------------------------------------------------------------------------

## 🛠️ 6. Lo que el LLM debe generar para la versión Web

Usando **solo HTML, CSS y JavaScript**, generar:

### Estructura principal

-   Pantalla de inicio: ingresar número de jugadores e impostores
-   Pantalla de asignación de roles
-   Pantalla de pistas (turnos)
-   Pantalla de votación
-   Pantalla de resultados de ronda
-   Pantalla de victoria final

### Lógica de juego obligatoria

-   Sistema automático de selección de impostores
-   Sistema de asignación de palabra secreta a NO impostores
-   Captura de pistas
-   Manejo de votaciones
-   Eliminación de jugadores
-   Detección de condiciones de victoria
-   Flujo completo de rondas hasta finalizar

### Restricciones

-   Sin frameworks
-   Sin librerías externas
-   Código completamente comentado
-   CSS organizado y responsivo
-   JS modularizado en funciones claras

------------------------------------------------------------------------

## 💡 7. Opcional para el LLM (si lo considera útil)

-   Animaciones simples con CSS
-   UI minimalista estilo "Among Us"
-   Puntaje o historial de rondas
-   Modo oscuro

------------------------------------------------------------------------

Este prompt debe ser usado para generar una **aplicación web completa,
funcional y jugable**, respetando todas las reglas aquí descritas.
