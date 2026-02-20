"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Wand2, Loader2, AlertCircle, UserCircle2 } from "lucide-react"
import { MediaPlayer } from "@/components/timeline/MediaPlayer"
import { StoryImage } from "@/components/timeline/StoryImage"
import { createClient } from "@/utils/supabase/client"

interface StoryAssetViewerProps {
    asset: any
    storyId: string
    relatedTranscript?: string // Text from a separate asset if linked
}

export function StoryAssetViewer({ asset, storyId, relatedTranscript }: StoryAssetViewerProps) {
    const [transcript, setTranscript] = useState<string>(asset.text_content || relatedTranscript || "")
    const [isTranscribing, setIsTranscribing] = useState(false)
    const [error, setError] = useState("")

    const [authorName, setAuthorName] = useState<string | null>(
        asset.profile?.display_name || asset.profiles?.display_name || null
    )

    useEffect(() => {
        if (!authorName && asset.created_by_user_id) {
            const fetchAuthor = async () => {
                const supabase = createClient()
                const { data } = await supabase.from('profiles').select('display_name').eq('id', asset.created_by_user_id).single()
                if (data?.display_name) {
                    setAuthorName(data.display_name)
                }
            }
            fetchAuthor()
        }
    }, [asset.created_by_user_id, authorName])

    const handleTranscribe = async () => {
        if (!asset.storage_path) return
        setIsTranscribing(true)
        setError("")

        try {
            const supabase = createClient()
            const { data: signedData } = await supabase.storage.from('stories').createSignedUrl(asset.storage_path, 3600)
            if (!signedData?.signedUrl) throw new Error("Could not sign URL for transcription")

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioUrl: signedData.signedUrl })
            })

            const data = await response.json()
            if (!response.ok || data.error) throw new Error(data.error || "Transcription failed")

            if (data.text) {
                await supabase.from('story_assets').insert({
                    story_session_id: storyId,
                    asset_type: 'text',
                    source_type: 'transcription',
                    text_content: data.text
                })
                setTranscript(data.text)
            }
        } catch (err: any) {
            console.error("Transcription error:", err)
            setError(err.message)
        } finally {
            setIsTranscribing(false)
        }
    }

    if (asset.asset_type === 'audio') {
        return (
            <Card>
                <CardContent className="p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                        <h3 className="font-semibold">Audio Recording</h3>
                        {authorName && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md border">
                                <UserCircle2 className="h-3.5 w-3.5" />
                                <span>{authorName}</span>
                            </div>
                        )}
                    </div>
                    <div className="rounded-md border bg-muted/20">
                        <MediaPlayer storagePath={asset.storage_path} type="audio" duration={asset.duration_seconds} />
                    </div>
                    <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-muted-foreground">
                            <FileText className="h-4 w-4" /> Transcript
                        </h4>
                        {transcript ? (
                            <div className="p-4 bg-muted/30 rounded-md text-sm leading-relaxed whitespace-pre-wrap font-serif dark:bg-muted/10">
                                {transcript}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 items-start bg-muted/10 p-4 rounded-md">
                                <p className="text-sm text-muted-foreground italic">No transcript found.</p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleTranscribe}
                                    disabled={isTranscribing}
                                    className="gap-2"
                                >
                                    {isTranscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                                    {isTranscribing ? "Generating..." : "Generate Transcript"}
                                </Button>
                                {error && <div className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {error}</div>}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (asset.asset_type === 'video') {
        return (
            <div className="block space-y-4">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg border">
                    <MediaPlayer storagePath={asset.storage_path} type="video" />
                    {authorName && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 text-xs text-white bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md border border-white/20 z-10">
                            <UserCircle2 className="h-3.5 w-3.5" />
                            <span>{authorName}</span>
                        </div>
                    )}
                </div>
                {transcript && (
                    <Card><CardContent className="p-4 bg-muted/30"><p className="text-sm">{transcript}</p></CardContent></Card>
                )}
            </div>
        )
    }

    if (asset.asset_type === 'photo') {
        return (
            <div className="relative rounded-lg overflow-hidden shadow-md group">
                <StoryImage storagePath={asset.storage_path} alt="Story Photo" />
                {authorName && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 text-xs text-white bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <UserCircle2 className="h-3.5 w-3.5" />
                        <span>{authorName}</span>
                    </div>
                )}
            </div>
        )
    }

    return null
}
