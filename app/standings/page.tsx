import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getStandings } from "@/lib/data"
import { Medal } from "lucide-react"

export default function StandingsPage() {
  const standings = getStandings()

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
                {standings.map((team) => (
                  <tr key={team.id} className="border-b hover:bg-muted/50">
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
