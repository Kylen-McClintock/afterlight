import { createClient } from "@/utils/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Calendar, User, Share2, MoreVertical, FileText } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { EditStoryDialog } from "@/components/story/EditStoryDialog"
import { StoryAssetViewer } from "@/components/story/StoryAssetViewer"

export default async function StoryDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { id } = await params

    const { data: story, error } = await supabase
        .from('story_sessions')
        .select(`
      *,
      story_assets (*),
      storyteller:storyteller_user_id (display_name),
      recipients:story_recipients (recipient_email)
    `)
        .eq('id', id)
        .single()

    if (error || !story) {
        console.error("Error fetching story:", error)
        // notFound() // specific 404
        // For MVP dev, just show error
        return <div className="p-8">Story not found or error loading.</div>
    }

    const date = new Date(story.created_at).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <header className="space-y-4">
                <div className="flex items-center justify-between">
                    <Link href="/app/timeline">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Timeline
                        </Button>
                    </Link>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                        </Button>
                        <EditStoryDialog
                            story={story}
                            onSuccess={async () => {
                                'use server'
                                // We can't really call server action here easily without plumbing.
                                // simpler to refresh page.
                            }}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                        {story.relationship_label && (
                            <Badge variant="outline">{story.relationship_label}</Badge>
                        )}
                        {story.categories && story.categories.map((cat: string) => (
                            <Badge key={cat} variant="secondary">{cat}</Badge>
                        ))}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary">
                        {story.title || "Untitled Story"}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {story.story_date
                                ? (story.date_granularity === 'year'
                                    ? new Date(story.story_date).getFullYear()
                                    : new Date(story.story_date).toLocaleDateString())
                                : date}
                        </div>
                        {story.storyteller && (
                            <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {story.storyteller.display_name}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content (Assets) */}
            <main className="space-y-8">
                {story.story_assets?.map((asset: any) => {
                    // Skip separate transcript assets as they are linked to audio
                    if (asset.asset_type === 'text' && asset.source_type === 'transcription') return null

                    // Find related transcript if this is audio
                    let relatedTranscript = undefined
                    if (asset.asset_type === 'audio') {
                        relatedTranscript = story.story_assets.find((a: any) =>
                            a.asset_type === 'text' &&
                            a.source_type === 'transcription'
                        )?.text_content
                    }

                    if (asset.asset_type === 'text') {
                        return (
                            <div key={asset.id} className="prose dark:prose-invert max-w-none p-6 bg-card rounded-lg border shadow-sm font-serif text-lg leading-relaxed">
                                {asset.text_content}
                            </div>
                        )
                    }

                    return (
                        <div key={asset.id} className="space-y-4">
                            <StoryAssetViewer
                                asset={asset}
                                storyId={story.id}
                                relatedTranscript={relatedTranscript}
                            />
                        </div>
                    )
                })}

                {(!story.story_assets || story.story_assets.length === 0) && (
                    <div className="p-12 text-center text-muted-foreground bg-muted/20 rounded-lg">
                        No content available for this story.
                    </div>
                )}
            </main>
        </div>
    )
}
