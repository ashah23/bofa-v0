'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Trophy } from 'lucide-react'
import Link from 'next/link'
import { useRefModeGuard } from "@/hooks/use-ref-mode-guard"
import { useRefMode } from "@/components/ref-mode-context"

interface WorldCupEventViewProps {
    event: any
    eventId: string
}

interface Group {
    group_id: number
    group_name: string
    teams: Array<{
        team_id: number
        team_name: string
    }>
}

interface GroupMatch {
    match_id: number
    group_id: number
    group_name: string
    team1_id: number
    team1_name: string
    team2_id: number
    team2_name: string
    winner_id: number | null
    match_day: number
    status: string
}

interface KnockoutMatch {
    match_id: number
    round: string
    match_order: number
    team1_id: number | null
    team1_name: string | null
    team2_id: number | null
    team2_name: string | null
    winner_id: number | null
    status: string
}

interface Standing {
    group_id: number
    group_name: string
    team_id: number
    team_name: string
    played: number
    wins: number
    position: number | null
}

export function WorldCupEventView({ event, eventId }: WorldCupEventViewProps) {
    const [worldCupData, setWorldCupData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [selectedMatch, setSelectedMatch] = useState<GroupMatch | KnockoutMatch | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [tieBreakDialogOpen, setTieBreakDialogOpen] = useState(false)
    const [tieBreakGroup, setTieBreakGroup] = useState<Standing[]>([])
    const [selectedWinner, setSelectedWinner] = useState<number | null>(null)
    const [finalizing, setFinalizing] = useState(false)
    const [tieBreakDecisions, setTieBreakDecisions] = useState<{ [key: string]: number }>({})
    const [calculatingStandings, setCalculatingStandings] = useState(false)
    const [tournamentFinalStandings, setTournamentFinalStandings] = useState<any[]>([])
    const [resetDialogOpen, setResetDialogOpen] = useState(false)
    const [resetting, setResetting] = useState(false)
    const { toast } = useToast()
    const { guardRefModeAsync } = useRefModeGuard()
    const { isRefMode } = useRefMode()

    useEffect(() => {
        fetchWorldCupData()
    }, [eventId])

    const fetchWorldCupData = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/events/${eventId}/world-cup?t=${Date.now()}`)
            const data = await response.json()
            if (data.success) {
                setWorldCupData(data)
            }
        } catch (error) {
            console.error('Error fetching World Cup data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleMatchClick = (match: GroupMatch | KnockoutMatch) => {
        setSelectedMatch(match)
        setDialogOpen(true)
    }

    const handleWinnerSelect = async (winnerId: number) => {
        if (!selectedMatch) return

        await guardRefModeAsync(async () => {
            const matchType = 'group_id' in selectedMatch ? 'group' : 'knockout'

            const response = await fetch(`/api/events/${eventId}/world-cup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matchId: selectedMatch.match_id,
                    matchType,
                    winnerId
                })
            })

            const data = await response.json()

            if (data.success) {
                toast({ title: 'Success', description: 'Winner recorded successfully' })
                setDialogOpen(false)
                fetchWorldCupData()
            } else {
                toast({ title: 'Error', description: data.message || 'Failed to record winner', variant: 'destructive' })
            }
        }, "record match winner")
    };

    const handleFinalizeStandings = async () => {
        // Check for ties before finalizing
        const standings = worldCupData?.standings as Standing[]
        const groups = ['A', 'B', 'C', 'D']
        let hasUnresolvedTies = false

        for (const groupName of groups) {
            const groupStandings = standings.filter(s => s.group_name === groupName)

            // Check if all teams have 1 win each (3-way tie)
            if (groupStandings.length === 3 && groupStandings.every(s => s.wins === 1)) {
                const groupId = groupStandings[0].group_id
                if (!tieBreakDecisions[groupId]) {
                    setTieBreakGroup(groupStandings)
                    setTieBreakDialogOpen(true)
                    hasUnresolvedTies = true
                    return
                }
            }
        }

        // If no unresolved ties, proceed with finalization
        if (!hasUnresolvedTies) {
            setFinalizing(true)
            try {
                await guardRefModeAsync(async () => {
                    const response = await fetch(`/api/events/${eventId}/world-cup/finalize`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            tieBreakDecisions
                        })
                    })

                    const data = await response.json()

                    if (data.success) {
                        toast({ title: 'Success', description: 'Knockout stage created successfully' })
                        fetchWorldCupData()
                    } else {
                        toast({ title: 'Error', description: data.message || 'Failed to create knockout stage', variant: 'destructive' })
                    }
                }, "finalize tournament standings")
            } finally {
                setFinalizing(false)
            }
        }
    }

    const handleCalculateStandings = async () => {
        setCalculatingStandings(true)
        try {
            await guardRefModeAsync(async () => {
                const response = await fetch(`/api/events/${eventId}/world-cup/calculate-standings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                })

                const data = await response.json()

                if (data.success) {
                    toast({ title: 'Success', description: 'Final standings calculated successfully' })
                    setTournamentFinalStandings(data.standings)
                } else {
                    toast({ title: 'Error', description: data.message || 'Failed to calculate standings', variant: 'destructive' })
                }
            }, "calculate final standings")
        } finally {
            setCalculatingStandings(false)
        }
    }

    const handleResetEvent = async () => {
        setResetting(true)
        try {
            await guardRefModeAsync(async () => {
                const response = await fetch(`/api/events/${eventId}/world-cup/reset`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                })

                const data = await response.json()

                if (data.success) {
                    toast({ title: 'Success', description: 'Tournament reset successfully' })
                    setTournamentFinalStandings([])
                    setResetDialogOpen(false)
                    fetchWorldCupData()
                } else {
                    toast({ title: 'Error', description: data.message || 'Failed to reset tournament', variant: 'destructive' })
                }
            }, "reset tournament")
        } finally {
            setResetting(false)
        }
    }

    const checkForTies = () => {
        if (!worldCupData?.standings) return

        const standings = worldCupData.standings as Standing[]
        const groups = ['A', 'B', 'C', 'D']

        for (const groupName of groups) {
            const groupStandings = standings.filter(s => s.group_name === groupName)

            // Check if all teams have 1 win each (3-way tie)
            if (groupStandings.length === 3 && groupStandings.every(s => s.wins === 1)) {
                // Check if we already have a tie-break decision for this group
                const groupId = groupStandings[0].group_id
                if (!tieBreakDecisions[groupId]) {
                    setTieBreakGroup(groupStandings)
                    setTieBreakDialogOpen(true)
                    return
                }
            }
        }
    }

    const handleTieBreak = async () => {
        if (!selectedWinner || tieBreakGroup.length === 0) return

        const groupId = tieBreakGroup[0].group_id

        // Store the tie-break decision in component state
        setTieBreakDecisions(prev => ({
            ...prev,
            [groupId]: selectedWinner
        }))

        setTieBreakDialogOpen(false)
        setSelectedWinner(null)

        toast({ title: 'Success', description: 'Tie-break resolved' })

        // Check if there are more unresolved ties
        const standings = worldCupData?.standings as Standing[]
        const groups = ['A', 'B', 'C', 'D']
        let hasMoreTies = false

        for (const groupName of groups) {
            const groupStandings = standings.filter(s => s.group_name === groupName)

            // Check if all teams have 1 win each (3-way tie)
            if (groupStandings.length === 3 && groupStandings.every(s => s.wins === 1)) {
                const currentGroupId = groupStandings[0].group_id
                if (!tieBreakDecisions[currentGroupId] && currentGroupId !== groupId) {
                    setTieBreakGroup(groupStandings)
                    setTieBreakDialogOpen(true)
                    hasMoreTies = true
                    break
                }
            }
        }

        // If no more ties, proceed with finalization
        if (!hasMoreTies) {
            setFinalizing(true)
            try {
                const response = await fetch(`/api/events/${eventId}/world-cup/finalize`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tieBreakDecisions: {
                            ...tieBreakDecisions,
                            [groupId]: selectedWinner
                        }
                    })
                })

                const data = await response.json()

                if (data.success) {
                    toast({ title: 'Success', description: 'Knockout stage created successfully' })
                    fetchWorldCupData()
                } else {
                    toast({ title: 'Error', description: data.message || 'Failed to create knockout stage', variant: 'destructive' })
                }
            } catch (error) {
                toast({ title: 'Error', description: 'Failed to create knockout stage', variant: 'destructive' })
            } finally {
                setFinalizing(false)
            }
        }
    }

    // Calculate standings with tie-break decisions applied
    const calculateStandingsWithTieBreaks = (standings: Standing[]) => {
        const updatedStandings = standings.map(standing => ({ ...standing }))

        // Apply tie-break decisions
        Object.entries(tieBreakDecisions).forEach(([groupId, winnerTeamId]) => {
            const teamStanding = updatedStandings.find(s =>
                s.group_id === parseInt(groupId) && s.team_id === winnerTeamId
            )
            if (teamStanding) {
                teamStanding.wins += 1
            }
        })

        // Recalculate positions
        const groupsByName = new Map()
        updatedStandings.forEach(standing => {
            if (!groupsByName.has(standing.group_name)) {
                groupsByName.set(standing.group_name, [])
            }
            groupsByName.get(standing.group_name).push(standing)
        })

        groupsByName.forEach((groupStandings, groupName) => {
            groupStandings.sort((a: Standing, b: Standing) => {
                if (b.wins !== a.wins) return b.wins - a.wins
                return a.team_id - b.team_id // Tiebreaker: team_id
            })

            groupStandings.forEach((standing: Standing, index: number) => {
                standing.position = index + 1
            })
        })

        return updatedStandings
    }

    useEffect(() => {
        if (worldCupData) {
            // Remove automatic tie detection - only check when finalize button is clicked
        }
    }, [worldCupData, tieBreakDecisions])

    if (loading) {
        return <div className="text-center py-8">Loading World Cup data...</div>
    }

    if (!worldCupData) {
        return <div className="text-center py-8">Failed to load World Cup data</div>
    }

    const { groups, groupMatches, knockoutMatches, standings } = worldCupData

    // Apply tie-break decisions to standings
    const finalStandings = calculateStandingsWithTieBreaks(standings)

    // Check if all group matches are completed
    const allGroupMatchesCompleted = groupMatches.every((match: GroupMatch) => match.status === 'completed')
    const knockoutStageExists = knockoutMatches.length > 0
    const allKnockoutMatchesCompleted = knockoutMatches.length > 0 && knockoutMatches.every((match: KnockoutMatch) => match.status === 'completed')

    const getRankDisplay = (position: number | null) => {
        if (position === null) return 'N/A'
        if (position === 1) return '🥇'
        if (position === 2) return '🥈'
        if (position === 3) return '🥉'
        return `${position}.`
    }

    const getStandingRowBackground = (position: number | null) => {
        if (position === null) return ''
        if (position === 1) return 'bg-green-50'
        if (position === 2) return 'bg-blue-50'
        if (position === 3) return 'bg-yellow-50'
        return ''
    }

    return (
        <>
            <div className="space-y-6">
                {/* Finalize Standings Button */}
                {allGroupMatchesCompleted && (knockoutMatches.length === 0 || !knockoutMatches.some((match: KnockoutMatch) => match.team1_id && match.team2_id)) && (
                    <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-6">
                            <div className="text-center space-y-4">
                                <h3 className="text-lg font-semibold text-green-800">
                                    All Group Matches Completed! 🎉
                                </h3>
                                <p className="text-green-700">
                                    Ready to advance to the knockout stage. Winners will be paired as follows:
                                </p>
                                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                                    <div className="p-3 bg-white rounded border">
                                        <div className="font-medium">Semi-Final 1</div>
                                        <div className="text-sm text-gray-600">Group A Winner vs Group D Winner</div>
                                    </div>
                                    <div className="p-3 bg-white rounded border">
                                        <div className="font-medium">Semi-Final 2</div>
                                        <div className="text-sm text-gray-600">Group B Winner vs Group C Winner</div>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleFinalizeStandings}
                                    disabled={finalizing}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {finalizing ? 'Creating Knockout Stage...' : 'Create Knockout Stage'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Calculate Final Standings Button */}
                {allKnockoutMatchesCompleted && tournamentFinalStandings.length === 0 && (
                    <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="p-6">
                            <div className="text-center space-y-4">
                                <h3 className="text-lg font-semibold text-blue-800">
                                    Tournament Complete! 🏆
                                </h3>
                                <p className="text-blue-700">
                                    All knockout matches are finished. Calculate the final tournament standings:
                                </p>
                                <div className="text-sm text-blue-600 space-y-1">
                                    <div>🥇 1st Place: 15 points</div>
                                    <div>🥈 2nd Place: 12 points</div>
                                    <div>🥉 3rd Place: 10 points</div>
                                    <div>4th Place: 8 points</div>
                                    <div>Group winners (no knockout): 5 points</div>
                                    <div>Group non-winners: 2 points</div>
                                </div>
                                <Button
                                    onClick={handleCalculateStandings}
                                    disabled={calculatingStandings}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {calculatingStandings ? 'Calculating...' : 'Calculate Final Standings'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Final Tournament Standings */}
                {tournamentFinalStandings.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Trophy className="h-5 w-5" />
                                    Final Tournament Standings
                                </div>
                                {isRefMode && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setResetDialogOpen(true)}
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                        Reset Tournament
                                    </Button>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2 md:py-3 px-2 md:px-4 text-sm md:text-base">Rank</th>
                                            <th className="text-left py-2 md:py-3 px-2 md:px-4 text-sm md:text-base">Team</th>
                                            <th className="text-right py-2 md:py-3 px-2 md:px-4 text-sm md:text-base">Points</th>
                                            <th className="text-right py-2 md:py-3 px-2 md:px-4 text-sm md:text-base">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tournamentFinalStandings.map((standing) => (
                                            <tr
                                                key={standing.team_id}
                                                className={`border-b ${getStandingRowBackground(standing.position)}`}
                                            >
                                                <td className="py-2 md:py-3 px-2 md:px-4">
                                                    <div className="flex items-center">
                                                        {getRankDisplay(standing.position)}
                                                    </div>
                                                </td>
                                                <td className="py-2 md:py-3 px-2 md:px-4 font-medium text-sm md:text-base">
                                                    <Link
                                                        href={`/teams/${standing.team_id}`}
                                                        className="hover:text-primary hover:underline transition-colors"
                                                    >
                                                        {standing.team_name}
                                                    </Link>
                                                </td>
                                                <td className="py-2 md:py-3 px-2 md:px-4 text-right font-bold text-sm md:text-base">
                                                    {standing.points}
                                                </td>
                                                <td className="py-2 md:py-3 px-2 md:px-4 text-right text-xs text-muted-foreground">
                                                    {standing.knockout_position ? (
                                                        <span>
                                                            {standing.knockout_position === 1 ? 'Champion' :
                                                                standing.knockout_position === 2 ? 'Runner-up' :
                                                                    standing.knockout_position === 3 ? '3rd Place' : '4th Place'}
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            {standing.group_wins > 0 ? `${standing.group_wins} group win${standing.group_wins > 1 ? 's' : ''}` : 'No group wins'}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Groups and Standings */}
                <Tabs defaultValue="groups" className="w-full">
                    <TabsList className="grid w-full grid-cols-1">
                        <TabsTrigger value="groups">Groups & Standings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="groups" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {groups.map((group: Group) => {
                                const groupStandings = finalStandings.filter(s => s.group_name === group.group_name)
                                const groupMatches = worldCupData?.groupMatches.filter((m: GroupMatch) => m.group_id === group.group_id) || []

                                return (
                                    <Card key={group.group_id}>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <span className="text-lg font-bold">{group.group_name}</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {/* Teams in Group */}
                                            <div>
                                                <h4 className="font-medium mb-2">Teams</h4>
                                                <div className="space-y-1">
                                                    {group.teams.map((team: { team_id: number; team_name: string }) => (
                                                        <div key={team.team_id} className="text-sm">
                                                            <Link
                                                                href={`/teams/${team.team_id}`}
                                                                className="hover:text-primary hover:underline transition-colors"
                                                            >
                                                                {team.team_name}
                                                            </Link>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Group Standings */}
                                            <div>
                                                <h4 className="font-medium mb-2">Standings</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="border-b">
                                                                <th className="text-left py-1 px-2">Pos</th>
                                                                <th className="text-left py-1 px-2">Team</th>
                                                                <th className="text-right py-1 px-2">Wins</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {groupStandings.map((standing) => (
                                                                <tr
                                                                    key={standing.team_id}
                                                                    className={`border-b ${standing.position === 1 ? 'bg-green-50' : ''}`}
                                                                >
                                                                    <td className="py-1 px-2">
                                                                        <div className="flex items-center">
                                                                            {standing.position === 1 ? (
                                                                                <span className="text-green-600 font-bold">🥇</span>
                                                                            ) : (
                                                                                <span>{standing.position}.</span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-1 px-2 font-medium">
                                                                        <Link
                                                                            href={`/teams/${standing.team_id}`}
                                                                            className="hover:text-primary hover:underline transition-colors"
                                                                        >
                                                                            {standing.team_name}
                                                                        </Link>
                                                                    </td>
                                                                    <td className="py-1 px-2 text-right font-bold">{standing.wins}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Group Matches */}
                                            <div>
                                                <h4 className="font-medium mb-2">Matches</h4>
                                                <div className="space-y-2">
                                                    {groupMatches.map((match: GroupMatch) => (
                                                        <div
                                                            key={match.match_id}
                                                            className={`p-3 rounded border cursor-pointer transition-colors ${match.status === 'completed'
                                                                ? 'bg-green-50 border-green-200'
                                                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                                                }`}
                                                            onClick={() => {
                                                                if (match.status !== 'completed') {
                                                                    setSelectedMatch(match)
                                                                    setDialogOpen(true)
                                                                }
                                                            }}
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex-1">
                                                                    <div className="font-medium text-sm">
                                                                        {match.team1_name} vs {match.team2_name}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {match.group_name === 'A' || match.group_name === 'B' ? 'Court 1' : 'Court 2'}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    {match.status === 'completed' ? (
                                                                        <div className="text-sm">
                                                                            <span className="font-bold text-green-600">
                                                                                {match.winner_id === match.team1_id ? match.team1_name : match.team2_name}
                                                                            </span>
                                                                            <span className="text-muted-foreground"> wins</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-sm text-muted-foreground">Click to select winner</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Group Matches */}
                {/* This section is now redundant as matches are displayed within groups */}
                {/* <Card>
                    <CardHeader>
                        <CardTitle>Group Matches</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groupMatches.map((match: GroupMatch) => (
                                <Card
                                    key={match.match_id}
                                    className={`cursor-pointer hover:bg-gray-50 ${match.status === 'completed' ? 'bg-green-50' : ''}`}
                                    onClick={() => handleMatchClick(match)}
                                >
                                    <CardContent className="p-4">
                                        <div className="text-center space-y-2">
                                            <div className="text-sm text-gray-500">
                                                {match.group_name === 'A' || match.group_name === 'B' ? 'Court 1' : 'Court 2'}
                                            </div>
                                            <div className="font-medium">{match.team1_name}</div>
                                            <div className="text-sm text-gray-500">vs</div>
                                            <div className="font-medium">{match.team2_name}</div>
                                            {match.winner_id && (
                                                <div className="text-sm font-medium text-green-600">
                                                    Winner: {match.winner_id === match.team1_id ? match.team1_name : match.team2_name}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card> */}

                {/* Knockout Matches */}
                {knockoutMatches.length > 0 && knockoutMatches.some((match: KnockoutMatch) => match.team1_id && match.team2_id) && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5" />
                                Knockout Stage
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2 md:py-3 px-2 md:px-4 text-sm md:text-base">Round</th>
                                            <th className="text-left py-2 md:py-3 px-2 md:px-4 text-sm md:text-base">Match</th>
                                            <th className="text-right py-2 md:py-3 px-2 md:px-4 text-sm md:text-base">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {knockoutMatches.map((match: KnockoutMatch) => (
                                            <tr
                                                key={match.match_id}
                                                className={`border-b ${match.status === 'completed' ? 'bg-green-50' : 'hover:bg-muted/50'}`}
                                            >
                                                <td className="py-2 md:py-3 px-2 md:px-4">
                                                    <div className="font-medium text-sm md:text-base">
                                                        {match.round === 'semi_final_1' ? 'Semi-Final 1' :
                                                            match.round === 'semi_final_2' ? 'Semi-Final 2' :
                                                                match.round === 'final' ? 'Final' : '3rd Place'}
                                                    </div>
                                                </td>
                                                <td className="py-2 md:py-3 px-2 md:px-4">
                                                    <div className="space-y-1">
                                                        <div className="font-medium text-sm md:text-base">
                                                            {match.team1_name || 'TBD'} vs {match.team2_name || 'TBD'}
                                                        </div>
                                                        {match.status === 'completed' && match.winner_id && (
                                                            <div className="text-sm text-green-600 font-medium">
                                                                🏆 {match.winner_id === match.team1_id ? match.team1_name : match.team2_name} wins
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-2 md:py-3 px-2 md:px-4 text-right">
                                                    <div
                                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${match.status === 'completed'
                                                            ? 'bg-green-100 text-green-800'
                                                            : match.team1_id && match.team2_id
                                                                ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                                                : 'bg-gray-100 text-gray-800'
                                                            }`}
                                                        onClick={() => {
                                                            if (match.status !== 'completed' && match.team1_id && match.team2_id) {
                                                                setSelectedMatch(match)
                                                                setDialogOpen(true)
                                                            }
                                                        }}
                                                    >
                                                        {match.status === 'completed' ? 'Completed' :
                                                            match.team1_id && match.team2_id ? 'Click to select winner' : 'Pending'}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Winner Selection Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Select Winner</DialogTitle>
                        <DialogDescription>
                            Click on the winning team
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            variant="outline"
                            onClick={() => handleWinnerSelect(selectedMatch?.team1_id || 0)}
                            className="h-20 flex flex-col items-center justify-center"
                        >
                            <span className="font-semibold">{selectedMatch?.team1_name}</span>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleWinnerSelect(selectedMatch?.team2_id || 0)}
                            className="h-20 flex flex-col items-center justify-center"
                        >
                            <span className="font-semibold">{selectedMatch?.team2_name}</span>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Tie-Break Dialog */}
            <Dialog open={tieBreakDialogOpen} onOpenChange={setTieBreakDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>3-Way Tie in Group {tieBreakGroup[0]?.group_name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-muted-foreground">
                            All teams have 1 win each. Please select the group winner:
                        </p>
                        <Select value={selectedWinner?.toString() || ''} onValueChange={val => setSelectedWinner(parseInt(val))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select winner" />
                            </SelectTrigger>
                            <SelectContent>
                                {tieBreakGroup.map((team) => (
                                    <SelectItem key={team.team_id} value={team.team_id.toString()}>
                                        {team.team_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                            <Button onClick={handleTieBreak} disabled={!selectedWinner} className="flex-1">
                                Set Winner
                            </Button>
                            <Button variant="outline" onClick={() => setTieBreakDialogOpen(false)} className="flex-1">
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Reset Confirmation Dialog */}
            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Tournament Reset</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reset this tournament? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setResetDialogOpen(false)} className="text-red-600 border-red-200 hover:bg-red-50">
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleResetEvent} disabled={resetting}>
                            {resetting ? 'Resetting...' : 'Reset Tournament'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
} 