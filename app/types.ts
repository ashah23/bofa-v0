export interface Event {
    event_id: string
    name: string
    event_type: string
    status: string
}

export interface Heat {
    heat_id: string
    event_id: string
    heat_number: number
    team1_id: string
    team2_id: string
    team1_name: string
    team2_name: string
    team1_time: number | null
    team2_time: number | null
    status: string
}

export interface Team {
    team_id: string
    team_name: string
}

export interface TeamPoints {
    team_id: string
    team_name: string
    total_points: number
}

export interface Group {
    group_id: string
    event_id: string
    name: string
    teams: GroupTeam[]
}

export interface GroupTeam {
    team_id: number
    team_name: string
    played: number
    won: number
    drawn: number
    lost: number
    goals_for: number
    goals_against: number
    goal_difference: number
    points: number
}

export interface GroupStateMatch {
    match_id: number
    event_id: number
    group_id: number
    team1_id: number
    team2_id: number
    team1_name: string
    team2_name: string
    team1_score: number | null
    team2_score: number | null
    winner_id: number | null
    status: string
} 