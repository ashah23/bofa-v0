import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Medal, Skull } from "lucide-react"

async function getStandings() {
  // Get points data with team names in a single query
  const pointsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/points`, { cache: 'no-store' });
  if (!pointsRes.ok) throw new Error('Failed to fetch points');
  const pointsData = await pointsRes.json();

  const standings = pointsData.points.map((team: any, index: number) => ({
    team_id: team.team_id,
    name: team.team_name,
    points: team.total_points,
    rank: index + 1
  }));

  return standings;
}

export default async function StandingsPage() {
  const standings = await getStandings();

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Standings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 md:py-3 px-2 md:px-4 text-sm md:text-base">Rank</th>
                  <th className="text-left py-2 md:py-3 px-2 md:px-4 text-sm md:text-base">Team</th>
                  <th className="text-right py-2 md:py-3 px-2 md:px-4 text-sm md:text-base">Points</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team: any) => (
                  <tr
                    key={team.team_id}
                    className={`border-b hover:bg-muted/50 ${team.rank === 1 ? 'bg-yellow-50' :
                      team.rank === 2 ? 'bg-gray-50' :
                        team.rank === 3 ? 'bg-amber-50' : ''
                      }`}
                  >
                    <td className="py-2 md:py-3 px-2 md:px-4">
                      <div className="flex items-center">
                        {team.rank === 1 && (
                          <div className="flex items-center">
                            <Medal className="h-4 w-4 md:h-6 md:w-6 text-yellow-500 mr-1 md:mr-2" />
                            <span className="font-bold text-yellow-600 text-sm md:text-base">1st</span>
                          </div>
                        )}
                        {team.rank === 2 && (
                          <div className="flex items-center">
                            <Award className="h-4 w-4 md:h-6 md:w-6 text-gray-400 mr-1 md:mr-2" />
                            <span className="font-bold text-gray-600 text-sm md:text-base">2nd</span>
                          </div>
                        )}
                        {team.rank === 3 && (
                          <div className="flex items-center">
                            <Award className="h-4 w-4 md:h-6 md:w-6 text-amber-700 mr-1 md:mr-2" />
                            <span className="font-bold text-amber-700 text-sm md:text-base">3rd</span>
                          </div>
                        )}
                        {team.rank > 3 && team.rank < 12 && <span className="w-4 md:w-5 mr-1 md:mr-2 text-sm md:text-base">{team.rank}</span>}
                        {team.rank == 12 && (
                          <div className="flex items-center">
                            <Skull className="h-4 w-4 md:h-6 md:w-6 mr-1 md:mr-2" />
                            <span className="font-bold text-sm md:text-base">Last</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2 md:py-3 px-2 md:px-4 font-medium text-sm md:text-base">{team.name}</td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-right font-bold text-sm md:text-base">{team.points}</td>
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
