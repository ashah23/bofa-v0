"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Medal } from "lucide-react"
import { HeatCard } from "@/components/heat-card"
import { startHeat, completeHeat, resetHeatEvent } from "@/app/events/[eventId]/heat_actions"
import { StandingsReviewModal } from "@/components/standings-review-modal"
import { useState } from "react"
import Link from "next/link"
import { useRefModeGuard } from "@/hooks/use-ref-mode-guard"
import { useRefMode } from "@/components/ref-mode-context"
import { ResetPasscodeDialog } from "@/components/reset-passcode-dialog"

interface HeatEventViewProps {
  event: any
  heatMatches: any[]
  standings: any[] | null
  eventId: string
}

export function HeatEventView({ event, heatMatches, standings, eventId }: HeatEventViewProps) {
  const allHeatsCompleted = heatMatches?.every((match: any) => match.heat_status === 'COMPLETED')
  const [showStandingsModal, setShowStandingsModal] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const { guardRefModeAsync } = useRefModeGuard()
  const { isRefMode } = useRefMode()

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-3xl">{event.event_name}</CardTitle>
              <CardDescription>Heat-based Event</CardDescription>
            </div>
            <div className="flex gap-4">
              {allHeatsCompleted && event.event_status !== 'COMPLETED' && isRefMode && (
                <Button
                  onClick={() => setShowStandingsModal(true)}
                  variant="default"
                >
                  Complete Event & Calculate Standings
                </Button>
              )}
              {event.event_status === 'COMPLETED' && isRefMode && (
                <Button
                  onClick={() => setShowResetDialog(true)}
                  variant="destructive"
                >
                  Reset Event
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {standings && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Final Standings</h3>

                {/* Olympic Podium */}
                <div className="mb-8">
                  <div className="relative h-[200px] w-full max-w-4xl mx-auto">
                    {/* Podium Base */}
                    <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-gray-100 rounded-t-2xl" />

                    {/* Podium Steps */}
                    <div className="absolute bottom-0 left-0 right-0 h-[200px] flex justify-center items-end gap-4 px-8">
                      {/* 2nd Place */}
                      <div className="w-1/3 h-[160px] bg-gray-200 rounded-t-xl flex flex-col items-center justify-center relative">
                        <Award className="h-10 w-10 text-gray-400 mb-2" />
                        <Link
                          href={`/teams/${standings[1]?.team_id}`}
                          className="font-bold text-gray-600 hover:text-gray-800 hover:underline transition-colors"
                        >
                          {standings[1]?.team_name}
                        </Link>
                        <span className="text-sm text-gray-500">{standings[1]?.point_value} pts</span>
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-200 px-4 py-1 rounded-full">
                          <span className="font-bold text-gray-600">2nd</span>
                        </div>
                      </div>

                      {/* 1st Place */}
                      <div className="w-1/3 h-[200px] bg-yellow-100 rounded-t-xl flex flex-col items-center justify-center relative">
                        <Medal className="h-12 w-12 text-yellow-500 mb-2" />
                        <Link
                          href={`/teams/${standings[0]?.team_id}`}
                          className="font-bold text-yellow-600 hover:text-yellow-800 hover:underline transition-colors"
                        >
                          {standings[0]?.team_name}
                        </Link>
                        <span className="text-sm text-yellow-500">{standings[0]?.point_value} pts</span>
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-yellow-100 px-4 py-1 rounded-full">
                          <span className="font-bold text-yellow-600">1st</span>
                        </div>
                      </div>

                      {/* 3rd Place */}
                      <div className="w-1/3 h-[120px] bg-amber-100 rounded-t-xl flex flex-col items-center justify-center relative">
                        <Award className="h-8 w-8 text-amber-700 mb-2" />
                        <Link
                          href={`/teams/${standings[2]?.team_id}`}
                          className="font-bold text-amber-700 hover:text-amber-900 hover:underline transition-colors"
                        >
                          {standings[2]?.team_name}
                        </Link>
                        <span className="text-sm text-amber-600">{standings[2]?.point_value} pts</span>
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-amber-100 px-4 py-1 rounded-full">
                          <span className="font-bold text-amber-700">3rd</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rest of the Teams */}
                {standings.length > 3 && (
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-12 px-4 text-left align-middle font-medium">Rank</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Team</th>
                          <th className="h-12 px-4 text-right align-middle font-medium">Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.slice(3).map((standing: any) => (
                          <tr key={standing.team_name} className={`border-b transition-colors hover:bg-muted/50 ${standing.disqualified ? 'bg-red-50' : ''}`}>
                            <td className="p-4 align-middle">
                              {standing.disqualified ? (
                                <span className="text-red-600 font-bold">DQ</span>
                              ) : (
                                standing.rank
                              )}
                            </td>
                            <td className={`p-4 align-middle font-medium ${standing.disqualified ? 'text-red-600 line-through' : ''}`}>
                              <Link
                                href={`/teams/${standing.team_id}`}
                                className="hover:text-primary hover:underline transition-colors"
                              >
                                {standing.team_name}
                              </Link>
                            </td>
                            <td className="p-4 align-middle text-right">{standing.point_value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <h3 className="text-lg font-semibold">Heat Matches</h3>
            {heatMatches && heatMatches.length > 0 ? (
              <div className="grid gap-4">
                {heatMatches.map((match: any) => (
                  <HeatCard
                    key={match.heat_id}
                    heat={match}
                    onStartHeat={startHeat}
                    onCompleteHeat={completeHeat}
                  />
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-center py-4">
                No heat matches recorded yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <StandingsReviewModal
        isOpen={showStandingsModal}
        onClose={() => setShowStandingsModal(false)}
        eventId={eventId}
        onComplete={() => {
          setShowStandingsModal(false)
          // Refresh the page to show updated standings
          window.location.reload()
        }}
      />

      <ResetPasscodeDialog
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onConfirm={async () => {
          await guardRefModeAsync(async () => {
            await resetHeatEvent(eventId)
          }, "reset event")
        }}
        title="Reset Heat Event"
        description="This will reset all heat matches and standings, setting the event back to in progress. This action cannot be undone."
        actionName="reset"
      />
    </>
  )
} 