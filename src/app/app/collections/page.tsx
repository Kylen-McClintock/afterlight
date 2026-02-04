"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/utils/supabase/client"
import { Folder, Heart, Loader2, Tag } from "lucide-react"
import { Link as UnusedLink } from "lucide-react" // Avoiding collision if any
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export default function CollectionsPage() {
    const [loading, setLoading] = useState(true)
    const [allStories, setAllStories] = useState<any[]>([])
    const [tagFolders, setTagFolders] = useState<Record<string, number>>({})
    const [customCollections, setCustomCollections] = useState<any[]>([])

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Fetch Stories (to extract tags)
            const { data: stories } = await supabase
                .from('story_sessions')
                .select('id, title, categories, created_at')
                .eq('storyteller_user_id', user.id)
                .order('created_at', { ascending: false })

            if (stories) {
                setAllStories(stories)

                // Group by Tags
                const tags: Record<string, number> = {}
                stories.forEach(story => {
                    if (story.categories && Array.isArray(story.categories)) {
                        story.categories.forEach((tag: string) => {
                            tags[tag] = (tags[tag] || 0) + 1
                        })
                    }
                })
                setTagFolders(tags)
            }

            // 2. Fetch Custom Collections
            const { data: collections } = await supabase
                .from('prompt_collections')
                .select('*')
                .eq('user_id', user.id)

            if (collections) setCustomCollections(collections)

            setLoading(false)
        }
        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-heading font-bold">Collections</h1>
                <p className="text-muted-foreground">Organize your stories and memories.</p>
            </div>

            {/* Folders Grid */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Folder className="h-5 w-5 text-primary" />
                    Your Folders
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Auto-generated Tag Folders */}
                    {Object.entries(tagFolders).map(([tag, count]) => (
                        <Link href={`/app/timeline?search=${tag}`} key={tag}>
                            <Card className="hover:bg-accent/50 transition-colors cursor-pointer group h-full">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <Folder className="h-5 w-5 text-yellow-500/80 group-hover:text-yellow-500 transition-colors" />
                                    <Badge variant="secondary" className="text-xs">{count}</Badge>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-lg font-bold group-hover:text-primary transition-colors">{tag}</div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Auto-Collection</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}

                    {/* Custom Collections */}
                    {customCollections.map((col) => (
                        <Link href={`/app/prompts?collection=${col.id}`} key={col.id}>
                            <Card className="hover:bg-accent/50 transition-colors cursor-pointer group h-full border-primary/20">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <Heart className="h-5 w-5 text-rose-500/80 group-hover:text-rose-500 transition-colors" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-lg font-bold group-hover:text-primary transition-colors">{col.name}</div>
                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{col.description || "Custom Collection"}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}

                    {/* Create New Placeholder */}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Card className="border-dashed border-2 bg-muted/5 flex flex-col items-center justify-center p-6 text-center hover:bg-muted/10 transition-colors cursor-pointer">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                    <Folder className="h-5 w-5 text-primary" />
                                </div>
                                <h3 className="font-semibold">New Collection</h3>
                                <p className="text-xs text-muted-foreground">Group stories manually</p>
                            </Card>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Collection</DialogTitle>
                            </DialogHeader>
                            <CreateCollectionForm onSuccess={() => window.location.reload()} />
                        </DialogContent>
                    </Dialog>
                </div>
            </section>

            {/* All Stories List (Mini) */}
            <section className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">All Stories</h2>
                    <Link href="/app/timeline">
                        <Button variant="ghost" size="sm">View Timeline</Button>
                    </Link>
                </div>

                <div className="space-y-2">
                    {allStories.slice(0, 5).map(story => (
                        <Link href={`/app/story/${story.id}`} key={story.id}>
                            <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-primary/5 transition-colors">
                                <span className="font-medium">{story.title || "Untitled"}</span>
                                <div className="flex gap-2">
                                    {story.categories?.slice(0, 2).map((cat: string) => (
                                        <Badge key={cat} variant="secondary" className="text-[10px]">{cat}</Badge>
                                    ))}
                                </div>
                            </div>
                        </Link>
                    ))}
                    {allStories.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">No stories yet.</div>
                    )}
                </div>
            </section>
        </div>
    )
}

function CreateCollectionForm({ onSuccess }: { onSuccess: () => void }) {
    const [name, setName] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!name) return
        setLoading(true)
        const supabase = createClient()
        const { error } = await supabase.from('prompt_collections').insert({
            name: name,
            type: 'user_defined'
        })
        if (error) {
            console.error("Collection Create Error:", error)
            alert(`Error creating collection: ${error.message}`)
        }
        else onSuccess()
        setLoading(false)
    }

    return (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Collection Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Vacation 2024" />
            </div>
            <Button onClick={handleSubmit} disabled={loading || !name} className="w-full">
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Create Collection"}
            </Button>
        </div>
    )
}
