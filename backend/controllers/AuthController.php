<?php
/**
 * AuthController.php - Handles User Authentication
 * 
 * VIVA EXPLANATION:
 * 1. React makes a POST request to /api/auth/signup or /api/auth/login with JSON body { email, password }.
 * 2. PHP reads the raw input using file_get_contents('php://input') and decodes it with json_decode().
 * 3. Security: Passwords are NEVER stored as plain text. We use password_hash(..., PASSWORD_DEFAULT)
 *    which utilizes strong bcrypt/argon2 hashing with automated salting.
 * 4. Prepared Statements: We use $pdo->prepare() with bound parameters (:email) to prevent SQL Injection.
 * 5. State Management: When verified with password_verify(), user info is saved in $_SESSION['user'].
 *    PHP sends an HTTP Set-Cookie header with the session ID (configured with HttpOnly and SameSite=Lax).
 */

class AuthController {
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    /**
     * User registration endpoint
     * POST /api/auth/signup
     */
    public function signup(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';

        // Validation
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            sendResponse(false, null, 'Please provide a valid email address.', 400);
        }

        if (strlen($password) < 6) {
            sendResponse(false, null, 'Password must be at least 6 characters long.', 400);
        }

        // Check if email already registered
        $stmt = $this->pdo->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        if ($stmt->fetch()) {
            sendResponse(false, null, 'An account with this email already exists.', 409);
        }

        // Hash password securely
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        // Insert new user
        $insert = $this->pdo->prepare("INSERT INTO users (email, password_hash) VALUES (:email, :hash)");
        $insert->execute([
            ':email' => $email,
            ':hash'  => $passwordHash
        ]);

        $userId = (int)$this->pdo->lastInsertId();

        // Establish session
        $_SESSION['user'] = [
            'id'    => $userId,
            'email' => $email
        ];

        sendResponse(true, [
            'user' => [
                'id'    => $userId,
                'email' => $email
            ],
            'message' => 'Account created successfully!'
        ], null, 201);
    }

    /**
     * User login endpoint
     * POST /api/auth/login
     */
    public function login(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';

        if (empty($email) || empty($password)) {
            sendResponse(false, null, 'Email and password are required.', 400);
        }

        // Query user by email using prepared statement
        $stmt = $this->pdo->prepare("SELECT id, email, password_hash FROM users WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        // Verify password against stored hash
        if (!$user || !password_verify($password, $user['password_hash'])) {
            sendResponse(false, null, 'Invalid email or password.', 401);
        }

        // Regenerate session ID to prevent session fixation attacks
        session_regenerate_id(true);

        $_SESSION['user'] = [
            'id'    => (int)$user['id'],
            'email' => $user['email']
        ];

        sendResponse(true, [
            'user' => [
                'id'    => (int)$user['id'],
                'email' => $user['email']
            ],
            'message' => 'Logged in successfully!'
        ]);
    }

    /**
     * User logout endpoint
     * POST /api/auth/logout
     */
    public function logout(): void {
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();

        sendResponse(true, [
            'message' => 'Logged out successfully.'
        ]);
    }

    /**
     * Current authenticated user endpoint
     * GET /api/auth/me
     */
    public function me(): void {
        if (!isset($_SESSION['user']['id'])) {
            sendResponse(true, ['user' => null]);
        }

        // Verify user still exists in database
        $stmt = $this->pdo->prepare("SELECT id, email, created_at FROM users WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $_SESSION['user']['id']]);
        $user = $stmt->fetch();

        if (!$user) {
            unset($_SESSION['user']);
            sendResponse(true, ['user' => null]);
        }

        sendResponse(true, [
            'user' => [
                'id'         => (int)$user['id'],
                'email'      => $user['email'],
                'created_at' => $user['created_at']
            ]
        ]);
    }
}

