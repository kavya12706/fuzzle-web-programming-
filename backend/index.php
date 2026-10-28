<?php
/**
 * Fuzzle API - Front Controller & Router
 * 
 * VIVA EXPLANATION:
 * 1. Architecture: This file acts as the "Front Controller". Every API request from
 *    the React frontend (at http://localhost:5173) arrives here.
 * 2. CORS & Cookies: We allow credentials (cookies) and check the HTTP_ORIGIN.
 *    Because the frontend and backend run on different ports (5173 vs 8000), CORS headers
 *    are required. Preflight OPTIONS requests are answered immediately with 200 OK.
 * 3. Security:
 *    - Errors are never displayed to users (display_errors = 0) to prevent leaking
 *      stack traces, paths, or database passwords.
 *    - All database queries use PDO prepared statements with bound parameters.
 * 4. Routing:
 *    - We parse $_SERVER['REQUEST_URI'] and $_SERVER['REQUEST_METHOD'] to dispatch
 *      the request to the appropriate controller method.
 */

// Production error handling: hide raw errors from clients, log internally
ini_set('display_errors', '0');
error_reporting(E_ALL);

// Set default timezone
date_default_timezone_set('UTC');

// Global JSON response helper
function sendResponse(bool $success, mixed $data = null, ?string $error = null, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode([
        'success'   => $success,
        'data'      => $data,
        'error'     => $error,
        'timestamp' => date('c')
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// Global Exception Handler to safeguard against uncaught errors
set_exception_handler(function (Throwable $e) {
    error_log("Unhandled Exception: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine());
    sendResponse(false, null, 'An internal server error occurred.', 500);
});

// Configure PHP session with secure cookie parameters
if (session_status() === PHP_SESSION_NONE) {
    session_name('fuzzle_session');
    session_set_cookie_params([
        'lifetime' => 60 * 60 * 24 * 7, // 7 days
        'path'     => '/',
        'domain'   => 'localhost',
        'secure'   => false, // false for HTTP localhost
        'httponly' => true,  // JavaScript cannot access session cookie
        'samesite' => 'Lax'
    ]);
    session_start();
}

// Dynamic CORS configuration for React Vite dev server
$allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:5173");
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Handle HTTP preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Load database connection
require_once __DIR__ . '/config/database.php';
$pdo = getDbConnection();

// Load Controllers
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/PuzzleController.php';
require_once __DIR__ . '/controllers/AttemptController.php';
require_once __DIR__ . '/controllers/StatsController.php';

$authController    = new AuthController($pdo);
$puzzleController  = new PuzzleController($pdo);
$attemptController = new AttemptController($pdo);
$statsController   = new StatsController($pdo);

// Parse Request URI and Method
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$requestUri = rtrim($requestUri, '/');
if ($requestUri === '') {
    $requestUri = '/';
}
$method = $_SERVER['REQUEST_METHOD'];

// Dispatch Routes
switch (true) {
    // Health Check / Root
    case ($requestUri === '/' || $requestUri === '/api' || $requestUri === '/api/health') && $method === 'GET':
        sendResponse(true, [
            'app'         => 'Fuzzle API',
            'version'     => '1.0.0',
            'status'      => 'online',
            'php_version' => PHP_VERSION,
            'database'    => 'connected'
        ]);
        break;

    // Authentication Routes
    case $requestUri === '/api/auth/signup' && $method === 'POST':
        $authController->signup();
        break;

    case $requestUri === '/api/auth/login' && $method === 'POST':
        $authController->login();
        break;

    case $requestUri === '/api/auth/logout' && $method === 'POST':
        $authController->logout();
        break;

    case $requestUri === '/api/auth/me' && $method === 'GET':
        $authController->me();
        break;

    // Puzzle Routes
    case $requestUri === '/api/puzzles/random' && $method === 'GET':
        $puzzleController->getRandom();
        break;

    case $requestUri === '/api/puzzles/validate' && $method === 'POST':
        $puzzleController->validate();
        break;

    case $requestUri === '/api/puzzles/hint' && $method === 'POST':
        $puzzleController->hint();
        break;

    case preg_match('#^/api/puzzles/(\d+)$#', $requestUri, $matches) && $method === 'GET':
        $puzzleController->getById((int)$matches[1]);
        break;

    // Attempts & Progress Routes
    case $requestUri === '/api/attempts/save' && $method === 'POST':
        $attemptController->save();
        break;

    case $requestUri === '/api/attempts/current' && $method === 'GET':
        $attemptController->current();
        break;

    // User Stats & Dashboard Routes
    case $requestUri === '/api/user/stats' && $method === 'GET':
        $statsController->getStats();
        break;

    default:
        sendResponse(false, null, "Endpoint not found: [$method] $requestUri", 404);
        break;
}
