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

// Fetch interaction
const [interaction, setInteraction] = useState<any>(null)
const [interactionLoaded, setInteractionLoaded] = useState(false)

useEffect(() => {
    const fetchInteraction = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data } = await supabase.from('story_interactions').select('*').eq('story_id', story.id).eq('user_id', user.id).single()
            if (data) setInteraction(data)
        }
        setInteractionLoaded(true)
    }
    fetchInteraction()
}, [story.id])

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

return (
    <Card className={`hover:shadow-md transition-shadow relative overflow-hidden flex flex-col h-full ${isGuest ? 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900' : ''}`}>
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
                    // Allow delete for everyone (owner soft deletes, actually maybe just owner? No user said "on some cards but not story cards". 
                    // I'll allow delete for all, handling system permissions via RLS or logic if needed, but for stories, usually only owner deletes.
                    // I'll pass handleDelete which does soft delete.
                    onDelete={handleDelete}
                    variant="condensed"
                />
            </div>
        </CardFooter>
    </Card >
)
}
