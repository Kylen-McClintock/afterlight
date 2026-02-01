import { createClient } from "@/utils/supabase/server"
import { StoryCard } from "@/components/timeline/StoryCard"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function TimelinePage() {
    const supabase = await createClient()

    // Fetch stories with assets
    const { data: stories, error } = await supabase
        .from('story_sessions')
        .select(`
      *,
      story_assets (*),
      storyteller:storyteller_user_id (display_name)
    `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching timeline:", error)
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Timeline</h1>
                    <p className="text-muted-foreground">Your collected memories and moments.</p>
                </div>
                <Link href="/app/story/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Story
                    </Button>
                </Link>
            </div>

            <div className="space-y-6 relative">
                {/* Simple timeline line connector could be added here visually with absolute positioning */}

                {stories && stories.length > 0 ? (
                    stories.map((story: any) => (
                        <StoryCard key={story.id} story={story} />
                    ))
                ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
                        <h3 className="text-lg font-medium mb-2">No stories yet</h3>
                        <p className="text-muted-foreground mb-6">Start capturing your legacy today.</p>
                        <Link href="/app/story/create">
                            <Button>Record Your First Story</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
