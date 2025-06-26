-- Add an individual event
INSERT INTO events (event_id, event_name, event_type, event_status, event_date, created_at, updated_at) 
VALUES (4, 'Slam Dunk Challenge', 'INDIVIDUAL', 'SCHEDULED', '2024-01-15 14:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (event_id) DO NOTHING;

-- Add some sample slam dunk scores for players
INSERT INTO slam_drunk (player_id, twos, fives, tens) VALUES
(1, 5, 2, 1),   -- Brew Ben: 5 twos, 2 fives, 1 ten = 25 points
(2, 3, 3, 2),   -- Lager Lisa: 3 twos, 3 fives, 2 tens = 31 points
(3, 7, 1, 0),   -- Mug Mike: 7 twos, 1 five, 0 tens = 19 points
(4, 2, 4, 3),   -- Foamy Fiona: 2 twos, 4 fives, 3 tens = 44 points
(5, 6, 0, 1),   -- Pint Paul: 6 twos, 0 fives, 1 ten = 22 points
(6, 4, 2, 2),   -- Chug Charlie: 4 twos, 2 fives, 2 tens = 28 points
(7, 1, 5, 1),   -- Drip Dana: 1 two, 5 fives, 1 ten = 27 points
(8, 8, 0, 0),   -- Gulp Greg: 8 twos, 0 fives, 0 tens = 16 points
(9, 0, 6, 2),   -- Shotgun Sue: 0 twos, 6 fives, 2 tens = 40 points
(10, 3, 1, 4)   -- Buzz Bob: 3 twos, 1 five, 4 tens = 51 points
ON CONFLICT (player_id) DO UPDATE SET
    twos = EXCLUDED.twos,
    fives = EXCLUDED.fives,
    tens = EXCLUDED.tens,
    updated_at = CURRENT_TIMESTAMP; 