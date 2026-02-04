import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, FileText, Image as ImageIcon, Video, ExternalLink } from "lucide-react"
import Link from "next/link"

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

        // Construct public URL if not external
        // If storage_path exists, use Supabase bucket URL
        const assetUrl = mainAsset.external_url ||
            (mainAsset.storage_path
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/stories/${mainAsset.storage_path}`
                : null)

        if (mainAsset.asset_type === 'text') {
            return (
                <div className="p-4 bg-muted/30 rounded-md italic text-muted-foreground line-clamp-3">
                    "{mainAsset.text_content}"
                </div>
            )
        }

        if (mainAsset.asset_type === 'audio' && assetUrl) {
            return (
                <div className="flex flex-col gap-2 p-3 bg-secondary/20 rounded-md">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Play className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <audio controls src={assetUrl} className="w-full h-8" />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground ml-14">
                        {mainAsset.duration_seconds ? `${Math.floor(mainAsset.duration_seconds / 60)}:${(mainAsset.duration_seconds % 60).toString().padStart(2, '0')}` : "Audio Recording"}
                    </p>
                </div>
            )
        }

        if (mainAsset.asset_type === 'video' && assetUrl) {
            return (
                <div className="relative aspect-video bg-black rounded-md overflow-hidden">
                    <video
                        controls
                        src={assetUrl}
                        className="w-full h-full object-contain"
                        preload="metadata"
                    />
                </div>
            )
        }

        // Fallback for missing URL
        if ((mainAsset.asset_type === 'video' || mainAsset.asset_type === 'audio') && !assetUrl) {
            return (
                <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-md">
                    Media file not found.
                </div>
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
        </Card>
    )
}
