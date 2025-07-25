-- Fix the update_world_cup_group_standings function to use UPSERT
CREATE OR REPLACE FUNCTION update_world_cup_group_standings(event_id_param INT)
RETURNS VOID AS $$
BEGIN
  -- Use UPSERT to avoid primary key conflicts
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
  WHERE wcgt.event_id = event_id_param
  ON CONFLICT (event_id, group_id, team_id) 
  DO UPDATE SET
    played = EXCLUDED.played,
    wins = EXCLUDED.wins;
  
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