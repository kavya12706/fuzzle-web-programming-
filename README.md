# 🧩 Fuzzle • Mindful Pastel Sudoku

A full-stack, dynamic Sudoku web application featuring soft pastel aesthetics, user authentication, in-progress game auto-saving, and comprehensive progress tracking (consecutive streaks, 30-day activity heatmap, and weekly solve charts).

---

## 📋 Table of Contents
1. [Tech Stack](#-tech-stack)
2. [Prerequisites & Security Notice](#-prerequisites--security-notice)
3. [Setup & Installation](#-setup--installation)
4. [Running the Application](#-running-the-application)
5. [Architecture & Viva Explanation Guide](#-architecture--viva-explanation-guide)
6. [Testing the Application](#-testing-the-application)
7. [Secrets & Git Safety](#-secrets--git-safety)

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, React Router, Canvas Confetti, Custom Pastel Design System.
- **Backend**: Plain PHP 8.5 (REST-style JSON API, no framework, PDO prepared statements, secure session cookies).
- **Database**: MariaDB / MySQL (`fuzzle` database with `users`, `puzzles`, `attempts`, `daily_activity`).
- **Network**: Localhost only (`http://localhost:5173` frontend communicating with `http://localhost:8000` backend).

---

## ⚠️ Prerequisites & Security Notice

1. **PHP Version**: Must be a patched version (`8.2.35+`, `8.3.36+`, `8.4.27+`, or `8.5.12+`). This project was built and verified on **PHP 8.5.12**.
2. **PHP Extensions**: `pdo_mysql` must be enabled in `php.ini`.
3. **Node.js**: Node.js 18+ (tested on Node v24).
4. **MariaDB / MySQL**: Active and running on port `3306`.
5. **Localhost Only**: This application is strictly configured for local development and demonstration (`localhost`). It does not deploy to public hosts.

---

## 🚀 Setup & Installation

### Step 1: Database Setup & Schema Import
1. Ensure MariaDB is running.
2. Create the database `fuzzle` if it doesn't already exist:
   ```sql
   CREATE DATABASE IF NOT EXISTS fuzzle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Import the provided `schema.sql` (which includes tables and 30 verified Sudoku puzzles):
   ```powershell
   # In PowerShell / Command Prompt
   mysql -h 127.0.0.1 -P 3306 -u root -p fuzzle < schema.sql
   ```

### Step 2: Configure Backend Environment Variables
1. In the `backend/` directory, create or edit `.env` (you can copy `backend/.env.example`):
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=fuzzle
   DB_USER=root
   DB_PASS=your_mariadb_password
   APP_ENV=development
   ```
   > 🔒 **Security Note:** The `.env` file is excluded from Git via `.gitignore`. Never commit passwords or secrets to source control.

### Step 3: Install Frontend Dependencies
```powershell
cd frontend
npm install
```

---

## 🏃 Running the Application

### 1. Start the PHP API Server (Backend)
Open a terminal in the project root:
```powershell
php -S localhost:8000 -t backend
```
The PHP API will be available at `http://localhost:8000`. You can test health at `http://localhost:8000/api/health`.

### 2. Start the React Dev Server (Frontend)
Open a second terminal:
```powershell
cd frontend
npm run dev
```
Open your browser and visit:
👉 **`http://localhost:5173`**

---

## 🎓 Architecture & Viva Explanation Guide

*Use this section to explain your project architecture and code design during your viva or project presentation.*

### 1. How React Calls the PHP API (`frontend/src/api/client.js`)
- React uses native browser `fetch()` wrapped in a central API module (`api`).
- **Cross-Origin Cookie Support (`credentials: 'include'`)**: Because Vite runs on port `5173` and PHP runs on port `8000`, the browser treats requests as cross-origin. Setting `credentials: 'include'` instructs the browser to automatically transmit the `fuzzle_session` cookie on every request.
- **REST-style JSON**: All requests send `'Content-Type': 'application/json'`, and responses arrive in a unified envelope:
  ```json
  {
    "success": true,
    "data": { ... },
    "error": null,
    "timestamp": "2026-10-28T18:45:00Z"
  }
  ```

### 2. How PHP Processes Requests & Protects Secrets (`backend/index.php`)
- **Front Controller Pattern**: All API endpoints enter through `backend/index.php`, which inspects `$_SERVER['REQUEST_URI']` and `$_SERVER['REQUEST_METHOD']` to dispatch the request to the appropriate controller (`AuthController`, `PuzzleController`, `AttemptController`, `StatsController`).
- **CORS Headers**:
  - `Access-Control-Allow-Origin: http://localhost:5173`
  - `Access-Control-Allow-Credentials: true`
  - Handles `OPTIONS` HTTP preflight requests with `200 OK`.
- **Display Errors Off**: `ini_set('display_errors', '0')` ensures that internal PHP errors or database passwords are never leaked in API responses.

### 3. How PHP Queries MariaDB Using PDO Prepared Statements (`backend/config/database.php`)
- Plain PHP uses the **PHP Data Objects (PDO)** extension with `PDO::ATTR_EMULATE_PREPARES => false`.
- **SQL Injection Prevention**: Every user-supplied value (emails, puzzle IDs, board strings) is bound using named parameters (`:email`, `:user_id`, `:board`). The SQL statement is compiled by MariaDB before data is bound, making SQL injection impossible.
- **Password Security**:
  - Registration: `password_hash($password, PASSWORD_DEFAULT)` creates a cryptographically secure, salted hash.
  - Login: `password_verify($password, $user['password_hash'])` securely verifies credentials without ever storing raw passwords.

### 4. Game Logic & Solution Protection
- **No Cheat Inspection**: The frontend never receives the 81-character `solution` string. It only receives the `initial_board`.
- **Server-Side Validation**: When the player finishes or clicks "Check Solution", the board is validated on the backend against the database (`POST /api/puzzles/validate`).
- **Hints**: When a hint is requested, PHP extracts only the correct digit for that specific cell (`POST /api/puzzles/hint`), keeping the rest of the board concealed.

### 5. Streak & Heatmap Calculation (`backend/controllers/StatsController.php`)
- Each completed puzzle increments `puzzles_completed` in `daily_activity` using MariaDB's `ON DUPLICATE KEY UPDATE`.
- **Streak Logic**:
  - A streak is defined as consecutive calendar days with at least 1 solved puzzle.
  - If the user solved a puzzle today, the streak counts backward from today.
  - If the user has not solved a puzzle today yet, but solved one yesterday, the streak remains intact from yesterday!
  - If neither today nor yesterday has activity, the streak resets to 0.
- **30-Day Heatmap**: PHP returns a dense array of the last 30 calendar days so React can display an unbroken activity grid.

---

## 🧪 Testing the Application

1. **Guest Play**:
   - Open `http://localhost:5173` and click "Play Now (Easy)" or "Play as Guest".
   - Notice the gentle banner: *"Playing as Guest • Streaks and resume state won't be saved."*
   - Test typing numbers via keyboard (1-9), backspace, pencil notes mode (press `N`), undo, and hints.
2. **Sign Up & In-Progress Resume**:
   - Click "Sign Up", enter an email and password (>= 6 chars).
   - Start an Easy or Medium puzzle. Enter several numbers.
   - Refresh the page or navigate away and return to the game: your board, timer, notes, and hints are restored automatically from MariaDB!
3. **Solving a Puzzle & Celebration**:
   - Complete the puzzle.
   - Watch the celebratory confetti burst and the completion modal showing time taken.
4. **Progress Dashboard**:
   - Open the "Dashboard" tab in the navbar.
   - Verify that your **Current Streak** is active (`1 days`), **Total Solved** is incremented, the **30-Day Calendar Heatmap** lights up for today, and the **Weekly Solves Chart** displays your victory!

---

## 🔒 Secrets & Git Safety

- The `.gitignore` file excludes:
  - `.env` and `*.env`
  - `node_modules/` and `frontend/node_modules/`
  - `dist/` and `build/`
  - Log files and editor workspaces
- Run `git status` to verify that `.env` is never staged or tracked.
