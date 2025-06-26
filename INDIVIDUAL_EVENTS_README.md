# Individual Events - Slam Dunk Challenge

This feature adds support for individual events where players compete individually rather than in teams. The current implementation is for a "Slam Dunk Challenge" where players score points by making different types of shots.

## Database Schema

### slam_drunk Table
```sql
CREATE TABLE slam_drunk (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(player_id),
    twos INTEGER DEFAULT 0,      -- Number of 2-point shots made
    fives INTEGER DEFAULT 0,     -- Number of 5-point shots made
    tens INTEGER DEFAULT 0      -- Number of 10-point shots made
);
```

## Features

### 1. Current Standings View (Team Rankings)
- Shows all teams ranked by total points from individual player scores
- Displays team shot counts (2s, 5s, 10s) aggregated from all players
- Shows player count and average points per player
- Visual indicators for top 3 positions (trophy, medal, award icons)
- Real-time point calculations

### 2. Top Performers View (Individual Rankings)
- Shows all players ranked by total points
- Displays individual shot counts (2s, 5s, 10s)
- Visual indicators for top 3 positions (trophy, medal, award icons)
- Real-time point calculations

### 3. Editable Score Table
- Inline editing of player scores
- Input validation for shot counts
- Real-time total point calculation
- Save/Cancel functionality with toast notifications
- Shows player team affiliation

### 4. API Endpoints

#### GET `/api/events/[eventId]/individual-scores`
Returns all players and their scores for an individual event.

**Response:**
```json
{
  "success": true,
  "event": {
    "event_type": "INDIVIDUAL",
    "event_name": "Slam Dunk Challenge"
  },
  "players": [
    {
      "player_id": 1,
      "player_name": "Brew Ben",
      "email": "ben1@example.com",
      "team_id": 1,
      "team_name": "The Brew Crew",
      "twos": 5,
      "fives": 2,
      "tens": 1,
      "total_points": 25,
      "id": 1
    }
  ]
}
```

#### GET `/api/events/[eventId]/team-standings`
Returns team standings aggregated from individual player scores.

**Response:**
```json
{
  "success": true,
  "event": {
    "event_type": "INDIVIDUAL",
    "event_name": "Slam Dunk Challenge"
  },
  "standings": [
    {
      "team_id": 1,
      "team_name": "The Brew Crew",
      "player_count": 5,
      "twos": 25,
      "fives": 10,
      "tens": 5,
      "total_points": 125,
      "avg_points": 25.0
    }
  ]
}
```

#### POST `/api/events/[eventId]/individual-scores`
Updates or creates a player's score.

**Request Body:**
```json
{
  "playerId": 1,
  "twos": 5,
  "fives": 2,
  "tens": 1
}
```

**Response:**
```json
{
  "success": true,
  "score": {
    "id": 1,
    "player_id": 1,
    "twos": 5,
    "fives": 2,
    "tens": 1
  }
}
```

## Setup Instructions

1. **Create the slam_drunk table:**
   ```sql
   -- Run the updated create_tables.sql or manually create the table
   CREATE TABLE slam_drunk (
       id SERIAL PRIMARY KEY,
       player_id INTEGER NOT NULL REFERENCES players(player_id),
       twos INTEGER DEFAULT 0,
       fives INTEGER DEFAULT 0,
       tens INTEGER DEFAULT 0
   );
   ```

2. **Add an individual event:**
   ```sql
   INSERT INTO events (event_id, event_name, event_type, event_status, event_date, created_at, updated_at) 
   VALUES (4, 'Slam Dunk Challenge', 'INDIVIDUAL', 'SCHEDULED', '2024-01-15 14:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
   ```

3. **Add sample data (optional):**
   ```sql
   -- Run the individual_event_data.sql script for sample scores
   ```

## Usage

1. Navigate to `/events` to see all events
2. Click on an individual event (event type: "INDIVIDUAL")
3. You'll be redirected to `/events/[eventId]/individual`
4. Use the tabs to switch between:
   - **Current Standings**: Team rankings based on aggregated player scores
   - **Top Performers**: Individual player rankings
   - **Score Table**: Editable table for updating player scores
5. In the Score Table, click the edit button to modify player scores
6. Save changes to update the database

## Scoring System

- **2-point shots**: 2 points each
- **5-point shots**: 5 points each  
- **10-point shots**: 10 points each
- **Individual Total**: (twos × 2) + (fives × 5) + (tens × 10)
- **Team Total**: Sum of all individual player scores on the team
- **Team Average**: Team total points ÷ number of players on team

## Components

- `IndividualEventView`: Main component for displaying individual events
- `app/events/[eventId]/individual/page.tsx`: Individual event page
- `app/api/events/[eventId]/individual-scores/route.ts`: Individual scores API
- `app/api/events/[eventId]/team-standings/route.ts`: Team standings API

## Future Enhancements

- Add event completion functionality
- Add point allocation to teams based on individual performance
- Add historical score tracking
- Add player statistics and trends
- Add export functionality for results
- Add team vs team comparison views 