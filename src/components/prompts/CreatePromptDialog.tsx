"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

interface CreatePromptDialogProps {
    onSuccess?: () => void
}

export function CreatePromptDialog({ onSuccess }: CreatePromptDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [customTag, setCustomTag] = useState("")

    // Collection State
    const [selectedCollectionId, setSelectedCollectionId] = useState<string>("none")
    const [collections, setCollections] = useState<any[]>([])

    // Classic Tags
    const CLASSIC_TAGS = ["Childhood", "Career", "Family", "Wisdom", "Fun", "History", "Relationships"]

    // Fetch Collections
    useEffect(() => {
        const fetchCollections = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get first circle for now
            const { data: circleData } = await supabase.from('circle_memberships').select('circle_id').eq('user_id', user.id).limit(1).single()
            if (circleData) {
                const { data } = await supabase.from('custom_collections')
                    .select('id, title')
                    .eq('circle_id', circleData.circle_id)
                    .eq('collection_type', 'prompt_playlist')
                    .order('title')
                if (data) setCollections(data)
            }
        }
        if (open) fetchCollections()
    }, [open])

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag))
        } else {
            setSelectedTags([...selectedTags, tag])
        }
    }

    const addCustomTag = () => {
        if (customTag && !selectedTags.includes(customTag)) {
            setSelectedTags([...selectedTags, customTag])
            setCustomTag("")
        }
    }

    const handleCreate = async () => {
        if (!description && !title) return
        setLoading(true)
        const supabase = createClient()

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("No user")

            // Get circle
            const { data: circleData } = await supabase
                .from('circle_memberships')
                .select('circle_id')
                .eq('user_id', user.id)
                .limit(1)
                .single()

            if (!circleData) throw new Error("No circle")

            const { error } = await supabase
                .from('prompt_requests')
                .insert({
                    circle_id: circleData.circle_id,
                    created_by_user_id: user.id,
                    prompt_text: description || title, // Use description as the main text
                    relationship_label: 'Custom',
                    attached_notes: JSON.stringify({ tags: selectedTags })
                })

            if (error) throw error

            // Add to Collection if selected
            if (selectedCollectionId && selectedCollectionId !== "none") {
                await supabase.from('custom_collection_items').insert({
                    collection_id: selectedCollectionId,
                    title: description || title,
                    circle_id: circleData.circle_id
                })
            }

            setOpen(false)
            setTitle("")
            setDescription("")
            setSelectedTags([])
            setSelectedCollectionId("none")
            if (onSuccess) onSuccess()
        } catch (e) {
            console.error(e)
            alert("Failed to create prompt")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Prompt
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Custom Prompt</DialogTitle>
                    <DialogDescription>
                        Write a prompt for yourself or someone else to answer.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Prompt Question</Label>
                        <Textarea
                            placeholder="e.g., What was your favorite childhood toy?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Add to Collection (Optional)</Label>
                        <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a collection..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {collections.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Tags</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {CLASSIC_TAGS.map(tag => (
                                <Button
                                    key={tag}
                                    size="sm"
                                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                                    onClick={() => toggleTag(tag)}
                                    className="h-7 text-xs"
                                >
                                    {tag}
                                </Button>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <Input
                                placeholder="Add custom tag..."
                                value={customTag}
                                onChange={(e) => setCustomTag(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
                            />
                            <Button size="sm" variant="secondary" onClick={addCustomTag}>Add</Button>
                        </div>

                        {selectedTags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2 p-2 bg-muted/20 rounded-md">
                                {selectedTags.map(tag => (
                                    <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                                        {tag}
                                        <span className="cursor-pointer hover:font-bold" onClick={() => toggleTag(tag)}>×</span>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleCreate} disabled={loading || (!description.trim() && !title.trim())}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Prompt
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
