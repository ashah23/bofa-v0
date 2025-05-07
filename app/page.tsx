import Link from "next/link"
import { Beer, Medal, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Beer Olympics</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/standings" className="block">
          <Card className="h-full transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">Standings</CardTitle>
              <Medal className="h-8 w-8 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">View the current leaderboard and team rankings</CardDescription>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">See who's winning the glory</p>
            </CardFooter>
          </Card>
        </Link>

        <Link href="/events" className="block">
          <Card className="h-full transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">Events</CardTitle>
              <Beer className="h-8 w-8 text-amber-600" />
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">Browse all head-to-head and heat-based events</CardDescription>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">Check out the competition lineup</p>
            </CardFooter>
          </Card>
        </Link>

        <Link href="/teams" className="block">
          <Card className="h-full transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">Teams</CardTitle>
              <Users className="h-8 w-8 text-blue-500" />
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">View all participating teams and their members</CardDescription>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">Meet the competitors</p>
            </CardFooter>
          </Card>
        </Link>
      </div>
    </div>
  )
}
