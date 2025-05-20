CREATE TABLE wc_groups (
  group_id SERIAL PRIMARY KEY,
  event_id INT REFERENCES events(event_id),
  name TEXT NOT NULL
);

CREATE TABLE wc_group_teams (
  event_id INT REFERENCES events(event_id),
  group_id INT REFERENCES wc_groups(group_id),
  team_id INT REFERENCES teams(team_id),
  PRIMARY KEY (event_id, group_id, team_id)
);

CREATE TABLE wc_group_matches (
  match_id SERIAL PRIMARY KEY,
  event_id INT REFERENCES events(event_id),
  group_id INT REFERENCES wc_groups(group_id),
  team1_id INT REFERENCES teams(team_id),
  team2_id INT REFERENCES teams(team_id),
  team1_score INT,
  team2_score INT,
  winner_id INT REFERENCES teams(team_id),
  match_day INT
);

CREATE TABLE wc_knockout_matches (
  match_id SERIAL PRIMARY KEY,
  event_id INT REFERENCES events(event_id),
  round TEXT NOT NULL,
  match_order INT,
  team1_id INT REFERENCES teams(team_id),
  team2_id INT REFERENCES teams(team_id),
  team1_score INT,
  team2_score INT,
  winner_id INT REFERENCES teams(team_id)
);

INSERT INTO wc_groups (event_id, name) VALUES
  (3, 'A'),
  (3, 'B'),
  (3, 'C');

INSERT INTO wc_group_teams (event_id, group_id, team_id)
SELECT 3, group_id, team_id FROM (
  SELECT g.group_id, t.team_id
  FROM wc_groups g
  JOIN (VALUES (1),(2),(3),(4)) AS t(team_id) ON g.name = 'A'
) AS sub;

INSERT INTO wc_group_teams (event_id, group_id, team_id)
SELECT 3, group_id, team_id FROM (
  SELECT g.group_id, t.team_id
  FROM wc_groups g
  JOIN (VALUES (5),(6),(7),(8)) AS t(team_id) ON g.name = 'B'
) AS sub;

INSERT INTO wc_group_teams (event_id, group_id, team_id)
SELECT 3, group_id, team_id FROM (
  SELECT g.group_id, t.team_id
  FROM wc_groups g
  JOIN (VALUES (9),(10),(11),(12)) AS t(team_id) ON g.name = 'C'
) AS sub;

WITH group_team_pairs AS (
  SELECT
    g.group_id,
    t1.team_id AS team1_id,
    t2.team_id AS team2_id
  FROM wc_groups g
  JOIN wc_group_teams t1 ON t1.group_id = g.group_id AND t1.event_id = g.event_id
  JOIN wc_group_teams t2 ON t2.group_id = g.group_id AND t2.event_id = g.event_id
  WHERE t1.team_id < t2.team_id AND g.event_id = 1
)
INSERT INTO wc_group_matches (
  event_id, group_id, team1_id, team2_id, team1_score, team2_score, winner_id, match_day
)
WITH group_team_pairs AS (
  SELECT
    g.group_id,
    g.event_id,
    t1.team_id AS team1_id,
    t2.team_id AS team2_id
  FROM wc_groups g
  JOIN wc_group_teams t1 ON t1.group_id = g.group_id AND t1.event_id = g.event_id
  JOIN wc_group_teams t2 ON t2.group_id = g.group_id AND t2.event_id = g.event_id
  WHERE t1.team_id < t2.team_id AND g.event_id = 3
)
INSERT INTO wc_group_matches (
  event_id, group_id, team1_id, team2_id, team1_score, team2_score, winner_id, match_day
)
SELECT
  gtp.event_id,
  gtp.group_id,
  gtp.team1_id,
  gtp.team2_id,
  NULL, NULL, NULL,
  ROW_NUMBER() OVER (PARTITION BY gtp.group_id ORDER BY gtp.team1_id, gtp.team2_id) AS match_day
FROM group_team_pairs gtp;