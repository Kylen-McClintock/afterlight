"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, FileText, Image as ImageIcon, Video, ExternalLink, MapPin, Edit, Calendar } from "lucide-react"
import Link from "next/link"
import { MediaPlayer } from "./MediaPlayer"
import { StoryImage } from "./StoryImage"
import { EditStoryDialog } from "@/components/story/EditStoryDialog"
import { useRouter } from "next/navigation"

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
    const mainAsset = story.story_assets?.[0]
    const isGuest = currentUserId && story.storyteller_user_id && story.storyteller_user_id !== currentUserId
    const isOwner = currentUserId && story.storyteller_user_id === currentUserId

    // Determine display date
    let displayDate = ""
    // Fallback to created_at only if story_date is explicitly null/missing
    // Only set displayDate if story_date is explicitly set
    if (story.story_date) {
        if (story.date_granularity === 'year') {
            displayDate = story.story_date.substring(0, 4) // "YYYY"
        } else {
            // Exact date
            const dateObj = new Date(story.story_date)
            // Check for invalid date
            if (!isNaN(dateObj.getTime())) {
                displayDate = dateObj.toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
            }
        }
    }

    // Helper to render preview
    const renderPreview = () => {
        if (!mainAsset) return null

        if (mainAsset.asset_type === 'text') {
            return (
                <div className="p-4 bg-muted/30 rounded-md italic text-muted-foreground line-clamp-3">
                    "{mainAsset.text_content}"
                </div>
            )
        }

        if ((mainAsset.asset_type === 'audio' || mainAsset.asset_type === 'video') && mainAsset.storage_path) {
            // Use Client Component for playback to handle Signed URLs
            return <MediaPlayer storagePath={mainAsset.storage_path} type={mainAsset.asset_type} duration={mainAsset.duration_seconds} />
        }

        // Fallback or External URL
        if (mainAsset.external_url && (mainAsset.asset_type === 'audio' || mainAsset.asset_type === 'video')) {
            // Simplified handling for external URLs (not implemented fully for generic external yet)
            return (
                <a href={mainAsset.external_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline text-sm p-4 block">
                    View External Media
                </a>
            )
        }

        if (mainAsset.asset_type === 'photo' && mainAsset.storage_path) {
            return (
                <div className="rounded-md overflow-hidden aspect-video bg-muted relative">
                    <StoryImage
                        storagePath={mainAsset.storage_path}
                        className="w-full h-full object-cover"
                    />
                </div>
            )
        }

        return null
    }

    return (
        <Card className={`hover:shadow-md transition-shadow relative overflow-hidden ${isGuest ? 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900' : ''}`}>
            {/* Date Banner - More Prominent */}
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

            <CardHeader className="pt-10"> {/* Added top padding for the date banner */}
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
                            {/* Edit Button for Owner */}
                            {isOwner && (
                                <EditStoryDialog
                                    story={story}
                                    onSuccess={() => router.refresh()}
                                    trigger={
                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 text-muted-foreground hover:text-foreground">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    }
                                />
                            )}
                        </div>

                        {story.storyteller && (
                            <p className="text-sm font-medium text-muted-foreground">
                                Told by {story.storyteller.display_name}
                            </p>
                        )}

                        {/* Creation Date (Small) - Moved to bottom of header */}
                        <span className="text-[10px] text-muted-foreground/60 block pt-1">
                            Added {new Date(story.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {renderPreview()}
            </CardContent>
            <CardFooter>
                <Link href={`/app/story/${story.id}`} className="w-full">
                    <Button variant="ghost" className="w-full justify-between group">
                        View Full Story
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </Button>
                </Link>
            </CardFooter>
        </Card >
    )
}
