"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TeamTimer } from './team-timer'

// Fixed colors for each team position
const TEAM_COLORS = [
    { name: 'Blue', value: '#60a5fa', bg: '#f0f9ff', border: '#bae6fd' },    // Team 1 - lighter blue
    { name: 'Green', value: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },   // Team 2
    { name: 'Red', value: '#ef4444', bg: '#fde6e7', border: '#fca5a5' },  // Team 3
    { name: 'Purple', value: '#7c3aed', bg: '#f3f4f6', border: '#a78bfa' },  // Team 4 - darker purple
]

interface HeatCardProps {
    heat: {
        heat_id: string
        heat_number: number
        heat_status: string
        team1_name?: string
        team2_name?: string
        team3_name?: string
        team4_name?: string
        team1_time?: number
        team2_time?: number
        team3_time?: number
        team4_time?: number
    }
    onStartHeat: (heatId: string) => void
    onCompleteHeat: (heatId: string, times: { [key: string]: number }) => void
}

export function HeatCard({ heat, onStartHeat, onCompleteHeat }: HeatCardProps) {
    const [showTimers, setShowTimers] = useState(false)
    const [teamTimes, setTeamTimes] = useState<{ [key: string]: number }>({})
    const [isRunning, setIsRunning] = useState(false)
    const [startTime, setStartTime] = useState<number | null>(null)
    const [stoppedTeams, setStoppedTeams] = useState<Set<string>>(new Set())

    const getTeamColor = (teamIndex: number) => {
        return TEAM_COLORS[teamIndex] || TEAM_COLORS[0]
    }

    const startAllTimers = () => {
        setIsRunning(true)
        setStartTime(Date.now())
        setStoppedTeams(new Set())
    }

    const handleTeamStop = (teamName: string, time: number) => {
        setTeamTimes(prev => ({
            ...prev,
            [teamName]: time
        }))
        setStoppedTeams(prev => new Set([...prev, teamName]))
    }

    const handleComplete = () => {
        // Convert team times to the format expected by the API
        const formattedTimes: { [key: string]: number } = {}
        if (heat.team1_name && teamTimes[heat.team1_name]) formattedTimes.team1_name = teamTimes[heat.team1_name]
        if (heat.team2_name && teamTimes[heat.team2_name]) formattedTimes.team2_name = teamTimes[heat.team2_name]
        if (heat.team3_name && teamTimes[heat.team3_name]) formattedTimes.team3_name = teamTimes[heat.team3_name]
        if (heat.team4_name && teamTimes[heat.team4_name]) formattedTimes.team4_name = teamTimes[heat.team4_name]

        onCompleteHeat(heat.heat_id, formattedTimes)
        setShowTimers(false)
        setIsRunning(false)
        setStartTime(null)
        setStoppedTeams(new Set())
    }

    const allTeamsHaveTimes = () => {
        const teams = [
            heat.team1_name,
            heat.team2_name,
            heat.team3_name,
            heat.team4_name
        ].filter(Boolean)

        return teams.every(team => team && teamTimes[team] !== undefined)
    }

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="font-medium">Heat {heat.heat_number}</div>
                        <div className="flex items-center gap-2">
                            {heat.heat_status === 'SCHEDULED' && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                        onStartHeat(heat.heat_id)
                                        setShowTimers(true)
                                    }}
                                >
                                    Start Heat
                                </Button>
                            )}
                            <Badge variant={
                                heat.heat_status === 'COMPLETED' ? 'destructive' :
                                    heat.heat_status === 'IN_PROGRESS' ? 'default' :
                                        'secondary'
                            } className={
                                heat.heat_status === 'IN_PROGRESS' ? 'bg-green-300 hover:bg-green-400' :
                                    heat.heat_status === 'COMPLETED' ? 'bg-orange-300 hover:bg-orange-400' :
                                        'bg-blue-300 hover:bg-blue-400'
                            }>
                                {heat.heat_status === 'COMPLETED' ? 'Completed' :
                                    heat.heat_status === 'IN_PROGRESS' ? 'In Progress' :
                                        'Scheduled'}
                            </Badge>
                        </div>
                    </div>

                    {showTimers && heat.heat_status === 'IN_PROGRESS' && (
                        <div className="space-y-4">
                            <div className="flex justify-center gap-2 mb-4">
                                {!isRunning ? (
                                    <Button onClick={startAllTimers} variant="default">
                                        Start All Timers
                                    </Button>
                                ) : (
                                    <div className="text-sm text-muted-foreground">
                                        {stoppedTeams.size} of {[
                                            heat.team1_name,
                                            heat.team2_name,
                                            heat.team3_name,
                                            heat.team4_name
                                        ].filter(Boolean).length} teams stopped
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {heat.team1_name && (
                                    <TeamTimer
                                        teamName={heat.team1_name}
                                        onTimeSubmit={(time) => handleTeamStop(heat.team1_name!, time)}
                                        isRunning={isRunning && !stoppedTeams.has(heat.team1_name!)}
                                        startTime={startTime}
                                        onStop={() => { }}
                                        teamColor={getTeamColor(0)}
                                    />
                                )}
                                {heat.team2_name && (
                                    <TeamTimer
                                        teamName={heat.team2_name}
                                        onTimeSubmit={(time) => handleTeamStop(heat.team2_name!, time)}
                                        isRunning={isRunning && !stoppedTeams.has(heat.team2_name!)}
                                        startTime={startTime}
                                        onStop={() => { }}
                                        teamColor={getTeamColor(1)}
                                    />
                                )}
                                {heat.team3_name && (
                                    <TeamTimer
                                        teamName={heat.team3_name}
                                        onTimeSubmit={(time) => handleTeamStop(heat.team3_name!, time)}
                                        isRunning={isRunning && !stoppedTeams.has(heat.team3_name!)}
                                        startTime={startTime}
                                        onStop={() => { }}
                                        teamColor={getTeamColor(2)}
                                    />
                                )}
                                {heat.team4_name && (
                                    <TeamTimer
                                        teamName={heat.team4_name}
                                        onTimeSubmit={(time) => handleTeamStop(heat.team4_name!, time)}
                                        isRunning={isRunning && !stoppedTeams.has(heat.team4_name!)}
                                        startTime={startTime}
                                        onStop={() => { }}
                                        teamColor={getTeamColor(3)}
                                    />
                                )}
                            </div>
                            <Button
                                onClick={handleComplete}
                                disabled={!allTeamsHaveTimes()}
                                className="w-full"
                            >
                                Complete Heat
                            </Button>
                        </div>
                    )}

                    {!showTimers && (
                        <div className="space-y-2">
                            {heat.team1_name && (
                                <div className="flex justify-between items-center p-2 rounded-md" 
                                     style={{ 
                                         backgroundColor: getTeamColor(0).bg,
                                         border: `1px solid ${getTeamColor(0).border}`
                                     }}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full" 
                                             style={{ backgroundColor: getTeamColor(0).value }}></div>
                                        <span>{heat.team1_name}</span>
                                    </div>
                                    <span className="text-muted-foreground">
                                        {heat.team1_time ? `${heat.team1_time}s` : 'Pending'}
                                    </span>
                                </div>
                            )}
                            {heat.team2_name && (
                                <div className="flex justify-between items-center p-2 rounded-md" 
                                     style={{ 
                                         backgroundColor: getTeamColor(1).bg,
                                         border: `1px solid ${getTeamColor(1).border}`
                                     }}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full" 
                                             style={{ backgroundColor: getTeamColor(1).value }}></div>
                                        <span>{heat.team2_name}</span>
                                    </div>
                                    <span className="text-muted-foreground">
                                        {heat.team2_time ? `${heat.team2_time}s` : 'Pending'}
                                    </span>
                                </div>
                            )}
                            {heat.team3_name && (
                                <div className="flex justify-between items-center p-2 rounded-md" 
                                     style={{ 
                                         backgroundColor: getTeamColor(2).bg,
                                         border: `1px solid ${getTeamColor(2).border}`
                                     }}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full" 
                                             style={{ backgroundColor: getTeamColor(2).value }}></div>
                                        <span>{heat.team3_name}</span>
                                    </div>
                                    <span className="text-muted-foreground">
                                        {heat.team3_time ? `${heat.team3_time}s` : 'Pending'}
                                    </span>
                                </div>
                            )}
                            {heat.team4_name && (
                                <div className="flex justify-between items-center p-2 rounded-md" 
                                     style={{ 
                                         backgroundColor: getTeamColor(3).bg,
                                         border: `1px solid ${getTeamColor(3).border}`
                                     }}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full" 
                                             style={{ backgroundColor: getTeamColor(3).value }}></div>
                                        <span>{heat.team4_name}</span>
                                    </div>
                                    <span className="text-muted-foreground">
                                        {heat.team4_time ? `${heat.team4_time}s` : 'Pending'}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
} 