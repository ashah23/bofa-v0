INSERT INTO double_elimination_matches (match_id, bracket_type, round, match_order)
VALUES
(1, 'winner', 1, 1),
(2, 'winner', 1, 2),
(3, 'winner', 1, 3),
(4, 'winner', 1, 4),
(5, 'winner', 2, 1),
(6, 'winner', 2, 2),
(7, 'winner', 2, 3),
(8, 'winner', 2, 4),
(9, 'winner', 3, 1),
(10, 'winner', 3, 2),
(11, 'winner', 4, 1),
(12, 'loser', 1, 1),
(13, 'loser', 1, 2),
(14, 'loser', 2, 1),
(15, 'loser', 2, 2),
(16, 'loser', 3, 1),
(17, 'loser', 3, 2),
(18, 'loser', 4, 1),
(19, 'loser', 5, 1),
(20, 'grand_final', 1, 1);


UPDATE double_elimination_matches SET
  next_match_id_winner = 5, next_match_slot_winner = 1,
  next_match_id_loser  = 12, next_match_slot_loser  = 1
WHERE match_id = 1;


UPDATE double_elimination_matches SET
  next_match_id_winner = 5, next_match_slot_winner = 2,
  next_match_id_loser  = 12, next_match_slot_loser  = 2
WHERE match_id = 2;


UPDATE double_elimination_matches SET
  next_match_id_winner = 6, next_match_slot_winner = 1,
  next_match_id_loser  = 13, next_match_slot_loser  = 1
WHERE match_id = 3;


UPDATE double_elimination_matches SET
  next_match_id_winner = 6, next_match_slot_winner = 2,
  next_match_id_loser  = 13, next_match_slot_loser  = 2
WHERE match_id = 4;


UPDATE double_elimination_matches SET
  next_match_id_winner = 9, next_match_slot_winner = 1,
  next_match_id_loser  = 14, next_match_slot_loser  = 1
WHERE match_id = 5;


UPDATE double_elimination_matches SET
  next_match_id_winner = 9, next_match_slot_winner = 2,
  next_match_id_loser  = 14, next_match_slot_loser  = 2
WHERE match_id = 6;


UPDATE double_elimination_matches SET
  next_match_id_winner = 10, next_match_slot_winner = 1,
  next_match_id_loser  = 15, next_match_slot_loser  = 1
WHERE match_id = 7;


UPDATE double_elimination_matches SET
  next_match_id_winner = 10, next_match_slot_winner = 2,
  next_match_id_loser  = 15, next_match_slot_loser  = 2
WHERE match_id = 8;


UPDATE double_elimination_matches SET
  next_match_id_winner = 11, next_match_slot_winner = 1,
  next_match_id_loser  = 16, next_match_slot_loser  = 1
WHERE match_id = 9;


UPDATE double_elimination_matches SET
  next_match_id_winner = 11, next_match_slot_winner = 2,
  next_match_id_loser  = 16, next_match_slot_loser  = 2
WHERE match_id = 10;


UPDATE double_elimination_matches SET
  next_match_id_winner = 20, next_match_slot_winner = 1
WHERE match_id = 11;


UPDATE double_elimination_matches SET
  next_match_id_winner = 17, next_match_slot_winner = 1
WHERE match_id = 16;


UPDATE double_elimination_matches SET
  next_match_id_winner = 18, next_match_slot_winner = 1
WHERE match_id = 17;


UPDATE double_elimination_matches SET
  next_match_id_winner = 19, next_match_slot_winner = 1
WHERE match_id = 18;


UPDATE double_elimination_matches SET
  next_match_id_winner = 20, next_match_slot_winner = 2
WHERE match_id = 19;