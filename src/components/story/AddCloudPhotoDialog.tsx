"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImagePlus, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

interface AddCloudPhotoDialogProps {
    storyId: string
    onSuccess?: () => void
}

export function AddCloudPhotoDialog({ storyId, onSuccess }: AddCloudPhotoDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [url, setUrl] = useState("")

    const handleSave = async () => {
        if (!url) return
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const { error } = await supabase.from('story_assets').insert({
                story_session_id: storyId,
                asset_type: 'photo',
                source_type: 'external_link',
                external_url: url,
                created_by_user_id: user.id
            })

            if (!error) {
                setOpen(false)
                setUrl("")
                if (onSuccess) onSuccess()
            } else {
                alert("Error saving link: " + error.message)
            }
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full border-dashed gap-2">
                    <ImagePlus className="h-4 w-4" /> Add Cloud Photos (Google Photos, Box, etc.)
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Cloud Photos</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Link URL</Label>
                        <Input
                            placeholder="https://photos.google.com/..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Paste a link to an album or photo to share it with everyone in this story.
                        </p>
                    </div>
                    <Button onClick={handleSave} disabled={loading || !url} className="w-full">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Link
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
