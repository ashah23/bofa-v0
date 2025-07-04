import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Medal } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { TeamPlayers } from "@/components/team-players"
import { formatDistanceToNow } from 'date-fns'

async function getTeamWithPlayers(teamId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams/${teamId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch team');
  const data = await res.json();
  return data.team;
}

export default async function TeamPage({ params }: { params: Promise<{ teamId: string }> }) {
  const resolvedParams = await params;
  const team = await getTeamWithPlayers(resolvedParams.teamId)

  if (!team) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/teams">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Teams
        </Button>
      </Link>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">{team.team_name}</CardTitle>
            <div className="flex items-center">
              <span className="font-bold text-lg">{team.total_points || 0} Points</span>
            </div>
          </div>
          <CardDescription>Team Members</CardDescription>
        </CardHeader>
        <CardContent>
          <TeamPlayers players={team.players} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Points History</CardTitle>
          <CardDescription>Breakdown of points earned by the team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm">Type</th>
                  <th className="text-right py-3 px-4 text-sm">Points</th>
                  <th className="text-left py-3 px-4 text-sm">Comments</th>
                  <th className="text-right py-3 px-4 text-sm">When</th>
                </tr>
              </thead>
              <tbody>
                {team.points_history.map((point: any, index: number) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm">{point.point_type == 'EVENT' ? point.event_name : point.point_type}</td>
                    <td className="py-3 px-4 text-right font-bold text-sm">
                      {point.point_value > 0 ? `+${point.point_value}` : point.point_value}
                    </td>
                    <td className="py-3 px-4 text-sm">{point.comments}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(point.updated_at), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
                {team.points_history.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">
                      No points history available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
