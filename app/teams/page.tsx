import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { teams } from "@/lib/data"
import { Users } from "lucide-react"
import Link from "next/link"

export default function TeamsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Teams</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <Link href={`/teams/${team.id}`} key={team.id}>
            <Card className="h-full transition-all hover:shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{team.name}</CardTitle>
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <CardDescription>{team.members.length} team members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Points</span>
                  <span className="font-bold">{team.points}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
