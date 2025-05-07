"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  type Matchup,
  type User,
  type Heat,
  type HeatResult,
  getEventById,
  getMatchupsByEventId,
  getHeatsByEventId,
  setCurrentUser,
  formatTime,
} from "@/lib/data"
import { ArrowLeft, Calendar, Clock, Trophy } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { useState, useEffect, use } from "react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Timer } from "@/components/timer"
import { TeamTimer } from "@/components/team-timer"
import { ScoreInput } from "@/components/score-input"

export default function EventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params)
  const [user, setUser] = useState<User | null>(null)
  const [matchups, setMatchups] = useState<Matchup[]>([])
  const [heats, setHeats] = useState<Heat[]>([])
  const [timerRunning, setTimerRunning] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [teamTimes, setTeamTimes] = useState<Record<string, number>>({})

  useEffect(() => {
    // In a real app, this would come from authentication
    setUser(setCurrentUser("user-6")) // Default to referee for demo
  }, [])

  const event = getEventById(eventId)

  useEffect(() => {
    if (event) {
      if (event.type === "head-to-head") {
        setMatchups(getMatchupsByEventId(event.id))
      } else {
        setHeats(getHeatsByEventId(event.id))
      }
    }
  }, [event])

  if (!event) {
    notFound()
  }

  const isHeatEvent = event.type === "heat"

  // Head-to-head event functions
  const startMatchup = (matchupId: string) => {
    setMatchups(matchups.map((m) => (m.id === matchupId ? { ...m, status: "in-progress" } : m)))
  }

  const updateMatchupScore = (matchupId: string, teamId: string, score: number) => {
    setMatchups(
      matchups.map((m) => {
        if (m.id === matchupId) {
          const scores = { ...(m.scores || {}) }
          scores[teamId] = score
          return { ...m, scores }
        }
        return m
      }),
    )
  }

  const completeMatchup = (matchupId: string, winnerId: string) => {
    setMatchups(
      matchups.map((m) => {
        if (m.id === matchupId) {
          return {
            ...m,
            status: "completed",
            winner: winnerId,
          }
        }
        return m
      }),
    )
  }

  // Heat event functions
  const startHeat = (heatId: string) => {
    setHeats(
      heats.map((h) => {
        if (h.id === heatId) {
          return { ...h, status: "in-progress" }
        }
        return h
      }),
    )
    setTimerRunning(true)
    setStartTime(Date.now())
    setTeamTimes({})
  }

  const stopTeamTimer = (heatId: string, teamId: string, endTime: number) => {
    if (!startTime) return

    const elapsedTime = (endTime - startTime) / 1000 // convert to seconds
    const newTeamTimes = { ...teamTimes, [teamId]: elapsedTime }
    setTeamTimes(newTeamTimes)

    // Check if all teams have finished
    const currentHeat = heats.find((h) => h.id === heatId)
    if (currentHeat && Object.keys(newTeamTimes).length === currentHeat.teamIds.length) {
      completeHeat(heatId, newTeamTimes)
    }
  }

  const completeHeat = (heatId: string, times: Record<string, number>) => {
    // Sort teams by time (ascending)
    const sortedTeams = Object.entries(times).sort(([, timeA], [, timeB]) => timeA - timeB)

    // Create results with ranks
    const results: HeatResult[] = sortedTeams.map(([teamId, time], index) => ({
      teamId,
      time,
      rank: index + 1,
    }))

    setHeats(
      heats.map((h) => {
        if (h.id === heatId) {
          return {
            ...h,
            status: "completed",
            results,
          }
        }
        return h
      }),
    )
    setTimerRunning(false)
  }

  const resetHeat = (heatId: string) => {
    setHeats(
      heats.map((h) => {
        if (h.id === heatId) {
          return { ...h, status: "scheduled", results: undefined }
        }
        return h
      }),
    )
    setTimerRunning(false)
    setStartTime(null)
    setTeamTimes({})
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "TBD"
    return format(new Date(dateString), "MMM d, yyyy")
  }

  const formatTimeOfDay = (dateString?: string) => {
    if (!dateString) return ""
    return format(new Date(dateString), "h:mm a")
  }

  const isReferee = user?.role === "referee"

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/events">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>
      </Link>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-3xl">{event.name}</CardTitle>
                  <CardDescription className="mt-2">{event.description}</CardDescription>
                </div>
                <Badge variant={event.type === "head-to-head" ? "default" : "secondary"}>
                  {event.type === "head-to-head" ? "Head to Head" : "Heat"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-4">
                <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                <span className="font-medium">{event.pointsAwarded} points awarded to winner</span>
              </div>

              {isHeatEvent ? (
                // Heat-based event content
                <div>
                  <h3 className="text-lg font-semibold mb-4">Heats</h3>

                  {heats.length > 0 ? (
                    <div className="space-y-6">
                      {heats.map((heat) => (
                        <Card key={heat.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg">Heat {heat.id.split("-")[1]}</CardTitle>
                              <Badge
                                variant={
                                  heat.status === "completed"
                                    ? "outline"
                                    : heat.status === "in-progress"
                                      ? "default"
                                      : "secondary"
                                }
                              >
                                {heat.status === "completed"
                                  ? "Completed"
                                  : heat.status === "in-progress"
                                    ? "In Progress"
                                    : "Scheduled"}
                              </Badge>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>{formatDate(heat.startTime)}</span>
                              <Clock className="h-4 w-4 ml-3 mr-1" />
                              <span>{formatTimeOfDay(heat.startTime)}</span>
                            </div>
                          </CardHeader>

                          <CardContent>
                            {heat.status === "in-progress" && isReferee && (
                              <div className="mb-6">
                                <Timer
                                  isRunning={timerRunning}
                                  onStart={() => setTimerRunning(true)}
                                  onStop={() => setTimerRunning(false)}
                                  onReset={() => resetHeat(heat.id)}
                                />
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              {heat.teamIds.map((teamId, index) => (
                                <TeamTimer
                                  key={teamId}
                                  teamId={teamId}
                                  teamName={heat.teamNames[index]}
                                  isRunning={heat.status === "in-progress" && timerRunning}
                                  onStop={(id, time) => stopTeamTimer(heat.id, id, time)}
                                  finishedTime={
                                    heat.results
                                      ? heat.results.find((r) => r.teamId === teamId)?.time
                                      : teamTimes[teamId]
                                  }
                                />
                              ))}
                            </div>

                            {heat.status === "completed" && heat.results && (
                              <div className="mt-6">
                                <h4 className="font-medium mb-2">Results</h4>
                                <div className="space-y-2">
                                  {heat.results
                                    .sort((a, b) => (a.rank || 999) - (b.rank || 999))
                                    .map((result) => {
                                      const teamName = heat.teamNames[heat.teamIds.indexOf(result.teamId)]
                                      return (
                                        <div
                                          key={result.teamId}
                                          className="flex justify-between items-center p-2 rounded bg-muted/30"
                                        >
                                          <div className="flex items-center">
                                            <span className="font-bold w-6 text-center">{result.rank}</span>
                                            <span className="ml-2">{teamName}</span>
                                          </div>
                                          <span className="font-mono">{formatTime(result.time)}</span>
                                        </div>
                                      )
                                    })}
                                </div>
                              </div>
                            )}
                          </CardContent>

                          {isReferee && (
                            <CardFooter className="flex justify-end gap-2 bg-muted/10">
                              {heat.status === "scheduled" && (
                                <Button onClick={() => startHeat(heat.id)}>Start Heat</Button>
                              )}
                              {heat.status === "in-progress" && (
                                <Button variant="outline" onClick={() => resetHeat(heat.id)}>
                                  Reset Heat
                                </Button>
                              )}
                            </CardFooter>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No heats scheduled for this event yet.</div>
                  )}
                </div>
              ) : (
                // Head-to-head event content
                <div>
                  <h3 className="text-lg font-semibold mb-4">Matchups</h3>

                  {matchups.length > 0 ? (
                    <div className="space-y-4">
                      {matchups.map((matchup) => (
                        <Card key={matchup.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg">
                                {matchup.teamNames[0]} vs {matchup.teamNames[1]}
                              </CardTitle>
                              <Badge
                                variant={
                                  matchup.status === "completed"
                                    ? "outline"
                                    : matchup.status === "in-progress"
                                      ? "default"
                                      : "secondary"
                                }
                              >
                                {matchup.status === "completed"
                                  ? "Completed"
                                  : matchup.status === "in-progress"
                                    ? "In Progress"
                                    : "Scheduled"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center text-sm text-muted-foreground mb-4">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>{formatDate(matchup.startTime)}</span>
                              <Clock className="h-4 w-4 ml-3 mr-1" />
                              <span>{formatTimeOfDay(matchup.startTime)}</span>
                            </div>

                            {(matchup.status === "in-progress" || matchup.status === "completed") && isReferee && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <ScoreInput
                                  teamId={matchup.teamIds[0]}
                                  teamName={matchup.teamNames[0]}
                                  currentScore={matchup.scores?.[matchup.teamIds[0]] || 0}
                                  onScoreSubmit={(teamId, score) => updateMatchupScore(matchup.id, teamId, score)}
                                  disabled={matchup.status === "completed"}
                                />
                                <ScoreInput
                                  teamId={matchup.teamIds[1]}
                                  teamName={matchup.teamNames[1]}
                                  currentScore={matchup.scores?.[matchup.teamIds[1]] || 0}
                                  onScoreSubmit={(teamId, score) => updateMatchupScore(matchup.id, teamId, score)}
                                  disabled={matchup.status === "completed"}
                                />
                              </div>
                            )}

                            {matchup.status === "completed" && matchup.winner && (
                              <div className="mt-4 p-3 bg-muted/30 rounded-md">
                                <div className="font-medium">Winner: </div>
                                <div className="flex justify-between items-center">
                                  <span>{matchup.teamNames[matchup.teamIds.indexOf(matchup.winner)]}</span>
                                  {matchup.scores && (
                                    <div className="font-mono">
                                      {matchup.scores[matchup.teamIds[0]]} - {matchup.scores[matchup.teamIds[1]]}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                          {isReferee && matchup.status !== "completed" && (
                            <CardFooter className="flex justify-end gap-2">
                              {matchup.status === "scheduled" && (
                                <Button size="sm" onClick={() => startMatchup(matchup.id)}>
                                  Start Matchup
                                </Button>
                              )}
                              {matchup.status === "in-progress" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => completeMatchup(matchup.id, matchup.teamIds[0])}
                                  >
                                    {matchup.teamNames[0]} Wins
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => completeMatchup(matchup.id, matchup.teamIds[1])}
                                  >
                                    {matchup.teamNames[1]} Wins
                                  </Button>
                                </>
                              )}
                            </CardFooter>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No matchups scheduled for this event yet.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                  <Badge variant={event.completed ? "outline" : "destructive"}>
                    {event.completed ? "Completed" : "Upcoming"}
                  </Badge>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Type</h4>
                  <p>{event.type === "head-to-head" ? "Head to Head Competition" : "Heat-based Competition"}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Points Awarded</h4>
                  <p>{event.pointsAwarded}</p>
                </div>

                <Separator />

                {isReferee && (
                  <div className="pt-2">
                    <h4 className="text-sm font-medium mb-2">Referee Controls</h4>
                    <Button className="w-full" disabled={event.completed}>
                      {event.completed ? "Event Completed" : "Complete Event"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
