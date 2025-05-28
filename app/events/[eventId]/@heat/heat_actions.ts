'use server'

import { revalidatePath } from "next/cache"

export async function startHeat(heatId: string) {
    try {
        console.log('Starting heat:', heatId)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/heat-matches/${heatId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'IN_PROGRESS' }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Failed to start heat:', errorData)
            throw new Error(errorData.error || 'Failed to start heat')
        }

        revalidatePath('/events/[eventId]')
    } catch (error) {
        console.error('Error in startHeat:', error)
        throw error
    }
}

export async function completeHeat(heatId: string, times: { [key: string]: number }) {
    try {
        console.log('Completing heat:', { heatId, times })
        // Convert team name keys to team number keys
        const formattedTimes = {
            team1_time: times['team1_name'] || null,
            team2_time: times['team2_name'] || null,
            team3_time: times['team3_name'] || null,
            team4_time: times['team4_name'] || null,
        }
        console.log('Formatted times:', formattedTimes)

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/heat-matches/${heatId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'COMPLETED',
                times: formattedTimes
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Failed to complete heat:', errorData)
            throw new Error(errorData.error || 'Failed to complete heat')
        }

        revalidatePath('/events/[eventId]')
    } catch (error) {
        console.error('Error in completeHeat:', error)
        throw error
    }
}

export async function completeHeatEvent(eventId: string) {
    try {
        console.log('Completing heat event:', eventId)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/${eventId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Failed to complete heat event:', errorData)
            throw new Error(errorData.error || 'Failed to complete heat event')
        }

        revalidatePath('/events/[eventId]')
    } catch (error) {
        console.error('Error in completeHeatEvent:', error)
        throw error
    }
}

export async function resetHeatEvent(eventId: string) {
    try {
        console.log('Resetting heat event:', eventId)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/${eventId}/reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Failed to reset heat event:', errorData)
            throw new Error(errorData.error || 'Failed to reset heat event')
        }

        revalidatePath('/events/[eventId]')
    } catch (error) {
        console.error('Error in resetHeatEvent:', error)
        throw error
    }
} 