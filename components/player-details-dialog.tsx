import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Beer, Book, User, Volleyball, Trophy } from "lucide-react"

interface PlayerDetailsDialogProps {
    player: {
        player_id: number
        player_name: string
        email: string
        athleticism: number
        alcohol_tolerance: number
        listening_comprehension: number
        competitiveness: number
    } | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function PlayerDetailsDialog({ player, open, onOpenChange }: PlayerDetailsDialogProps) {
    if (!player) return null

    // Generate icons based on rating
    const renderIcons = (rating: number, Icon: any, color: string) => {
        const numRating = Math.min(Math.max(rating, 0), 5)

        return (
            <div className="flex items-center gap-1">
                {[...Array(numRating)].map((_, i) => (
                    <Icon key={i} className={`h-5 w-5 ${color}`} />
                ))}
                {[...Array(5 - numRating)].map((_, i) => (
                    <Icon key={i} className="h-5 w-5 text-muted-foreground opacity-30" />
                ))}
            </div>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {player.player_name}
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Athleticism</div>
                            {renderIcons(player.athleticism, Volleyball, "text-green-500")}
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm font-medium">Alcohol Tolerance</div>
                            {renderIcons(player.alcohol_tolerance, Beer, "text-amber-500")}
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm font-medium">Listening Comprehension</div>
                            {renderIcons(player.listening_comprehension, Book, "text-blue-500")}
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm font-medium">Competitiveness</div>
                            {renderIcons(player.competitiveness, Trophy, "text-purple-500")}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
} 