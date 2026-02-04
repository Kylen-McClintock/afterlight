"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Play, Loader2 } from "lucide-react"

interface MediaPlayerProps {
    storagePath: string
    type: 'audio' | 'video'
    duration?: number | null
}

export function MediaPlayer({ storagePath, type, duration }: MediaPlayerProps) {
    const [url, setUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        const fetchUrl = async () => {
            // If we already have a public URL passed, we'd use it, 
            // but here we assume storagePath needs signing if private.
            // However, for MVP let's try creating a signed URL.

            const supabase = createClient()
            const { data, error } = await supabase
                .storage
                .from('stories')
                .createSignedUrl(storagePath, 3600) // 1 hour expiry

            if (error || !data) {
                console.error("Error signing URL:", error)
                setError(true)
            } else {
                setUrl(data.signedUrl)
            }
            setLoading(false)
        }

        if (storagePath) fetchUrl()
    }, [storagePath])

    if (loading) return (
        <div className={`flex items-center justify-center bg-muted/20 rounded-md ${type === 'video' ? 'aspect-video' : 'p-3'}`}>
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
    )

    if (error || !url) return (
        <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-md">
            Failed to load media.
        </div>
    )

    if (type === 'audio') {
        return (
            <div className="flex flex-col gap-2 p-3 bg-secondary/20 rounded-md">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Play className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <audio controls src={url} className="w-full h-8" />
                    </div>
                </div>
                <p className="text-xs text-muted-foreground ml-14">
                    {duration ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` : "Audio Recording"}
                </p>
            </div>
        )
    }

    // Video
    return (
        <div className="relative aspect-video bg-black rounded-md overflow-hidden">
            <video
                controls
                src={url}
                className="w-full h-full object-contain"
                preload="metadata"
            />
        </div>
    )
}
