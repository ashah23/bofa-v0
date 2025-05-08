import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Medal } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { TeamPlayers } from "@/components/team-players"

async function getTeamWithPlayers(teamId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams/${teamId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch team');
  const data = await res.json();
  return data.team;
}

export default async function TeamPage({ params }: { params: { teamId: string } }) {
  const team = await getTeamWithPlayers(params.teamId)

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
            <CardTitle className="text-3xl">{team.team_name}</CardTitle>
            <div className="flex items-center">
              <Medal className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="font-bold">{team.points || 0} Points</span>
            </div>
          </div>
          <CardDescription>Team Members</CardDescription>
        </CardHeader>
        <CardContent>
          <TeamPlayers players={team.players} />
        </CardContent>
      </Card>
    </div>
  )
}
