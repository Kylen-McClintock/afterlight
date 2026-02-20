"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, FileText, Image as ImageIcon, Video, ExternalLink, MapPin, Edit, Calendar, Share2 } from "lucide-react"
import Link from "next/link"
import { MediaPlayer } from "./MediaPlayer"
import { StoryImage } from "./StoryImage"
import { EditStoryDialog } from "@/components/story/EditStoryDialog"
import { ShareDialog } from "@/components/story/ShareDialog"
import { useRouter } from "next/navigation"
import { CardInteractionBar } from "@/components/shared/CardInteractionBar"

interface StoryAsset {
    id: string
    asset_type: 'audio' | 'video' | 'text' | 'photo' | 'external_media'
    source_type: string
    external_url?: string | null
    text_content?: string | null
    duration_seconds?: number | null
    storage_path?: string | null
}

interface StorySession {
    id: string
    title: string | null
    prompt_request_id?: string | null
    created_at: string
    story_date?: string | null
    date_granularity?: string | null
    relationship_label?: string | null
    location?: string | null
    categories?: string[] | null
    story_assets: StoryAsset[]
    storyteller?: { display_name: string } | null
    storyteller_user_id?: string | null
    prompt_request?: { prompt_text: string } | null
    recipients?: any[]
    circle_id?: string
}

interface StoryCardProps {
    story: StorySession
    currentUserId?: string
}

