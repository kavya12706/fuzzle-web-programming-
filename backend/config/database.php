<?php
/**
 * Database connection using PHP Data Objects (PDO)
 * Credentials are read exclusively from the .env file.
 * Passwords and sensitive stack traces are never exposed in responses.
 */
require_once __DIR__ . '/env.php';

function getDbConnection(): PDO {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    // Load environment variables from backend/.env
    loadEnv(__DIR__ . '/../.env');

    $host   = $_ENV['DB_HOST'] ?? '127.0.0.1';
    $port   = $_ENV['DB_PORT'] ?? '3306';
    $dbname = $_ENV['DB_NAME'] ?? 'fuzzle';
    $user   = $_ENV['DB_USER'] ?? 'root';
    $pass   = $_ENV['DB_PASS'] ?? '';

    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, $user, $pass, $options);
        return $pdo;
    } catch (PDOException $e) {
        // Log internally for debugging if needed, but never reveal credentials or stack traces to clients
        error_log("Database connection error: " . $e->getMessage());

        if (php_sapi_name() === 'cli') {
            echo "Database connection failed.\n";
            exit(1);
        }

        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error'   => 'A database error occurred. Please try again later.'
        ]);
        exit;
    }
}
