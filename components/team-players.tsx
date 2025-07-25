'use client'

import { User } from "lucide-react"
import { useState } from "react"
import { PlayerDetailsDialog } from "./player-details-dialog"

interface Player {
    player_id: number
    player_name: string
    email: string
    athleticism: number
    alcohol_tolerance: number
    listening_comprehension: number
    competitiveness: number
}

interface TeamPlayersProps {
    players: Player[]
}

export function TeamPlayers({ players }: TeamPlayersProps) {
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

    return (
        <>
            <ul className="space-y-2">
                {players?.map((player) => (
                    <li key={player.player_id} className="flex items-center p-2 rounded-md hover:bg-muted">
                        <div>
                            <button
                                onClick={() => setSelectedPlayer(player)}
                                className="font-medium hover:underline text-left"
                            >
                                {player.player_name}
                            </button>
                        </div>
                    </li>
                ))}
                {(!players || players.length === 0) && (
                    <li className="text-muted-foreground text-center py-4">No players assigned to this team yet.</li>
                )}
            </ul>

            <PlayerDetailsDialog
                player={selectedPlayer}
                open={!!selectedPlayer}
                onOpenChange={(open) => !open && setSelectedPlayer(null)}
            />
        </>
    )
} 