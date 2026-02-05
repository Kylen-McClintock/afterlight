"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { CardInteractionBar } from "@/components/shared/CardInteractionBar"

export function InteractionWrapper({ storyId }: { storyId: string }) {
    const [interaction, setInteraction] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const fetchInteraction = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data } = await supabase.from('story_interactions').select('*').eq('story_id', storyId).eq('user_id', user.id).single()
            if (data) setInteraction(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchInteraction()
    }, [storyId])

    const handleDelete = async () => {
        const supabase = createClient()
        await supabase.from('story_sessions').update({ deleted_at: new Date().toISOString() }).eq('id', storyId)
        window.location.href = '/app/timeline' // Redirect after delete
    }

    if (loading) return <div className="p-4 text-center text-muted-foreground text-xs">Loading interactions...</div>

    return (
        <div className="bg-card border rounded-lg p-6 shadow-sm">
            <h3 className="font-heading font-semibold mb-4">Your Reflections</h3>
            <CardInteractionBar
                itemId={storyId}
                itemType="story"
                interaction={interaction}
                onUpdate={fetchInteraction}
                onDelete={handleDelete}
                variant="full"
            />
        </div>
    )
}
