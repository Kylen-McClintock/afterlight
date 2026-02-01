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
}

interface StorySession {
    id: string
    title: string | null
    prompt_request_id?: string | null
    created_at: string
    relationship_label?: string | null
    story_assets: StoryAsset[]
    storyteller?: { display_name: string } | null
}

interface StoryCardProps {
    story: StorySession
}

export function StoryCard({ story }: StoryCardProps) {
    const mainAsset = story.story_assets?.[0]
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

        if (mainAsset.asset_type === 'audio') {
            return (
                <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-md">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Play className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <div className="h-1 bg-secondary rounded-full w-full">
                            <div className="h-1 bg-primary rounded-full w-1/3"></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {mainAsset.duration_seconds ? `${Math.floor(mainAsset.duration_seconds / 60)}:${(mainAsset.duration_seconds % 60).toString().padStart(2, '0')}` : "Audio Recording"}
                        </p>
                    </div>
                </div>
            )
        }

        if (mainAsset.asset_type === 'video') {
            return (
                <div className="relative aspect-video bg-black/5 rounded-md flex items-center justify-center">
                    <Video className="h-12 w-12 text-muted-foreground/50" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-white/90 shadow-sm flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                            <Play className="h-5 w-5 text-black ml-1" />
                        </div>
                    </div>
                </div>
            )
        }

        return null
    }

    return (
        <Card className="hover:shadow-md transition-shadow">
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
