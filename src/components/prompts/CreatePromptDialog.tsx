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
    const [title, setTitle] = useState("") // Map to 'prompt_text' or separate logic? 
    // Note: prompt_requests usually has 'prompt_text'. We'll use 'title' as the main text for now or split them.
    // The global table has 'title' and 'prompt_text'. 
    // 'prompt_requests' has 'prompt_text'. We can prepend title or just use text.
    // Let's use text as the prompt content.
    const [description, setDescription] = useState("")

    const handleCreate = async () => {
        if (!title) return
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
                    prompt_text: description || title, // Use description if available, else title
                    relationship_label: 'Custom',
                    // If we want a title distinct from text, we might need a column or simple convention
                    // For now, let's just make the prompt text user entered.
                })

            if (error) throw error

            setOpen(false)
            setTitle("")
            setDescription("")
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
            <DialogContent className="sm:max-w-[425px]">
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
