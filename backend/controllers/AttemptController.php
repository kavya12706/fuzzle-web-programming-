<?php
/**
 * AttemptController.php - Tracks Game Progress, In-Progress Saves, & Completions
 * 
 * VIVA EXPLANATION:
 * 1. As a logged-in user plays, React periodically sends the current board, notes,
 *    and elapsed timer to POST /api/attempts/save.
 * 2. PHP uses transactions and prepared statements to update the 'attempts' table.
 * 3. Resuming games: Next time the user opens the difficulty, PHP loads their exact
 *    saved board and timer so they can continue seamlessly.
 * 4. Completion & Streak Logging: When status is 'completed', PHP performs a server-side
 *    validation check against MariaDB's 'puzzles' table. Upon validation, it increments
 *    the user's daily record in 'daily_activity' (via MariaDB's ON DUPLICATE KEY UPDATE),
 *    which powers their streaks and calendar heatmap.
 */

class AttemptController {
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    private function requireAuth(): int {
        if (!isset($_SESSION['user']['id'])) {
            sendResponse(false, null, 'Authentication required to save progress.', 401);
        }
        return (int)$_SESSION['user']['id'];
    }

    /**
     * Save in-progress board or record a completed puzzle
     * POST /api/attempts/save
     */
    public function save(): void {
        $userId = $this->requireAuth();

        $input = json_decode(file_get_contents('php://input'), true);
        $puzzleId     = (int)($input['puzzle_id'] ?? 0);
        $currentBoard = trim($input['current_board'] ?? '');
        $notes        = isset($input['notes']) ? json_encode($input['notes']) : null;
        $timeTaken    = max(0, (int)($input['time_taken'] ?? 0));
        $hintsUsed    = max(0, (int)($input['hints_used'] ?? 0));
        $status       = ($input['status'] ?? 'in_progress') === 'completed' ? 'completed' : 'in_progress';

        if (!$puzzleId || strlen($currentBoard) !== 81) {
            sendResponse(false, null, 'Invalid attempt data. Puzzle ID and 81-char board required.', 400);
        }

        // Fetch puzzle solution to verify
        $stmt = $this->pdo->prepare("SELECT solution, difficulty FROM puzzles WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $puzzleId]);
        $puzzle = $stmt->fetch();

        if (!$puzzle) {
            sendResponse(false, null, 'Puzzle not found.', 404);
        }

        // If marking as completed, verify solution server-side
        if ($status === 'completed') {
            if ($currentBoard !== $puzzle['solution']) {
                sendResponse(false, null, 'Board solution does not match. Please verify your entries.', 400);
            }

            // Check if there is an existing in-progress attempt for this user & puzzle
            $checkStmt = $this->pdo->prepare("
                SELECT id FROM attempts 
                WHERE user_id = :user_id AND puzzle_id = :puzzle_id AND status = 'in_progress'
                ORDER BY id DESC LIMIT 1
            ");
            $checkStmt->execute([
                ':user_id'   => $userId,
                ':puzzle_id' => $puzzleId
            ]);
            $existing = $checkStmt->fetch();

            if ($existing) {
                // Update existing attempt to completed
                $update = $this->pdo->prepare("
                    UPDATE attempts 
                    SET current_board = :board,
                        notes = :notes,
                        status = 'completed',
                        time_taken = :time_taken,
                        hints_used = :hints_used,
                        completed_at = NOW()
                    WHERE id = :id
                ");
                $update->execute([
                    ':board'      => $currentBoard,
                    ':notes'      => $notes,
                    ':time_taken' => $timeTaken,
                    ':hints_used' => $hintsUsed,
                    ':id'         => $existing['id']
                ]);
            } else {
                // Insert new completed attempt
                $insert = $this->pdo->prepare("
                    INSERT INTO attempts (user_id, puzzle_id, current_board, notes, status, time_taken, hints_used, completed_at)
                    VALUES (:user_id, :puzzle_id, :board, :notes, 'completed', :time_taken, :hints_used, NOW())
                ");
                $insert->execute([
                    ':user_id'   => $userId,
                    ':puzzle_id' => $puzzleId,
                    ':board'     => $currentBoard,
                    ':notes'     => $notes,
                    ':time_taken'=> $timeTaken,
                    ':hints_used'=> $hintsUsed
                ]);
            }

            // Record / Update daily activity for streak calculation
            $actStmt = $this->pdo->prepare("
                INSERT INTO daily_activity (user_id, activity_date, puzzles_completed, total_time_spent)
                VALUES (:user_id, CURDATE(), 1, :time_taken)
                ON DUPLICATE KEY UPDATE
                    puzzles_completed = puzzles_completed + 1,
                    total_time_spent = total_time_spent + VALUES(total_time_spent),
                    updated_at = NOW()
            ");
            $actStmt->execute([
                ':user_id'    => $userId,
                ':time_taken' => $timeTaken
            ]);

            sendResponse(true, [
                'status'     => 'completed',
                'difficulty' => $puzzle['difficulty'],
                'time_taken' => $timeTaken,
                'hints_used' => $hintsUsed,
                'message'    => 'Splendid! Puzzle completed and recorded!'
            ]);
        }

        // status === 'in_progress'
        // Upsert in_progress attempt
        $checkStmt = $this->pdo->prepare("
            SELECT id FROM attempts 
            WHERE user_id = :user_id AND puzzle_id = :puzzle_id AND status = 'in_progress'
            ORDER BY id DESC LIMIT 1
        ");
        $checkStmt->execute([
            ':user_id'   => $userId,
            ':puzzle_id' => $puzzleId
        ]);
        $existing = $checkStmt->fetch();

        if ($existing) {
            $update = $this->pdo->prepare("
                UPDATE attempts 
                SET current_board = :board,
                    notes = :notes,
                    time_taken = :time_taken,
                    hints_used = :hints_used,
                    updated_at = NOW()
                WHERE id = :id
            ");
            $update->execute([
                ':board'      => $currentBoard,
                ':notes'      => $notes,
                ':time_taken' => $timeTaken,
                ':hints_used' => $hintsUsed,
                ':id'         => $existing['id']
            ]);
            $attemptId = (int)$existing['id'];
        } else {
            $insert = $this->pdo->prepare("
                INSERT INTO attempts (user_id, puzzle_id, current_board, notes, status, time_taken, hints_used)
                VALUES (:user_id, :puzzle_id, :board, :notes, 'in_progress', :time_taken, :hints_used)
            ");
            $insert->execute([
                ':user_id'   => $userId,
                ':puzzle_id' => $puzzleId,
                ':board'     => $currentBoard,
                ':notes'     => $notes,
                ':time_taken'=> $timeTaken,
                ':hints_used'=> $hintsUsed
            ]);
            $attemptId = (int)$this->pdo->lastInsertId();
        }

        sendResponse(true, [
            'status'     => 'in_progress',
            'attempt_id' => $attemptId,
            'message'    => 'Progress saved.'
        ]);
    }

    /**
     * Get active in-progress attempt for a puzzle
     * GET /api/attempts/current?puzzle_id=X
     */
    public function current(): void {
        $userId = $this->requireAuth();
        $puzzleId = (int)($_GET['puzzle_id'] ?? 0);

        if (!$puzzleId) {
            sendResponse(false, null, 'Puzzle ID required.', 400);
        }

        $stmt = $this->pdo->prepare("
            SELECT id, current_board, notes, time_taken, hints_used, updated_at
            FROM attempts
            WHERE user_id = :user_id AND puzzle_id = :puzzle_id AND status = 'in_progress'
            ORDER BY updated_at DESC
            LIMIT 1
        ");
        $stmt->execute([
            ':user_id'   => $userId,
            ':puzzle_id' => $puzzleId
        ]);
        $attempt = $stmt->fetch();

        if (!$attempt) {
            sendResponse(true, ['attempt' => null]);
        }

        sendResponse(true, [
            'attempt' => [
                'id'            => (int)$attempt['id'],
                'current_board' => $attempt['current_board'],
                'notes'         => $attempt['notes'] ? json_decode($attempt['notes'], true) : new stdClass(),
                'time_taken'    => (int)$attempt['time_taken'],
                'hints_used'    => (int)$attempt['hints_used'],
                'updated_at'    => $attempt['updated_at']
            ]
        ]);
    }
}

