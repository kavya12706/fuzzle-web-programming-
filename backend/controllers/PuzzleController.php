<?php
/**
 * PuzzleController.php - Manages Sudoku Puzzles & Server-Side Validation
 * 
 * VIVA EXPLANATION:
 * 1. The React frontend asks for a puzzle (e.g. GET /api/puzzles/random?difficulty=easy).
 * 2. PHP queries the MariaDB 'puzzles' table using PDO prepared statements.
 * 3. Security: We NEVER send the full 81-character 'solution' string to the frontend,
 *    preventing users from inspecting network responses to cheat.
 * 4. Solution Validation: When the user finishes a game or clicks 'Check Solution',
 *    the frontend sends the current board to /api/puzzles/validate. The PHP server
 *    compares the board against the verified solution stored securely in the database.
 * 5. Hint Feature: When the user requests a hint for a cell, PHP securely reads only
 *    that specific cell's solution digit and returns it, keeping the rest concealed.
 */

class PuzzleController {
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Get a random puzzle by difficulty, or resume saved in-progress attempt
     * GET /api/puzzles/random?difficulty=easy&fresh=0
     */
    public function getRandom(): void {
        $difficulty = $_GET['difficulty'] ?? 'easy';
        $fresh = isset($_GET['fresh']) && ($_GET['fresh'] === '1' || $_GET['fresh'] === 'true');

        $allowed = ['easy', 'medium', 'hard'];
        if (!in_array($difficulty, $allowed, true)) {
            $difficulty = 'easy';
        }

        $userId = $_SESSION['user']['id'] ?? null;

        // If user is logged in and not explicitly requesting a brand new puzzle, check for in-progress attempt
        if ($userId && !$fresh) {
            $stmt = $this->pdo->prepare("
                SELECT a.id as attempt_id, a.puzzle_id, a.current_board, a.notes, a.time_taken, a.hints_used,
                       p.difficulty, p.initial_board
                FROM attempts a
                JOIN puzzles p ON a.puzzle_id = p.id
                WHERE a.user_id = :user_id 
                  AND a.status = 'in_progress'
                  AND p.difficulty = :diff
                ORDER BY a.updated_at DESC
                LIMIT 1
            ");
            $stmt->execute([
                ':user_id' => $userId,
                ':diff'    => $difficulty
            ]);
            $saved = $stmt->fetch();

            if ($saved) {
                sendResponse(true, [
                    'id'               => (int)$saved['puzzle_id'],
                    'difficulty'       => $saved['difficulty'],
                    'initial_board'    => $saved['initial_board'],
                    'has_saved_attempt'=> true,
                    'attempt'          => [
                        'id'            => (int)$saved['attempt_id'],
                        'current_board' => $saved['current_board'],
                        'notes'         => $saved['notes'] ? json_decode($saved['notes'], true) : new stdClass(),
                        'time_taken'    => (int)$saved['time_taken'],
                        'hints_used'    => (int)$saved['hints_used']
                    ]
                ]);
            }
        }

        // Fetch a random puzzle from database
        $stmt = $this->pdo->prepare("
            SELECT id, difficulty, initial_board
            FROM puzzles
            WHERE difficulty = :diff
            ORDER BY RAND()
            LIMIT 1
        ");
        $stmt->execute([':diff' => $difficulty]);
        $puzzle = $stmt->fetch();

        if (!$puzzle) {
            sendResponse(false, null, 'No puzzles found for this difficulty.', 404);
        }

        sendResponse(true, [
            'id'                => (int)$puzzle['id'],
            'difficulty'        => $puzzle['difficulty'],
            'initial_board'     => $puzzle['initial_board'],
            'has_saved_attempt' => false,
            'attempt'           => null
        ]);
    }

    /**
     * Get a specific puzzle by ID
     * GET /api/puzzles/:id
     */
    public function getById(int $id): void {
        $stmt = $this->pdo->prepare("SELECT id, difficulty, initial_board FROM puzzles WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $puzzle = $stmt->fetch();

        if (!$puzzle) {
            sendResponse(false, null, 'Puzzle not found.', 404);
        }

        sendResponse(true, [
            'id'            => (int)$puzzle['id'],
            'difficulty'    => $puzzle['difficulty'],
            'initial_board' => $puzzle['initial_board']
        ]);
    }

    /**
     * Server-side solution validation
     * POST /api/puzzles/validate
     * Body: { puzzle_id: int, board: string (81 chars) }
     */
    public function validate(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        $puzzleId = (int)($input['puzzle_id'] ?? 0);
        $board = trim($input['board'] ?? '');

        if (!$puzzleId || strlen($board) !== 81) {
            sendResponse(false, null, 'Invalid validation request. Puzzle ID and 81-character board required.', 400);
        }

        $stmt = $this->pdo->prepare("SELECT solution FROM puzzles WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $puzzleId]);
        $puzzle = $stmt->fetch();

        if (!$puzzle) {
            sendResponse(false, null, 'Puzzle not found.', 404);
        }

        $solution = $puzzle['solution'];
        $isComplete = !str_contains($board, '0') && !str_contains($board, '.');
        $isCorrect = ($board === $solution);

        // Find cell differences if incomplete or contains errors
        $errorsCount = 0;
        for ($i = 0; $i < 81; $i++) {
            if ($board[$i] !== '0' && $board[$i] !== '.' && $board[$i] !== $solution[$i]) {
                $errorsCount++;
            }
        }

        sendResponse(true, [
            'is_valid'      => $isCorrect,
            'is_complete'   => $isComplete,
            'errors_count'  => $errorsCount
        ]);
    }

    /**
     * Provide a single cell hint securely from the database
     * POST /api/puzzles/hint
     * Body: { puzzle_id: int, cell_index: int (0-80) }
     */
    public function hint(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        $puzzleId = (int)($input['puzzle_id'] ?? 0);
        $cellIndex = (int)($input['cell_index'] ?? -1);

        if (!$puzzleId || $cellIndex < 0 || $cellIndex > 80) {
            sendResponse(false, null, 'Invalid hint request.', 400);
        }

        $stmt = $this->pdo->prepare("SELECT solution FROM puzzles WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $puzzleId]);
        $puzzle = $stmt->fetch();

        if (!$puzzle) {
            sendResponse(false, null, 'Puzzle not found.', 404);
        }

        $correctValue = (int)$puzzle['solution'][$cellIndex];

        sendResponse(true, [
            'cell_index'    => $cellIndex,
            'correct_value' => $correctValue
        ]);
    }
}

