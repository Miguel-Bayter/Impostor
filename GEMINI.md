# GEMINI.md - Impostor Game

## Project Overview

This is a real-time multiplayer "Impostor" game, structured as a monorepo with two distinct projects: a backend and a frontend.

*   **Backend**: A Node.js application using Express for the web server and Socket.io for real-time WebSocket communication. It handles all game logic, user authentication, room management, and state synchronization. It uses MongoDB for data persistence, managed via Mongoose.

*   **Frontend**: A vanilla JavaScript single-page application (SPA) that provides the user interface. It communicates with the backend via Socket.io to send user actions and receive game state updates. It does not have any frontend frameworks like React or Vue.

## Building and Running

The project requires both the backend and frontend servers to be running simultaneously.

### Backend

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Copy the `env.example.txt` file from the root directory to `backend/.env` and fill in the required values (`JWT_SECRET`, `MONGODB_URI`).
    ```bash
    cp ../env.example.txt .env
    ```

4.  **Run the development server:**
    The server will start on `http://localhost:3000` with hot-reloading.
    ```bash
    npm run dev
    ```

5.  **Run in production mode:**
    ```bash
    npm start
    ```

### Frontend

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    This will serve the frontend on `http://localhost:5500` and automatically open it in the browser.
    ```bash
    npm run dev
    ```

## Development Conventions

*   **Code Style**: The project uses `prettier` for code formatting and `eslint` for linting in both the frontend and backend.
    *   **Check formatting**: `npm run lint`
    *   **Auto-format**: `npm run format`

*   **Testing**: `vitest` is used for unit and integration tests in both projects.
    *   **Run tests once**: `npm run test`
    *   **Run tests in watch mode**: `npm run test:watch`

*   **Commit Messages**: Commits seem to follow a convention of describing the completed phase and stage in Spanish, for example: `fase 3 de etapa 2 finalizada`.

## Key Files

### Backend

*   `backend/server.js`: The main entry point for the backend server. It initializes Express, Socket.io, connects to the database, and sets up middleware and routes.
*   `backend/package.json`: Defines dependencies and scripts for the backend.
*   `backend/routes/auth.js`, `backend/routes/rooms.js`: Express routes for handling authentication and room management API calls.
*   `backend/sockets/gameSocket.js`, `backend/sockets/roomSocket.js`: Core real-time logic, handling all WebSocket events related to game and room state.
*   `backend/models/`: Contains Mongoose schemas for `User`, `Room`, and `Game`.
*   `backend/middleware/auth.js`: Middleware for authenticating both HTTP requests and WebSocket connections using JWT.
*   `backend/db/connection.js`: Handles the connection to the MongoDB database.

### Frontend

*   `frontend/index.html`: The main HTML file for the single-page application.
*   `frontend/game.js`: The primary JavaScript file containing the frontend logic for handling UI, user input, and WebSocket communication.
*   `frontend/socket-client.js`: A dedicated module for managing the Socket.io client connection and event handling.
*   `frontend/package.json`: Defines development dependencies and scripts for the frontend.
*   `frontend/styles.css`: Contains all the styling for the application.

