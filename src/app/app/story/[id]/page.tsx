import { createClient } from "@/utils/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Calendar, User, Share2, MoreVertical, FileText } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { EditStoryDialog } from "@/components/story/EditStoryDialog"

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
                {story.story_assets?.map((asset: any) => (
                    <div key={asset.id} className="space-y-4">
                        {asset.asset_type === 'video' && (
                            <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                                {/* Use Storage URL if available, or external */}
                                {asset.storage_path ? (
                                    <video
                                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/stories/${asset.storage_path}`}
                                        controls
                                        className="w-full h-full"
                                    />
                                ) : asset.external_url ? (
                                    // Embed logic would go here. For now, simple video tag or iframe handling
                                    <iframe src={asset.external_url} className="w-full h-full" allowFullScreen />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-white">
                                        Video source missing
                                    </div>
                                )}
                            </div>
                        )}

                        {asset.asset_type === 'audio' && (
                            <Card>
                                <CardContent className="p-6 flex flex-col gap-4">
                                    <h3 className="font-semibold">Audio Recording</h3>
                                    <audio
                                        controls
                                        className="w-full"
                                        src={asset.storage_path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/stories/${asset.storage_path}` : asset.external_url}
                                    />

                                    {/* Transcription Section */}
                                    <div className="mt-4 pt-4 border-t">
                                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                            <FileText className="h-4 w-4" /> Transcript
                                        </h4>
                                        {asset.text_content ? (
                                            <div className="p-4 bg-muted/30 rounded-md text-sm leading-relaxed whitespace-pre-wrap">
                                                {asset.text_content}
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-muted/10 rounded-md text-sm text-muted-foreground italic flex justify-between items-center">
                                                <span>No transcript available yet.</span>
                                                <Button variant="outline" size="sm" disabled>Request Transcription (Coming Soon)</Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {asset.asset_type === 'text' && (
                            <div className="prose dark:prose-invert max-w-none p-6 bg-card rounded-lg border shadow-sm font-serif text-lg leading-relaxed">
                                {asset.text_content}
                            </div>
                        )}

                        {asset.asset_type === 'photo' && (
                            <div className="rounded-lg overflow-hidden shadow-md">
                                <img
                                    src={asset.storage_path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/stories/${asset.storage_path}` : asset.external_url}
                                    alt="Story attachment"
                                    className="w-full h-auto"
                                />
                            </div>
                        )}
                    </div>
                ))}

                {(!story.story_assets || story.story_assets.length === 0) && (
                    <div className="p-12 text-center text-muted-foreground bg-muted/20 rounded-lg">
                        No content available for this story.
                    </div>
                )}
            </main>
        </div>
    )
}