export function StoryCard({ story, currentUserId }: StoryCardProps) {
    const router = useRouter()
    const mainMediaAsset = story.story_assets?.find(a => ['audio', 'video', 'photo'].includes(a.asset_type))
    const transcriptAssetNode = story.story_assets?.find(a => a.asset_type === 'text' && (a.source_type === 'transcription' || a.text_content))
    const mainAsset = mainMediaAsset || transcriptAssetNode || story.story_assets?.[0]
    const isGuest = currentUserId && story.storyteller_user_id && story.storyteller_user_id !== currentUserId
    const isOwner = currentUserId && story.storyteller_user_id === currentUserId

    // Determine display date
    let displayDate = ""
    if (story.story_date) {
        if (story.date_granularity === 'year') {
            displayDate = story.story_date.substring(0, 4) // "YYYY"
        } else {
            const dateObj = new Date(story.story_date)
            if (!isNaN(dateObj.getTime())) {
                displayDate = dateObj.toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
            }
        }
    }

    // Interaction Logic
    const [interaction, setInteraction] = useState<any>(null)

    useEffect(() => {
        const fetchInteraction = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase.from('story_interactions').select('*').eq('story_id', story.id).eq('user_id', user.id).single()
                if (data) setInteraction(data)
            }
        }
        fetchInteraction()
    }, [story.id])

    // Fetch Thumbnail URL for Interaction Bar
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
    useEffect(() => {
        if (mainAsset?.asset_type === 'photo' && mainAsset.storage_path) {
            const fetchUrl = async () => {
                const supabase = createClient()
                const { data } = await supabase.storage.from('stories').createSignedUrl(mainAsset.storage_path!, 3600)
                if (data) setThumbnailUrl(data.signedUrl)
            }
            fetchUrl()
        }
    }, [mainAsset])

    // Debugging: Inspect assets to ensure we receiving the transcript
    // console.log("Story Assets:", story.title, story.story_assets)

    const handleDelete = async () => {
        const supabase = createClient()
        // Soft Delete
        const { error } = await supabase
            .from('story_sessions')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', story.id)

        if (error) {
            alert("Failed to delete story: " + error.message)
        } else {
            router.refresh()
        }
    }

    const refreshInteraction = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data } = await supabase.from('story_interactions').select('*').eq('story_id', story.id).eq('user_id', user.id).single()
            setInteraction(data)
        }
    }

    // Helper to render preview
    const renderPreview = () => {
        // Find associated transcript if any
        const transcriptAsset = story.story_assets?.find(a => a.asset_type === 'text' && (a.source_type === 'transcription' || (!a.source_type && a.text_content)))
        const mediaAsset = story.story_assets?.find(a => ['audio', 'video', 'photo'].includes(a.asset_type))

        // No media, just text or transcript
        if (!mediaAsset) {
            if (transcriptAsset) {
                return (
                    <div className="px-4 py-3 bg-muted/20 border-l-2 border-primary/20 rounded-r-md min-h-[6rem]">
                        <p className="text-xs text-muted-foreground font-medium uppercase mb-1">Transcript</p>
                        <div className="text-sm text-foreground/80 line-clamp-4 italic font-serif">
                            "{transcriptAsset.text_content}"
                        </div>
                    </div>
                )
            } else if (mainAsset?.asset_type === 'text') {
                return (
                    <div className="p-4 bg-muted/30 rounded-md italic text-muted-foreground line-clamp-3 font-serif min-h-[6rem]">
                        "{mainAsset.text_content}"
                    </div>
                )
            }
            return null
        }

        // We have media
        if ((mediaAsset.asset_type === 'audio' || mediaAsset.asset_type === 'video') && mediaAsset.storage_path) {
            return (
                <div className="space-y-3">
                    <MediaPlayer storagePath={mediaAsset.storage_path} type={mediaAsset.asset_type} duration={mediaAsset.duration_seconds} />
                    {transcriptAsset && transcriptAsset.text_content && (
                        <div className="px-3 py-2 bg-muted/20 border-l-2 border-primary/20 rounded-r-md">
                            <p className="text-xs text-muted-foreground font-medium uppercase mb-1">Transcript</p>
                            <div className="text-sm text-foreground/80 line-clamp-3 italic">
                                "{transcriptAsset.text_content}"
                            </div>
                        </div>
                    )}
                </div>
            )
        } else if (mediaAsset.external_url && (mediaAsset.asset_type === 'audio' || mediaAsset.asset_type === 'video')) {
            return (
                <a href={mediaAsset.external_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline text-sm p-4 block">
                    View External Media
                </a>
            )
        } else if (mediaAsset.asset_type === 'photo' && mediaAsset.storage_path) {
            return (
                <div className="flex gap-4 items-start">
                    <div className="w-24 h-24 rounded-md overflow-hidden bg-muted flex-shrink-0 relative border border-border/50 shadow-sm">
                        <StoryImage
                            storagePath={mediaAsset.storage_path}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    {transcriptAsset && transcriptAsset.text_content ? (
                        <div className="flex-1 px-3 py-2 bg-muted/20 border-l-2 border-primary/20 rounded-r-md min-h-[6rem]">
                            <p className="text-xs text-muted-foreground font-medium uppercase mb-1">Transcript</p>
                            <div className="text-sm text-foreground/80 line-clamp-3 italic">
                                "{transcriptAsset.text_content}"
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 px-3 py-2 text-sm text-muted-foreground bg-muted/5 italic flex items-center min-h-[6rem]">
                            Image memory recorded.
                        </div>
                    )}
                </div>
            )
        }

        return null
    }

    return (
        <Card className={`hover:shadow-md transition-shadow relative overflow-hidden flex flex-col h-full ${isGuest ? 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900' : ''}`}>
            {/* Date Banner */}
            {displayDate && (
                <div className="absolute top-0 left-0 bg-primary/10 px-3 py-1 rounded-br-lg text-xs font-bold text-primary flex items-center gap-1 z-10 border-b border-r border-primary/20">
                    <Calendar className="h-3 w-3" />
                    {displayDate}
                </div>
            )}

            {isGuest && (
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-bl-md font-medium z-10">
                    Guest Story
                </div>
            )}

            <CardHeader className="pt-10 pb-2">
                <div className="flex justify-between items-start">
                    <div className="space-y-1 w-full">
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {story.relationship_label && (
                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5">{story.relationship_label}</Badge>
                                )}
                                {story.location && (
                                    <span className="flex items-center gap-0.5">
                                        <MapPin className="h-3 w-3" />
                                        {story.location}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="pt-1">
                            {story.categories && story.categories.map((cat: string) => (
                                <Badge key={cat} variant="secondary" className="text-[10px] h-5 px-1.5 mr-1 mb-1">{cat}</Badge>
                            ))}
                        </div>

                        <div className="flex justify-between items-start gap-2">
                            <CardTitle className="text-xl leading-tight mt-1 flex-1">
                                {story.title || "Untitled Story"}
                            </CardTitle>

                            <div className="flex gap-1 -mt-1 shrink-0">
                                <ShareDialog
                                    storyId={story.id}
                                    storyTitle={story.title}
                                    trigger={
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                            <Share2 className="h-4 w-4" />
                                        </Button>
                                    }
                                />
                                {/* Edit Button for Owner */}
                                {isOwner && (
                                    <EditStoryDialog
                                        story={story}
                                        onSuccess={() => router.refresh()}
                                        trigger={
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        }
                                    />
                                )}
                            </div>
                        </div>

                        {story.storyteller && (
                            <p className="text-sm font-medium text-muted-foreground">
                                Told by {story.storyteller.display_name}
                            </p>
                        )}

                        <span className="text-[10px] text-muted-foreground/60 block pt-1">
                            Added {new Date(story.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                {renderPreview()}
            </CardContent>

            {/* View Link */}
            <div className="px-4 py-2 border-t bg-muted/5">
                <Link href={`/app/story/${story.id}`} className="w-full">
                    <Button variant="ghost" size="sm" className="w-full justify-between group h-8 text-xs text-muted-foreground">
                        View Full Experience
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </Button>
                </Link>
            </div>

            <CardFooter className="p-3 border-t bg-background z-20">
                <div className="w-full">
                    <CardInteractionBar
                        itemId={story.id}
                        itemType="story"
                        interaction={interaction}
                        onUpdate={refreshInteraction}
                        onDelete={handleDelete}
                        variant="condensed"
                        imageThumbnail={thumbnailUrl}
                    />
                </div>
            </CardFooter>
        </Card >
    )
}
