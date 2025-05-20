import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

async function getEventDetails(eventId: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/${eventId}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch event');
    const data = await res.json();
    return data.event;
}

async function getGroups(eventId: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups?eventId=${eventId}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch groups');
    const data = await res.json();
    return data.groups;
}

async function getGroupTeams(groupId: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${groupId}/teams`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch group teams');
    const data = await res.json();
    return data.teams;
}

async function getGroupMatches(groupId: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${groupId}/matches`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch group matches');
    const data = await res.json();
    return data.matches;
}

export default async function GroupKnockoutPage({
    searchParams,
}: {
    searchParams: { eventId?: string }
}) {
    if (!searchParams.eventId) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center text-muted-foreground py-8">
                    Please select an event to view its group and knockout details.
                </div>
            </div>
        );
    }

    const event = await getEventDetails(searchParams.eventId);
    const groups = await getGroups(searchParams.eventId);

    return (
        <div className="container mx-auto px-4 py-8">
            <Link href={`/events/${searchParams.eventId}`}>
                <Button variant="ghost" className="mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Event
                </Button>
            </Link>

            <h1 className="text-3xl font-bold mb-6">{event.event_name} - Group & Knockout Stage</h1>

            <Tabs defaultValue={groups[0]?.group_id} className="space-y-4">
                <TabsList>
                    {groups.map((group: any) => (
                        <TabsTrigger key={group.group_id} value={group.group_id}>
                            Group {group.group_name}
                        </TabsTrigger>
                    ))}
                    <TabsTrigger value="knockout">Knockout Stage</TabsTrigger>
                </TabsList>

                {groups.map(async (group: any) => {
                    const [teams, matches] = await Promise.all([
                        getGroupTeams(group.group_id),
                        getGroupMatches(group.group_id)
                    ]);

                    return (
                        <TabsContent key={group.group_id} value={group.group_id}>
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Group Standings */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Group {group.group_name} Standings</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b">
                                                        <th className="text-left py-3 px-4">Team</th>
                                                        <th className="text-center py-3 px-4">P</th>
                                                        <th className="text-center py-3 px-4">W</th>
                                                        <th className="text-center py-3 px-4">D</th>
                                                        <th className="text-center py-3 px-4">L</th>
                                                        <th className="text-center py-3 px-4">GF</th>
                                                        <th className="text-center py-3 px-4">GA</th>
                                                        <th className="text-center py-3 px-4">GD</th>
                                                        <th className="text-center py-3 px-4">Pts</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {teams.map((team: any) => (
                                                        <tr key={team.team_id} className="border-b hover:bg-muted/50">
                                                            <td className="py-3 px-4 font-medium">{team.team_name}</td>
                                                            <td className="py-3 px-4 text-center">{team.played}</td>
                                                            <td className="py-3 px-4 text-center">{team.won}</td>
                                                            <td className="py-3 px-4 text-center">{team.drawn}</td>
                                                            <td className="py-3 px-4 text-center">{team.lost}</td>
                                                            <td className="py-3 px-4 text-center">{team.goals_for}</td>
                                                            <td className="py-3 px-4 text-center">{team.goals_against}</td>
                                                            <td className="py-3 px-4 text-center">{team.goal_difference}</td>
                                                            <td className="py-3 px-4 text-center font-bold">{team.points}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Group Matches */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Group {group.group_name} Matches</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {matches.map((match: any) => (
                                                <div key={match.match_id} className="flex items-center justify-between p-4 border rounded-lg">
                                                    <div className="flex-1 text-right">
                                                        <span className="font-medium">{match.team1_name}</span>
                                                    </div>
                                                    <div className="px-4 text-center">
                                                        {match.status === 'COMPLETED' ? (
                                                            <span className="font-bold">
                                                                {match.team1_score} - {match.team2_score}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                {new Date(match.scheduled_time).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="font-medium">{match.team2_name}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    );
                })}

                <TabsContent value="knockout">
                    <Card>
                        <CardHeader>
                            <CardTitle>Knockout Stage</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center text-muted-foreground py-8">
                                Knockout stage matches will be displayed here once group stages are completed.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
} 