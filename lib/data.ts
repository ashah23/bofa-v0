// Mock data for the Beer Olympics app

export type UserRole = "player" | "captain" | "referee"

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  teamId?: string
  avatar?: string
}

export type Team = {
  id: string
  name: string
  members: string[]
  points: number
  rank?: number
  captainId?: string
}

export type EventType = "head-to-head" | "heat"

export type MatchupStatus = "scheduled" | "in-progress" | "completed"

export type Matchup = {
  id: string
  eventId: string
  teamIds: string[]
  teamNames: string[]
  status: MatchupStatus
  scores?: Record<string, number>
  winner?: string
  startTime?: string
}

export type HeatStatus = "scheduled" | "in-progress" | "completed"

export type HeatResult = {
  teamId: string
  time: number // time in seconds
  rank?: number
}

export type Heat = {
  id: string
  eventId: string
  teamIds: string[]
  teamNames: string[]
  status: HeatStatus
  results?: HeatResult[]
  startTime?: string
}

export type Event = {
  id: string
  name: string
  type: EventType
  description: string
  pointsAwarded: number
  completed: boolean
  matchups?: Matchup[]
  heats?: Heat[]
}

// Users data
export const users: User[] = [
  {
    id: "user-1",
    name: "John Smith",
    email: "john@example.com",
    role: "player",
    teamId: "team-1",
  },
  {
    id: "user-2",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    role: "captain",
    teamId: "team-1",
  },
  {
    id: "user-3",
    name: "Mike Williams",
    email: "mike@example.com",
    role: "player",
    teamId: "team-1",
  },
  {
    id: "user-4",
    name: "David Jones",
    email: "david@example.com",
    role: "captain",
    teamId: "team-2",
  },
  {
    id: "user-5",
    name: "Lisa Garcia",
    email: "lisa@example.com",
    role: "player",
    teamId: "team-2",
  },
  {
    id: "user-6",
    name: "Alex Rodriguez",
    email: "alex@example.com",
    role: "referee",
  },
  {
    id: "user-7",
    name: "Emily Chen",
    email: "emily@example.com",
    role: "referee",
  },
]

// Teams data
export const teams: Team[] = [
  {
    id: "team-1",
    name: "Brew Crew",
    members: ["John Smith", "Sarah Johnson", "Mike Williams", "Emma Brown"],
    points: 42,
    captainId: "user-2",
  },
  {
    id: "team-2",
    name: "Hop Stars",
    members: ["David Jones", "Lisa Garcia", "Tom Wilson", "Jessica Martinez"],
    points: 38,
    captainId: "user-4",
  },
  {
    id: "team-3",
    name: "Ale Force",
    members: ["Chris Davis", "Amanda Miller", "Ryan Taylor", "Olivia Anderson"],
    points: 45,
  },
  {
    id: "team-4",
    name: "Lager Legends",
    members: ["Kevin Thomas", "Sophia White", "Brian Harris", "Megan Martin"],
    points: 36,
  },
  {
    id: "team-5",
    name: "Stout Squad",
    members: ["Daniel Thompson", "Rachel Clark", "Jason Lewis", "Nicole Walker"],
    points: 40,
  },
  {
    id: "team-6",
    name: "IPA Avengers",
    members: ["Matthew Hall", "Jennifer Young", "Andrew Allen", "Rebecca King"],
    points: 33,
  },
]

// Matchups data for head-to-head events
export const matchups: Matchup[] = [
  {
    id: "matchup-1",
    eventId: "event-1",
    teamIds: ["team-1", "team-2"],
    teamNames: ["Brew Crew", "Hop Stars"],
    status: "completed",
    scores: { "team-1": 3, "team-2": 1 },
    winner: "team-1",
    startTime: "2023-05-15T14:00:00",
  },
  {
    id: "matchup-2",
    eventId: "event-1",
    teamIds: ["team-3", "team-4"],
    teamNames: ["Ale Force", "Lager Legends"],
    status: "completed",
    scores: { "team-3": 3, "team-4": 2 },
    winner: "team-3",
    startTime: "2023-05-15T15:30:00",
  },
  {
    id: "matchup-3",
    eventId: "event-1",
    teamIds: ["team-1", "team-3"],
    teamNames: ["Brew Crew", "Ale Force"],
    status: "scheduled",
    startTime: "2023-05-16T14:00:00",
  },
  {
    id: "matchup-4",
    eventId: "event-5",
    teamIds: ["team-2", "team-5"],
    teamNames: ["Hop Stars", "Stout Squad"],
    status: "scheduled",
    startTime: "2023-05-16T16:00:00",
  },
  {
    id: "matchup-5",
    eventId: "event-5",
    teamIds: ["team-4", "team-6"],
    teamNames: ["Lager Legends", "IPA Avengers"],
    status: "scheduled",
    startTime: "2023-05-16T17:30:00",
  },
  {
    id: "matchup-6",
    eventId: "event-7",
    teamIds: ["team-1", "team-6"],
    teamNames: ["Brew Crew", "IPA Avengers"],
    status: "scheduled",
    startTime: "2023-05-17T14:00:00",
  },
  {
    id: "matchup-7",
    eventId: "event-7",
    teamIds: ["team-3", "team-5"],
    teamNames: ["Ale Force", "Stout Squad"],
    status: "scheduled",
    startTime: "2023-05-17T15:30:00",
  },
]

