import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Medal } from "lucide-react"

async function getStandings() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/event-results`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch event results');
  const data = await res.json();

  // Calculate team points from results
  const teamPoints = new Map();

  data.results.forEach((result: any) => {
    if (result.winner_team_id) {
      const currentPoints = teamPoints.get(result.winner_team_id) || 0;
      teamPoints.set(result.winner_team_id, currentPoints + 1);
    }
  });

  // Get team names
  const teamsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`, { cache: 'no-store' });
  if (!teamsRes.ok) throw new Error('Failed to fetch teams');
  const teamsData = await teamsRes.json();

  // Combine team data with points
  const standings = teamsData.teams.map((team: any) => ({
    team_id: team.team_id,
    name: team.team_name,
    points: teamPoints.get(team.team_id) || 0
  }));

  // Sort by points and add rank
  return standings
    .sort((a: any, b: any) => b.points - a.points)
    .map((team: any, index: number) => ({
      ...team,
      rank: index + 1
    }));
}

export default async function StandingsPage() {
  const standings = await getStandings();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Standings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Rank</th>
                  <th className="text-left py-3 px-4">Team</th>
                  <th className="text-right py-3 px-4">Points</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team: any) => (
                  <tr key={team.team_id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        {team.rank === 1 && <Medal className="h-5 w-5 text-yellow-500 mr-2" />}
                        {team.rank === 2 && <Medal className="h-5 w-5 text-gray-400 mr-2" />}
                        {team.rank === 3 && <Medal className="h-5 w-5 text-amber-700 mr-2" />}
                        {team.rank && team.rank > 3 && <span className="w-5 mr-2">{team.rank}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">{team.name}</td>
                    <td className="py-3 px-4 text-right font-bold">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
