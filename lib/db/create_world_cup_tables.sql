-- World Cup Event Tables - Complete Schema
-- Run this file to create all World Cup tables and functions

-- World Cup Groups (4 groups: A, B, C, D)
CREATE TABLE world_cup_groups (
  group_id SERIAL PRIMARY KEY,
  event_id INT REFERENCES events(event_id),
  name TEXT NOT NULL CHECK (name IN ('A', 'B', 'C', 'D')),
  UNIQUE(event_id, name)
);

-- Teams assigned to World Cup groups
CREATE TABLE world_cup_group_teams (
  event_id INT REFERENCES events(event_id),
  group_id INT REFERENCES world_cup_groups(group_id),
  team_id INT REFERENCES teams(team_id),
  PRIMARY KEY (event_id, group_id, team_id)
);

-- Group stage matches (winner only)
CREATE TABLE world_cup_group_matches (
  match_id SERIAL PRIMARY KEY,
  event_id INT REFERENCES events(event_id),
  group_id INT REFERENCES world_cup_groups(group_id),
  team1_id INT REFERENCES teams(team_id),
  team2_id INT REFERENCES teams(team_id),
  winner_id INT REFERENCES teams(team_id),
  match_day INT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Knockout stage matches (winner only)
CREATE TABLE world_cup_knockout_matches (
  match_id SERIAL PRIMARY KEY,
  event_id INT REFERENCES events(event_id),
  round TEXT NOT NULL CHECK (round IN ('semi_final_1', 'semi_final_2', 'final', 'third_place')),
  match_order INT,
  team1_id INT REFERENCES teams(team_id),
  team2_id INT REFERENCES teams(team_id),
  winner_id INT REFERENCES teams(team_id),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group standings (wins only)
CREATE TABLE world_cup_group_standings (
  event_id INT REFERENCES events(event_id),
  group_id INT REFERENCES world_cup_groups(group_id),
  team_id INT REFERENCES teams(team_id),
  played INT DEFAULT 0,
  wins INT DEFAULT 0,
  position INT,
  PRIMARY KEY (event_id, group_id, team_id)
);

-- Function to update group standings (wins only)
CREATE OR REPLACE FUNCTION update_world_cup_group_standings(event_id_param INT)
RETURNS VOID AS $$
BEGIN
  -- Delete existing standings for this event
  DELETE FROM world_cup_group_standings WHERE event_id = event_id_param;
  
  -- Insert new standings calculated from completed matches
  INSERT INTO world_cup_group_standings (
    event_id, group_id, team_id, played, wins
  )
  SELECT 
    wcgt.event_id,
    wcgt.group_id,
    wcgt.team_id,
    COALESCE(played_stats.played, 0) as played,
    COALESCE(played_stats.wins, 0) as wins
  FROM world_cup_group_teams wcgt
  LEFT JOIN (
    SELECT 
      event_id,
      group_id,
      team1_id as team_id,
      COUNT(*) as played,
      COUNT(CASE WHEN winner_id = team1_id THEN 1 END) as wins
    FROM world_cup_group_matches
    WHERE event_id = event_id_param AND status = 'completed'
    GROUP BY event_id, group_id, team1_id
    UNION ALL
    SELECT 
      event_id,
      group_id,
      team2_id as team_id,
      COUNT(*) as played,
      COUNT(CASE WHEN winner_id = team2_id THEN 1 END) as wins
    FROM world_cup_group_matches
    WHERE event_id = event_id_param AND status = 'completed'
    GROUP BY event_id, group_id, team2_id
  ) played_stats ON played_stats.event_id = wcgt.event_id AND played_stats.group_id = wcgt.group_id AND played_stats.team_id = wcgt.team_id
  WHERE wcgt.event_id = event_id_param;
  
  -- Update positions based on wins
  UPDATE world_cup_group_standings 
  SET position = sub.position
  FROM (
    SELECT 
      event_id, group_id, team_id,
      ROW_NUMBER() OVER (
        PARTITION BY event_id, group_id 
        ORDER BY wins DESC, team_id
      ) as position
    FROM world_cup_group_standings 
    WHERE event_id = event_id_param
  ) sub
  WHERE world_cup_group_standings.event_id = sub.event_id 
    AND world_cup_group_standings.group_id = sub.group_id 
    AND world_cup_group_standings.team_id = sub.team_id;
END;
$$ LANGUAGE plpgsql; 