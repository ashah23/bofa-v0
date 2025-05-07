import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getTeamById } from "@/lib/data"
import { ArrowLeft, Medal, User } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default function TeamPage({ params }: { params: { teamId: string } }) {
  const team = getTeamById(params.teamId)

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
            <CardTitle className="text-3xl">{team.name}</CardTitle>
            <div className="flex items-center">
              <Medal className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="font-bold">{team.points} Points</span>
            </div>
          </div>
          <CardDescription>Team Members</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {team.members.map((member, index) => (
              <li key={index} className="flex items-center p-2 rounded-md hover:bg-muted">
                <User className="h-5 w-5 mr-3 text-muted-foreground" />
                <span>{member}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
