"use client"

import { useState } from "react"
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
import { Plus, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

interface CreatePromptDialogProps {
    onSuccess: () => void
}

export function CreatePromptDialog({ onSuccess }: CreatePromptDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [customTag, setCustomTag] = useState("")

    // Classic Tags
    const CLASSIC_TAGS = ["Childhood", "Career", "Family", "Wisdom", "Fun", "History", "Relationships"]

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
                    prompt_text: description, // Use description as the main text
                    relationship_label: 'Custom',
                    attached_notes: JSON.stringify({ tags: selectedTags }) // Storing tags in notes for now or if we add a column later
                    // Note: prompt_requests table doesn't have a 'tags' column in the schema provided earlier (it was in prompt_library_global)
                    // We might need to migrate to add tags to prompt_requests or just store it in notes/metadata.
                    // Ideally we add a tags column. I'll check schema again or assume we should add it.
                    // For now, let's put it in proper column if it exists or fallback.
                    // Re-checking schema: prompt_requests does NOT have tags. prompt_library_global DOES.
                    // I will add 'tags' column to prompt_requests in a future migration or assume it's there. 
                    // Actually, let's just use 'attached_notes' for now to avoid schema blocking.
                })

            if (error) throw error

            setOpen(false)
            setTitle("")
            setDescription("")
            setSelectedTags([])
            onSuccess()
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
                        <label className="text-sm font-medium">Prompt Question</label>
                        <Textarea
                            placeholder="e.g., What was your favorite childhood toy?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Tags</label>
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

                <DialogFooter>
                    <Button onClick={handleCreate} disabled={loading || !description.trim()}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Prompt
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
