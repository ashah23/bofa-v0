CREATE TABLE events (event_name character varying(100) NOT NULL, event_id integer NOT NULL, created_at timestamp without time zone, updated_at timestamp without time zone, event_type text, event_status text, event_date timestamp without time zone);
CREATE TABLE head_to_head_matches (team2_score integer NOT NULL, event_id integer, event_status text, winner_team_id integer, result_id integer NOT NULL, created_at timestamp without time zone, team1_id integer, team2_id integer, team1_score integer NOT NULL);
CREATE TABLE heat_matches (heat_number integer, heat_status text, team3_id integer, team4_id integer, heat_id integer NOT NULL, team2_id integer, team3_time numeric, team1_time numeric, team1_id integer, team2_time numeric, created_at timestamp without time zone, team4_time numeric, event_id integer NOT NULL);
CREATE TABLE players (created_at timestamp without time zone, player_name character varying(100) NOT NULL, email character varying(100), player_id integer NOT NULL, listening_comprehension integer, athleticism integer, alcohol_tolerance integer, competitiveness integer, team_id integer);
CREATE TABLE points (updated_at timestamp without time zone, point_type text, comments text, point_value integer, team_id integer, id integer NOT NULL, event_id integer);
CREATE TABLE teams (team_id integer NOT NULL, team_name character varying(100) NOT NULL, created_at timestamp without time zone);
CREATE TABLE users (email text NOT NULL, role text, password text, user_id text NOT NULL);
CREATE TABLE double_elim_matches (
    match_id SERIAL PRIMARY KEY,
    event_id INT NOT NULL,
    round INT NOT NULL, -- positive = winner's bracket, negative = loser's bracket, 0 = grand final
    match_number INT NOT NULL, -- within each round
    bracket VARCHAR(10) NOT NULL CHECK (bracket IN ('W', 'L', 'F')), -- Winner, Loser, Final
    team1_id INT,
    team2_id INT,
    winner_id INT, -- NULL until match is played
    loser_id INT,  -- can help with tracking
    next_match_win_id INT, -- points to the next match if team wins
    next_match_win_slot INT, -- 1 or 2 (team1 or team2) in next match
    next_match_lose_id INT, -- points to the next match if team loses
    next_match_lose_slot INT, -- 1 or 2 in that match
    played_at TIMESTAMP
);

CREATE TABLE slam_drunk (
    id SERIAL PRIMARY KEY,
    player_id INT NOT NULL,
    twos SMALLINT,
    fives SMALLINT,
    tens SMALLINT
);