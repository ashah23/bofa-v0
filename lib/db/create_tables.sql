CREATE TABLE events (event_name character varying(100) NOT NULL, event_id integer NOT NULL, created_at timestamp without time zone, updated_at timestamp without time zone, event_type text, event_status text, event_date timestamp without time zone);
CREATE TABLE head_to_head_matches (team2_score integer NOT NULL, event_id integer, event_status text, winner_team_id integer, result_id integer NOT NULL, created_at timestamp without time zone, team1_id integer, team2_id integer, team1_score integer NOT NULL);
CREATE TABLE heat_matches (heat_number integer, heat_status text, team3_id integer, team4_id integer, heat_id integer NOT NULL, team2_id integer, team3_time numeric, team1_time numeric, team1_id integer, team2_time numeric, created_at timestamp without time zone, team4_time numeric, event_id integer NOT NULL);
CREATE TABLE players (created_at timestamp without time zone, player_name character varying(100) NOT NULL, email character varying(100), player_id integer NOT NULL, reading_comprehension integer, athleticism integer, alcohol_tolerance integer, team_id integer);
CREATE TABLE points (updated_at timestamp without time zone, point_type text, comments text, point_value integer, team_id integer, id integer NOT NULL, event_id integer);
CREATE TABLE teams (team_id integer NOT NULL, team_name character varying(100) NOT NULL, created_at timestamp without time zone);
CREATE TABLE users (email text NOT NULL, role text, password text, user_id text NOT NULL);
CREATE TABLE double_elimination_matches (
    match_id SERIAL PRIMARY KEY,
    bracket_type VARCHAR(20) NOT NULL CHECK (bracket_type IN ('winner', 'loser', 'grand_final')),
    round INT NOT NULL,
    match_order INT NOT NULL,

    team1_id INT,
    team2_id INT,
    team1_score INT,
    team2_score INT,
    winner_id INT,

    next_match_id_winner INT,
    next_match_slot_winner INT CHECK (next_match_slot_winner IN (1, 2)),

    next_match_id_loser INT,
    next_match_slot_loser INT CHECK (next_match_slot_loser IN (1, 2)),

    FOREIGN KEY (team1_id) REFERENCES teams(team_id),
    FOREIGN KEY (team2_id) REFERENCES teams(team_id),
    FOREIGN KEY (winner_id) REFERENCES teams(team_id),
    FOREIGN KEY (next_match_id_winner) REFERENCES double_elimination_matches(match_id),
    FOREIGN KEY (next_match_id_loser) REFERENCES double_elimination_matches(match_id)
);