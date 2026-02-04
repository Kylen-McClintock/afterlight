import { createClient } from "@/utils/supabase/server"
import { StoryCard } from "@/components/timeline/StoryCard"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function TimelinePage(props: { searchParams: Promise<{ search?: string, collection?: string }> }) {
    const supabase = await createClient()

    // Fetch stories with assets
    // Fetch stories filter by search (tag) or collection
    const searchParams = await props.searchParams
    const search = searchParams?.search
    const collectionId = searchParams?.collection

    let query = supabase
        .from('story_sessions')
        .select(`
          *,
          story_assets (*),
          storyteller:storyteller_user_id (display_name),
          recipients:story_recipients (recipient_email)
        `)
        .order('story_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

    if (search) {
        query = query.contains('categories', [search])
    }

    // Note: Filtering by collection requires a join or two-step fetch since it's a many-to-many relationship
    // For MVP performance, if collectionId is present, let's fetch item IDs first.
    let storyIds: string[] = []
    if (collectionId) {
        const { data: items } = await supabase
            .from('custom_collection_items')
            .select('story_id')
            .eq('collection_id', collectionId)

        if (items) {
            storyIds = items.map(i => i.story_id).filter(Boolean) as string[]
            if (storyIds.length > 0) {
                query = query.in('id', storyIds)
            } else {
                // Empty collection or no stories in it
                // We should force return empty.
                query = query.in('id', ['00000000-0000-0000-0000-000000000000'])
            }
        }
    }

    const { data: stories, error } = await query

    if (error) {
        console.error("Error fetching timeline:", error)
    }

    const { data: { user } } = await supabase.auth.getUser()

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
                        <StoryCard key={story.id} story={story} currentUserId={user?.id} />
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
