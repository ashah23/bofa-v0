'use server'

import { revalidatePath } from "next/cache"

export async function startMatch(matchId: string) {
    try {
        console.log('Starting match:', matchId)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/group-ko-matches/${matchId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'IN_PROGRESS' }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Failed to start match:', errorData)
            throw new Error(errorData.error || 'Failed to start match')
        }

        revalidatePath('/events/[eventId]')
    } catch (error) {
        console.error('Error in startMatch:', error)
        throw error
    }
}

export async function completeMatch(matchId: string, scores: { [key: string]: number }) {
    try {
        console.log('Completing match:', { matchId, scores })
        // Convert team name keys to team number keys
        const formattedScores = {
            team1_score: scores['team1_name'] || null,
            team2_score: scores['team4_name'] || null,
        }
        console.log('Formatted scores:', formattedScores)

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/group-ko-matches/${matchId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'COMPLETED',
                scores: formattedScores
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Failed to complete match:', errorData)
            throw new Error(errorData.error || 'Failed to complete match')
        }

        revalidatePath('/events/[eventId]')
    } catch (error) {
        console.error('Error in completeMatch:', error)
        throw error
    }
}

export async function completeMatchEvent(eventId: string) {
    try {
        console.log('Completing match event:', eventId)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/${eventId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Failed to complete match event:', errorData)
            throw new Error(errorData.error || 'Failed to complete match event')
        }

        revalidatePath('/events/[eventId]')
    } catch (error) {
        console.error('Error in completeMatchEvent:', error)
        throw error
    }
}

export async function resetMatchEvent(eventId: string) {
    try {
        console.log('Resetting match event:', eventId)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/${eventId}/reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Failed to reset match event:', errorData)
            throw new Error(errorData.error || 'Failed to reset match event')
        }

        revalidatePath('/events/[eventId]')
    } catch (error) {
        console.error('Error in resetMatchEvent:', error)
        throw error
    }
} 