<?php
/**
 * StatsController.php - User Analytics, Heatmaps, Streaks & Activity Charts
 * 
 * VIVA EXPLANATION:
 * 1. Progress Tracking is strictly restricted to authenticated users.
 * 2. PHP queries the 'attempts' and 'daily_activity' tables in MariaDB using PDO.
 * 3. Streak Calculation:
 *    - Consecutive calendar days with at least one completed puzzle.
 *    - If the user played today, streak counts backward from today.
 *    - If the user has not played today yet, but played yesterday, the streak remains intact!
 *    - Longest streak is computed by scanning all historical activity dates in chronological order.
 * 4. 30-Day Heatmap & 7-Day Chart:
 *    - PHP constructs dense day-by-day arrays ensuring zero-activity days are properly populated
 *      so the frontend React visualization renders an unbroken timeline.
 */

class StatsController {
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    private function requireAuth(): int {
        if (!isset($_SESSION['user']['id'])) {
            sendResponse(false, null, 'Authentication required to view dashboard stats.', 401);
        }
        return (int)$_SESSION['user']['id'];
    }

    /**
     * Get aggregated user dashboard statistics
     * GET /api/user/stats
     */
    public function getStats(): void {
        $userId = $this->requireAuth();

        // 1. Total solved puzzles
        $stmt = $this->pdo->prepare("
            SELECT COUNT(*) as total_solved, COALESCE(AVG(time_taken), 0) as avg_time
            FROM attempts 
            WHERE user_id = :user_id AND status = 'completed'
        ");
        $stmt->execute([':user_id' => $userId]);
        $overall = $stmt->fetch();
        $totalSolved = (int)$overall['total_solved'];
        $avgTime = (int)round((float)$overall['avg_time']);

        // 2. Solved count by difficulty
        $diffStmt = $this->pdo->prepare("
            SELECT p.difficulty, COUNT(a.id) as count
            FROM attempts a
            JOIN puzzles p ON a.puzzle_id = p.id
            WHERE a.user_id = :user_id AND a.status = 'completed'
            GROUP BY p.difficulty
        ");
        $diffStmt->execute([':user_id' => $userId]);
        $diffRows = $diffStmt->fetchAll();

        $byDifficulty = ['easy' => 0, 'medium' => 0, 'hard' => 0];
        foreach ($diffRows as $row) {
            $byDifficulty[$row['difficulty']] = (int)$row['count'];
        }

        // 3. Activity dates for streak calculation
        $actStmt = $this->pdo->prepare("
            SELECT activity_date, puzzles_completed, total_time_spent
            FROM daily_activity
            WHERE user_id = :user_id AND puzzles_completed > 0
            ORDER BY activity_date ASC
        ");
        $actStmt->execute([':user_id' => $userId]);
        $activities = $actStmt->fetchAll();

        $dateMap = [];
        $activeDates = [];
        foreach ($activities as $act) {
            $dateStr = $act['activity_date'];
            $dateMap[$dateStr] = [
                'count'      => (int)$act['puzzles_completed'],
                'time_spent' => (int)$act['total_time_spent']
            ];
            $activeDates[] = $dateStr;
        }

        // Current & Longest Streak calculation
        $currentStreak = 0;
        $longestStreak = 0;

        if (!empty($activeDates)) {
            $today = date('Y-m-d');
            $yesterday = date('Y-m-d', strtotime('-1 day'));

            // Calculate current streak
            $anchorDate = null;
            if (isset($dateMap[$today])) {
                $anchorDate = $today;
            } elseif (isset($dateMap[$yesterday])) {
                $anchorDate = $yesterday;
            }

            if ($anchorDate !== null) {
                $check = $anchorDate;
                while (isset($dateMap[$check])) {
                    $currentStreak++;
                    $check = date('Y-m-d', strtotime($check . ' -1 day'));
                }
            }

            // Calculate longest streak chronologically
            $tempStreak = 0;
            $prevDate = null;
            foreach ($activeDates as $d) {
                if ($prevDate === null) {
                    $tempStreak = 1;
                } else {
                    $expected = date('Y-m-d', strtotime($prevDate . ' +1 day'));
                    if ($d === $expected) {
                        $tempStreak++;
                    } else {
                        $tempStreak = 1;
                    }
                }
                if ($tempStreak > $longestStreak) {
                    $longestStreak = $tempStreak;
                }
                $prevDate = $d;
            }
        }

        // 4. Calendar heatmap of the last 30 days
        $heatmap = [];
        for ($i = 29; $i >= 0; $i--) {
            $d = date('Y-m-d', strtotime("-$i days"));
            $count = $dateMap[$d]['count'] ?? 0;
            $heatmap[] = [
                'date'  => $d,
                'count' => $count,
                'day'   => date('D', strtotime($d))
            ];
        }

        // 5. Weekly activity chart (last 7 days)
        $weekly = [];
        for ($i = 6; $i >= 0; $i--) {
            $d = date('Y-m-d', strtotime("-$i days"));
            $count = $dateMap[$d]['count'] ?? 0;
            $timeSpent = $dateMap[$d]['time_spent'] ?? 0;
            $weekly[] = [
                'date'       => $d,
                'day'        => date('D', strtotime($d)),
                'count'      => $count,
                'time_spent' => $timeSpent
            ];
        }

        // 6. Recent completed puzzles
        $recStmt = $this->pdo->prepare("
            SELECT a.id, a.puzzle_id, p.difficulty, a.time_taken, a.hints_used, a.completed_at
            FROM attempts a
            JOIN puzzles p ON a.puzzle_id = p.id
            WHERE a.user_id = :user_id AND a.status = 'completed'
            ORDER BY a.completed_at DESC
            LIMIT 10
        ");
        $recStmt->execute([':user_id' => $userId]);
        $recent = $recStmt->fetchAll();

        $recentList = array_map(function ($r) {
            return [
                'id'           => (int)$r['id'],
                'puzzle_id'    => (int)$r['puzzle_id'],
                'difficulty'   => $r['difficulty'],
                'time_taken'   => (int)$r['time_taken'],
                'hints_used'   => (int)$r['hints_used'],
                'completed_at' => $r['completed_at']
            ];
        }, $recent);

        sendResponse(true, [
            'summary' => [
                'total_solved'   => $totalSolved,
                'avg_time_sec'   => $avgTime,
                'current_streak' => $currentStreak,
                'longest_streak' => $longestStreak,
                'by_difficulty'  => $byDifficulty
            ],
            'heatmap_30_days' => $heatmap,
            'weekly_activity' => $weekly,
            'recent_puzzles'  => $recentList
        ]);
    }
}

