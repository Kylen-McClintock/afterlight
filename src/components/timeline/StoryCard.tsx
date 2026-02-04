import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, FileText, Image as ImageIcon, Video, ExternalLink } from "lucide-react"
import Link from "next/link"
import { MediaPlayer } from "./MediaPlayer"

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
    relationship_label?: string | null
    categories?: string[] | null
    story_assets: StoryAsset[]
    storyteller?: { display_name: string } | null
    storyteller_user_id?: string | null
}

interface StoryCardProps {
    story: StorySession
    currentUserId?: string
}

export function StoryCard({ story, currentUserId }: StoryCardProps) {
    const mainAsset = story.story_assets?.[0]
    const isGuest = currentUserId && story.storyteller_user_id && story.storyteller_user_id !== currentUserId

    const date = new Date(story.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

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

        return null
    }

    return (
        <Card className={`hover:shadow-md transition-shadow ${isGuest ? 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900' : ''}`}>
            {isGuest && (
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-bl-md rounded-tr-md font-medium">
                    Guest Story
                </div>
            )}
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{date}</span>
                            {story.relationship_label && (
                                <>
                                    <span>•</span>
                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5">{story.relationship_label}</Badge>
                                </>
                            )}
                            {story.categories && story.categories.map((cat: string) => (
                                <Badge key={cat} variant="secondary" className="text-[10px] h-5 px-1.5 ml-1">{cat}</Badge>
                            ))}
                        </div>
                        <CardTitle className="text-xl leading-tight">
                            {story.title || "Untitled Story"}
                        </CardTitle>
                        {story.storyteller && (
                            <p className="text-sm font-medium text-muted-foreground">
                                Told by {story.storyteller.display_name}
                            </p>
                        )}
                    </div>
                    {/* Menu or Edit button could go here */}
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
