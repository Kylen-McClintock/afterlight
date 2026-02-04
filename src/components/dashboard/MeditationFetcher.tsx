"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { MeditationCard } from "@/components/meditations/MeditationCard"
import { Loader2 } from "lucide-react"

export function MeditationFetcher() {
    const [meditations, setMeditations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetch = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('library_meditations')
                .select('*')
                .limit(4)
                .order('created_at', { ascending: false })

            if (data) setMeditations(data)
            setLoading(false)
        }
        fetch()
    }, [])

    if (loading) {
        return (
            <div className="col-span-2 flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (meditations.length === 0) {
        return (
            <div className="col-span-2 text-center text-muted-foreground p-4 bg-muted/20 rounded-lg">
                <p>No meditations found. (Have you run the seed script?)</p>
            </div>
        )
    }

    return (
        <>
            {meditations.map(item => (
                <MeditationCard key={item.id} meditation={item} />
            ))}
        </>
    )
}