// Heats data for heat-based events
export const heats: Heat[] = [
  {
    id: "heat-1",
    eventId: "event-2",
    teamIds: ["team-1", "team-2", "team-3", "team-4"],
    teamNames: ["Brew Crew", "Hop Stars", "Ale Force", "Lager Legends"],
    status: "completed",
    results: [
      { teamId: "team-3", time: 45.2, rank: 1 },
      { teamId: "team-1", time: 48.7, rank: 2 },
      { teamId: "team-4", time: 52.1, rank: 3 },
      { teamId: "team-2", time: 55.6, rank: 4 },
    ],
    startTime: "2023-05-15T13:00:00",
  },
  {
    id: "heat-2",
    eventId: "event-3",
    teamIds: ["team-1", "team-3", "team-5", "team-6"],
    teamNames: ["Brew Crew", "Ale Force", "Stout Squad", "IPA Avengers"],
    status: "scheduled",
    startTime: "2023-05-17T13:00:00",
  },
  {
    id: "heat-3",
    eventId: "event-4",
    teamIds: ["team-2", "team-4", "team-5", "team-6"],
    teamNames: ["Hop Stars", "Lager Legends", "Stout Squad", "IPA Avengers"],
    status: "scheduled",
    startTime: "2023-05-18T14:00:00",
  },
  {
    id: "heat-4",
    eventId: "event-6",
    teamIds: ["team-1", "team-2", "team-3", "team-4"],
    teamNames: ["Brew Crew", "Hop Stars", "Ale Force", "Lager Legends"],
    status: "scheduled",
    startTime: "2023-05-19T15:00:00",
  },
]

// Events data
export const events: Event[] = [
  {
    id: "event-1",
    name: "Beer Pong Tournament",
    type: "head-to-head",
    description: "Teams face off in the classic game of beer pong. Best of three games advances.",
    pointsAwarded: 10,
    completed: false,
    matchups: matchups.filter((m) => m.eventId === "event-1"),
  },
  {
    id: "event-2",
    name: "Flip Cup Relay",
    type: "heat",
    description: "Teams race to flip cups in sequence. Fastest team wins.",
    pointsAwarded: 8,
    completed: true,
    heats: heats.filter((h) => h.eventId === "event-2"),
  },
  {
    id: "event-3",
    name: "Keg Stand Challenge",
    type: "heat",
    description: "Team members perform keg stands. Longest cumulative time wins.",
    pointsAwarded: 12,
    completed: false,
    heats: heats.filter((h) => h.eventId === "event-3"),
  },
  {
    id: "event-4",
    name: "Beer Mile",
    type: "heat",
    description: "Drink a beer, run a quarter mile, repeat four times. Fastest team wins.",
    pointsAwarded: 15,
    completed: false,
    heats: heats.filter((h) => h.eventId === "event-4"),
  },
  {
    id: "event-5",
    name: "Quarters Tournament",
    type: "head-to-head",
    description: "Teams compete in the classic quarters drinking game. Single elimination.",
    pointsAwarded: 8,
    completed: false,
    matchups: matchups.filter((m) => m.eventId === "event-5"),
  },
  {
    id: "event-6",
    name: "Case Race",
    type: "heat",
    description: "Teams race to finish a case of beer. Fastest team wins.",
    pointsAwarded: 20,
    completed: false,
    heats: heats.filter((h) => h.eventId === "event-6"),
  },
  {
    id: "event-7",
    name: "Dizzy Bat",
    type: "head-to-head",
    description: "Spin around a bat, then try to hit a ball. Best average distance wins.",
    pointsAwarded: 10,
    completed: false,
    matchups: matchups.filter((m) => m.eventId === "event-7"),
  },
  {
    id: "event-8",
    name: "Beer Trivia",
    type: "head-to-head",
    description: "Teams answer questions about beer history, brewing, and culture.",
    pointsAwarded: 8,
    completed: false,
  },
]

// Get standings with teams sorted by points
export function getStandings(): Team[] {
  const sortedTeams = [...teams].sort((a, b) => b.points - a.points)

  // Add rank to each team
  return sortedTeams.map((team, index) => ({
    ...team,
    rank: index + 1,
  }))
}

// Get a team by ID
export function getTeamById(id: string): Team | undefined {
  return teams.find((team) => team.id === id)
}

// Get an event by ID
export function getEventById(id: string): Event | undefined {
  return events.find((event) => event.id === id)
}

// Get matchups for an event
export function getMatchupsByEventId(eventId: string): Matchup[] {
  return matchups.filter((matchup) => matchup.eventId === eventId)
}

// Get heats for an event
export function getHeatsByEventId(eventId: string): Heat[] {
  return heats.filter((heat) => heat.eventId === eventId)
}

// Mock current user (in a real app, this would come from authentication)
export const currentUser: User = users[0] // Default to first user

// Set current user (for demo purposes)
export function setCurrentUser(userId: string) {
  const user = users.find((u) => u.id === userId)
  if (user) {
    return user
  }
  return users[0]
}

// Get user by ID
export function getUserById(id: string): User | undefined {
  return users.find((user) => user.id === id)
}

// Get users by team ID
export function getUsersByTeamId(teamId: string): User[] {
  return users.filter((user) => user.teamId === teamId)
}

// Get users by role
export function getUsersByRole(role: UserRole): User[] {
  return users.filter((user) => user.role === role)
}

// Format time from seconds to MM:SS.ms format
export function formatTime(timeInSeconds: number): string {
  const minutes = Math.floor(timeInSeconds / 60)
  const seconds = Math.floor(timeInSeconds % 60)
  const milliseconds = Math.floor((timeInSeconds % 1) * 100)

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`
}
