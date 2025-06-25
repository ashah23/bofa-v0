-- Winner's Bracket
INSERT INTO double_elim_matches (match_id, event_id, round, match_number, bracket, team1_id, team2_id, next_match_win_id, next_match_win_slot, next_match_lose_id, next_match_lose_slot) VALUES
-- Round 1 (Winners)
(1, 1, 1, 1, 'W', 5, 12, 5, 1, 9, 1),
(2, 1, 1, 2, 'W', 6, 11, 5, 2, 9, 2),
(3, 1, 1, 3, 'W', 7, 10, 6, 1, 10, 1),
(4, 1, 1, 4, 'W', 8, 9, 6, 2, 10, 2),

-- Round 2 (Winners)
(5, 1, 2, 1, 'W', NULL, NULL, 7, 1, 11, 1),
(6, 1, 2, 2, 'W', NULL, NULL, 7, 2, 11, 2),

-- Semifinal (Winners)
(7, 1, 3, 1, 'W', NULL, NULL, 13, 1, 12, 2),

-- Final (Winners)
(13, 1, 4, 1, 'W', NULL, NULL, 15, 1, NULL, NULL),

-- Loser's Bracket
-- Round 1 (L)
(9, 1, -1, 1, 'L', NULL, NULL, 11, 1, NULL, NULL),
(10, 1, -1, 2, 'L', NULL, NULL, 11, 2, NULL, NULL),

-- Round 2 (L)
(11, 1, -2, 1, 'L', NULL, NULL, 12, 1, NULL, NULL),

-- Round 3 (L)
(12, 1, -3, 1, 'L', NULL, NULL, 14, 1, NULL, NULL),

-- Loser's Final
(14, 1, -4, 1, 'L', NULL, NULL, 15, 2, NULL, NULL),

-- Grand Final
(15, 1, 0, 1, 'F', NULL, NULL, NULL, NULL, NULL, NULL);