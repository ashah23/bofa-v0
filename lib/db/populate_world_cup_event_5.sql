-- Populate World Cup Event 5 with specified team groups
-- Event ID: 5
-- Group A: Teams 6, 1, 10
-- Group B: Teams 3, 9, 2
-- Group C: Teams 12, 4, 5
-- Group D: Teams 7, 8, 11

-- First, ensure the event exists (create if it doesn't)
INSERT INTO events (event_id, event_name, event_type, event_status, event_date, created_at, updated_at)
VALUES (5, 'World Cup Tournament', 'WORLD-CUP', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (event_id) DO UPDATE SET 
    event_name = 'World Cup Tournament',
    event_type = 'WORLD-CUP',
    event_status = 'ACTIVE',
    updated_at = CURRENT_TIMESTAMP;

-- Create the 4 groups for event 5
INSERT INTO world_cup_groups (event_id, name) VALUES
  (5, 'A'),
  (5, 'B'),
  (5, 'C'),
  (5, 'D')
ON CONFLICT (event_id, name) DO NOTHING;

-- Assign teams to Group A (Teams 6, 1, 10)
INSERT INTO world_cup_group_teams (event_id, group_id, team_id)
SELECT 5, wcg.group_id, t.team_id
FROM world_cup_groups wcg
CROSS JOIN (VALUES (6), (1), (10)) AS t(team_id)
WHERE wcg.name = 'A' AND wcg.event_id = 5
ON CONFLICT (event_id, group_id, team_id) DO NOTHING;

-- Assign teams to Group B (Teams 3, 9, 2)
INSERT INTO world_cup_group_teams (event_id, group_id, team_id)
SELECT 5, wcg.group_id, t.team_id
FROM world_cup_groups wcg
CROSS JOIN (VALUES (3), (9), (2)) AS t(team_id)
WHERE wcg.name = 'B' AND wcg.event_id = 5
ON CONFLICT (event_id, group_id, team_id) DO NOTHING;

-- Assign teams to Group C (Teams 12, 4, 5)
INSERT INTO world_cup_group_teams (event_id, group_id, team_id)
SELECT 5, wcg.group_id, t.team_id
FROM world_cup_groups wcg
CROSS JOIN (VALUES (12), (4), (5)) AS t(team_id)
WHERE wcg.name = 'C' AND wcg.event_id = 5
ON CONFLICT (event_id, group_id, team_id) DO NOTHING;

-- Assign teams to Group D (Teams 7, 8, 11)
INSERT INTO world_cup_group_teams (event_id, group_id, team_id)
SELECT 5, wcg.group_id, t.team_id
FROM world_cup_groups wcg
CROSS JOIN (VALUES (7), (8), (11)) AS t(team_id)
WHERE wcg.name = 'D' AND wcg.event_id = 5
ON CONFLICT (event_id, group_id, team_id) DO NOTHING;

-- Create group matches (each team plays every other team in their group)
-- Group A matches (Teams 6, 1, 10)
INSERT INTO world_cup_group_matches (event_id, group_id, team1_id, team2_id, match_day)
SELECT 
  5 as event_id,
  wcg.group_id,
  t1.team_id as team1_id,
  t2.team_id as team2_id,
  ROW_NUMBER() OVER (ORDER BY t1.team_id, t2.team_id) as match_day
FROM world_cup_groups wcg
JOIN world_cup_group_teams wcgt1 ON wcgt1.group_id = wcg.group_id AND wcgt1.event_id = 5
JOIN world_cup_group_teams wcgt2 ON wcgt2.group_id = wcg.group_id AND wcgt2.event_id = 5
JOIN teams t1 ON wcgt1.team_id = t1.team_id
JOIN teams t2 ON wcgt2.team_id = t2.team_id
WHERE wcg.name = 'A' AND wcg.event_id = 5 AND t1.team_id < t2.team_id
ON CONFLICT DO NOTHING;

-- Group B matches (Teams 3, 9, 2)
INSERT INTO world_cup_group_matches (event_id, group_id, team1_id, team2_id, match_day)
SELECT 
  5 as event_id,
  wcg.group_id,
  t1.team_id as team1_id,
  t2.team_id as team2_id,
  ROW_NUMBER() OVER (ORDER BY t1.team_id, t2.team_id) as match_day
FROM world_cup_groups wcg
JOIN world_cup_group_teams wcgt1 ON wcgt1.group_id = wcg.group_id AND wcgt1.event_id = 5
JOIN world_cup_group_teams wcgt2 ON wcgt2.group_id = wcg.group_id AND wcgt2.event_id = 5
JOIN teams t1 ON wcgt1.team_id = t1.team_id
JOIN teams t2 ON wcgt2.team_id = t2.team_id
WHERE wcg.name = 'B' AND wcg.event_id = 5 AND t1.team_id < t2.team_id
ON CONFLICT DO NOTHING;

-- Group C matches (Teams 12, 4, 5)
INSERT INTO world_cup_group_matches (event_id, group_id, team1_id, team2_id, match_day)
SELECT 
  5 as event_id,
  wcg.group_id,
  t1.team_id as team1_id,
  t2.team_id as team2_id,
  ROW_NUMBER() OVER (ORDER BY t1.team_id, t2.team_id) as match_day
FROM world_cup_groups wcg
JOIN world_cup_group_teams wcgt1 ON wcgt1.group_id = wcg.group_id AND wcgt1.event_id = 5
JOIN world_cup_group_teams wcgt2 ON wcgt2.group_id = wcg.group_id AND wcgt2.event_id = 5
JOIN teams t1 ON wcgt1.team_id = t1.team_id
JOIN teams t2 ON wcgt2.team_id = t2.team_id
WHERE wcg.name = 'C' AND wcg.event_id = 5 AND t1.team_id < t2.team_id
ON CONFLICT DO NOTHING;

-- Group D matches (Teams 7, 8, 11)
INSERT INTO world_cup_group_matches (event_id, group_id, team1_id, team2_id, match_day)
SELECT 
  5 as event_id,
  wcg.group_id,
  t1.team_id as team1_id,
  t2.team_id as team2_id,
  ROW_NUMBER() OVER (ORDER BY t1.team_id, t2.team_id) as match_day
FROM world_cup_groups wcg
JOIN world_cup_group_teams wcgt1 ON wcgt1.group_id = wcg.group_id AND wcgt1.event_id = 5
JOIN world_cup_group_teams wcgt2 ON wcgt2.group_id = wcg.group_id AND wcgt2.event_id = 5
JOIN teams t1 ON wcgt1.team_id = t1.team_id
JOIN teams t2 ON wcgt2.team_id = t2.team_id
WHERE wcg.name = 'D' AND wcg.event_id = 5 AND t1.team_id < t2.team_id
ON CONFLICT DO NOTHING;

-- Initialize group standings
SELECT update_world_cup_group_standings(5);

-- Display the created structure
SELECT 'World Cup Event 5 Setup Complete' as status;
SELECT 'Group A: Teams 6, 1, 10' as group_info
UNION ALL
SELECT 'Group B: Teams 3, 9, 2'
UNION ALL
SELECT 'Group C: Teams 12, 4, 5'
UNION ALL
SELECT 'Group D: Teams 7, 8, 11'; 