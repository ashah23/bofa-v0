import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"
import Link from "next/link"

async function getTeams() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch teams');
  const data = await res.json();
  return data.teams;
}

export default async function TeamsPage() {
  const teams = await getTeams();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Teams</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team: any) => (
          <Link href={`/teams/${team.team_id}`} key={team.team_id}>
            <Card className="h-full transition-all hover:shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{team.team_name}</CardTitle>
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="font-bold">{new Date(team.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
