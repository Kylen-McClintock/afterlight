"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Loader2, Image as ImageIcon } from "lucide-react"

interface StoryImageProps {
    storagePath: string
    alt?: string
    className?: string
}

export function StoryImage({ storagePath, alt = "Story memory", className }: StoryImageProps) {
    const [url, setUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        const fetchUrl = async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .storage
                .from('stories')
                .createSignedUrl(storagePath, 3600) // 1 hour expiry

            if (error || !data) {
                console.error("Error signing image URL:", error)
                setError(true)
            } else {
                setUrl(data.signedUrl)
            }
            setLoading(false)
        }

        if (storagePath) fetchUrl()
    }, [storagePath])

    if (loading) return (
        <div className={`flex items-center justify-center bg-muted/20 animate-pulse ${className || "w-full h-full"}`}>
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
    )

    if (error || !url) return (
        <div className={`flex items-center justify-center bg-muted/10 text-muted-foreground ${className || "w-full h-full"}`}>
            <ImageIcon className="h-6 w-6 opacity-20" />
        </div>
    )

    return (
        <img
            src={url}
            alt={alt}
            className={className}
        />
    )
}
