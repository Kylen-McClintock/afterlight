"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Plus, ListMusic, MoreVertical, Trash2 } from "lucide-react"

interface Collection {
    id: string
    title: string
    created_at: string
}

interface CollectionManagerProps {
    onSelectCollection: (collectionId: string) => void
}

export function CollectionManager({ onSelectCollection }: CollectionManagerProps) {
    const [collections, setCollections] = useState<Collection[]>([])
    const [loading, setLoading] = useState(true)
    const [newTitle, setNewTitle] = useState("")
    const [isCreating, setIsCreating] = useState(false)

    useEffect(() => {
        fetchCollections()
    }, [])

    const fetchCollections = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            // Need circle ID first
            const { data: circleData } = await supabase
                .from('circle_memberships')
                .select('circle_id')
                .eq('user_id', user.id)
                .limit(1)
                .single()

            if (circleData) {
                const { data, error } = await supabase
                    .from('custom_collections')
                    .select('*')
                    .eq('circle_id', circleData.circle_id)
                    .eq('collection_type', 'prompt_playlist')
                    .order('created_at', { ascending: false })

                if (data) setCollections(data)
            }
        }
        setLoading(false)
    }

    const createCollection = async () => {
        if (!newTitle.trim()) return
        setIsCreating(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const { data: circleData } = await supabase
                .from('circle_memberships')
                .select('circle_id')
                .eq('user_id', user.id)
                .limit(1)
                .single()

            if (circleData) {
                const { data, error } = await supabase
                    .from('custom_collections')
                    .insert({
                        circle_id: circleData.circle_id,
                        title: newTitle,
                        collection_type: 'prompt_playlist',
                        tags: []
                    })
                    .select()
                    .single()

                if (data) {
                    setCollections([data, ...collections])
                    setNewTitle("")
                }
            }
        }
        setIsCreating(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-2">
                <Input
                    placeholder="New Collection Name..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="max-w-xs"
                />
                <Button onClick={createCollection} disabled={isCreating || !newTitle.trim()}>
                    <Plus className="h-4 w-4 mr-2" /> Create Collection
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {collections.map(collection => (
                    <Card key={collection.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onSelectCollection(collection.id)}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {collection.title}
                            </CardTitle>
                            <ListMusic className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {/* We could count items here if we fetched them */}
                                {/* For now just visual placeholder */}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                View Prompts →
                            </p>
                        </CardContent>
                    </Card>
                ))}

                {collections.length === 0 && !loading && (
                    <div className="col-span-full text-center p-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                        No collections yet. Create one to organize your prompts.
                    </div>
                )}
            </div>
        </div>
    )
}
