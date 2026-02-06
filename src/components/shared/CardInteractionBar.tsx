"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Star, MessageSquare, Plus, Loader2, Trash2, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { NoteRecorder } from "@/components/shared/NoteRecorder"
import { MediaPlayer } from "@/components/timeline/MediaPlayer"

interface CardInteractionBarProps {
    itemId: string
    itemType: 'meditation' | 'prompt' | 'story'
    interaction?: any
    onUpdate?: () => void
    onDelete?: () => Promise<void>
    variant?: 'condensed' | 'full'
    imageThumbnail?: string | null
}

export function CardInteractionBar({ itemId, itemType, interaction, onUpdate, onDelete, variant = 'condensed', imageThumbnail }: CardInteractionBarProps) {
    const [loading, setLoading] = useState(false)
    const [showNotes, setShowNotes] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [notes, setNotes] = useState(interaction?.notes || "")
    const [rating, setRating] = useState(interaction?.rating || 0)

    // Voice Note State
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [audioUrl, setAudioUrl] = useState<string | null>(interaction?.audio_path ? null : null)

    const [playableUrl, setPlayableUrl] = useState<string | null>(null)

    // Load signed URL if audio_path exists
    useState(() => {
        if (interaction?.audio_path) {
            const fetchUrl = async () => {
                const supabase = createClient()
                const { data } = await supabase.storage.from('interactions_audio').createSignedUrl(interaction.audio_path, 3600)
                if (data) setPlayableUrl(data.signedUrl)
            }
            fetchUrl()
        }
    })

    const tableName = itemType === 'meditation' ? 'meditation_interactions' :
        itemType === 'prompt' ? 'prompt_interactions' : 'story_interactions'

    const idColumn = itemType === 'meditation' ? 'meditation_id' :
        itemType === 'prompt' ? 'prompt_id' : 'story_id'

    const handleRate = async (newRating: number) => {
        setRating(newRating) // Optimistic
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase.from(tableName).upsert({
            user_id: user.id,
            [idColumn]: itemId,
            rating: newRating,
            updated_at: new Date().toISOString()
        }, { onConflict: `user_id,${idColumn}` })

        if (onUpdate) onUpdate()
    }

    const handleSaveNote = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        let finalAudioPath = interaction?.audio_path || null
        let transcriptText = ""

        // 1. Upload Audio if exists
        if (audioBlob) {
            console.log("Starting upload...")
            const fileName = `${user.id}/${Date.now()}.webm`
            const { error: uploadError } = await supabase.storage
                .from('interactions_audio')
                .upload(fileName, audioBlob, {
                    contentType: audioBlob.type || 'audio/webm'
                })

            if (uploadError) {
                alert("DEBUG: Failed to upload audio: " + uploadError.message)
                setLoading(false)
                return
            }
            finalAudioPath = fileName
            console.log("Upload success:", fileName)

            // 2. Auto-Transcribe
            try {
                // We need a signed URL for AssemblyAI to access it (private bucket)
                const { data: signedData } = await supabase.storage
                    .from('interactions_audio')
                    .createSignedUrl(fileName, 300) // 5 mins access

                if (signedData?.signedUrl) {
                    console.log("Transcribing...")
                    const response = await fetch('/api/transcribe', {
                        method: 'POST',
                        body: JSON.stringify({ audioUrl: signedData.signedUrl }),
                        headers: { 'Content-Type': 'application/json' }
                    })

                    if (response.ok) {
                        const result = await response.json()
                        if (result.text) {
                            transcriptText = result.text
                            console.log("Transcript received")
                        }
                    } else {
                        const errTxt = await response.text()
                        console.error("Transcription failed", errTxt)
                        alert("DEBUG: Transcription API failed: " + errTxt)
                    }
                }
            } catch (err: any) {
                console.error("Transcription error", err)
                alert("DEBUG: Transcription Logic Error: " + err.message)
            }
        }

        // 3. Save Interaction (Append transcript if exists)
        // If user already typed notes, append. If empty, just set.
        let finalNotes = notes
        if (transcriptText) {
            finalNotes = finalNotes ? `${finalNotes}\n\n[Transcript]: ${transcriptText}` : `[Transcript]: ${transcriptText}`
            setNotes(finalNotes) // Update UI
        }

        const { error } = await supabase
            .from(tableName)
            .upsert({
                user_id: user.id,
                [idColumn]: itemId,
                notes: finalNotes,
                audio_path: finalAudioPath,
                updated_at: new Date().toISOString()
            }, { onConflict: `user_id,${idColumn}` })

        if (error) {
            alert("DEBUG: Database Save Failed: " + error.message + " | Table: " + tableName)
        } else {
            setShowNotes(false)
            setAudioBlob(null) // Reset local blob, now saved
            if (onUpdate) onUpdate()
            // Alert success momentarily if needed, but UI close usually suffice.
        }
        setLoading(false)
    }

    const handleDeleteAudio = async () => {
        setPlayableUrl(null)
        setAudioBlob(null)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        if (interaction?.audio_path) {
            await supabase.from(tableName).update({ audio_path: null }).match({ user_id: user.id, [idColumn]: itemId })
            if (onUpdate) onUpdate()
        }
    }

    const addToPlan = async (e: React.MouseEvent) => {
        e.stopPropagation()
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const { data: plan } = await supabase
            .from('weekly_plans')
            .select('id')
            .eq('user_id', user?.id)
            .eq('is_active', true)
            .single()

        if (plan) {
            await supabase.from('weekly_plan_items').insert({
                plan_id: plan.id,
                item_type: itemType, // 'meditation' or 'prompt' match DB constraints
                [idColumn]: itemId,
                status: 'pending'
            })
            alert("Added to Weekly Plan")
        } else {
            alert("No active weekly plan found.")
        }
        setLoading(false)
    }

    const handleDeleteConfirm = async () => {
        if (onDelete) {
            setLoading(true)
            await onDelete()
            setLoading(false)
            setShowDeleteConfirm(false)
        }
    }

    // -- RENDER Condensed (Card Footer) --
    if (variant === 'condensed') {
        return (
            <div className="flex flex-col gap-2 w-full" onClick={e => e.stopPropagation()}>
                {/* Notes Preview */}
                {(notes || playableUrl || imageThumbnail) && (
                    <div className="bg-muted/40 p-2 rounded text-xs text-muted-foreground line-clamp-2 border-l-2 border-primary mb-1 italic flex items-center gap-2">
                        {imageThumbnail && (
                            <div className="h-8 w-8 rounded overflow-hidden shadow-sm border bg-muted shrink-0">
                                <img src={imageThumbnail} alt="Thumbnail" className="h-full w-full object-cover" />
                            </div>
                        )}
                        <span>{notes || (playableUrl ? "Audio note recorded..." : (imageThumbnail ? "Image Attached" : ""))}</span>
                    </div>
                )}

                <div className="flex justify-between items-center w-full">
                    <div className="flex gap-2 items-center">
                        {/* Note Dialog Trigger */}
                        <Dialog open={showNotes} onOpenChange={setShowNotes}>
                            <DialogTrigger asChild>
                                <Button
                                    variant={notes || playableUrl ? "secondary" : "ghost"}
                                    size="sm"
                                    className={cn("text-xs h-7 px-2", (notes || playableUrl) && "text-primary font-semibold bg-primary/10 hover:bg-primary/20")}
                                >
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    {notes || playableUrl ? "Notes Attached" : "Note"}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Your Notes</DialogTitle></DialogHeader>
                                <div className="space-y-4 py-2">
                                    <div className="space-y-2">
                                        <Label>Voice Note</Label>
                                        <NoteRecorder
                                            onSave={(blob) => {
                                                console.log("NoteRecorder saved blob:", blob.size, blob.type);
                                                setAudioBlob(blob);
                                            }}
                                            initialAudioUrl={playableUrl}
                                            onDelete={handleDeleteAudio}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Written Notes</Label>
                                        <Textarea
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            placeholder="Takeaways, feelings, or automatic transcript..."
                                            className="min-h-[120px]"
                                        />
                                    </div>
                                    <Button onClick={handleSaveNote} disabled={loading} className="w-full">
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Everything
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Rating Stars (Condensed) */}
                        <div className="flex items-center gap-0.5 ml-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleRate(star)
                                    }}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={cn(
                                            "h-3 w-3 transition-colors",
                                            rating >= star ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30 hover:text-yellow-200"
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-1">
                        {/* Add to Plan */}
                        <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={addToPlan} disabled={loading}>
                            <Plus className="h-3 w-3 mr-1" /> Plan
                        </Button>

                        {onDelete && (
                            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-muted-foreground hover:text-red-500 hover:bg-red-50">
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-red-600">
                                            <AlertTriangle className="h-5 w-5" /> Delete Item?
                                        </DialogTitle>
                                        <DialogDescription>
                                            Are you sure you want to delete this? This action cannot be undone.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={loading}>
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Forever"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // -- RENDER Full (Expanded View) --
    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Rating Stars */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => handleRate(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                            title="Rate usefulness"
                        >
                            <Star className={cn("h-5 w-5", star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
                        </button>
                    ))}
                    <span className="text-xs text-muted-foreground ml-2">{rating > 0 ? "Rated" : "Rate"}</span>
                </div>
                {onDelete && (
                    <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-xs h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50">
                                <Trash2 className="h-4 w-4 mr-1" /> Delete
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-red-600">
                                    <AlertTriangle className="h-5 w-5" /> Delete Item?
                                </DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete this? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                                <Button variant="destructive" onClick={handleDeleteConfirm} disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Forever"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Actions Row */}
            <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowNotes(true)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {notes || playableUrl ? "View/Edit Notes" : "Add Note"}
                </Button>
                <Button variant="default" size="sm" className="flex-1" onClick={addToPlan} disabled={loading}>
                    <Plus className="h-4 w-4 mr-2" /> Add to Plan
                </Button>
            </div>

            {/* Reopen Note Logic for Full View (Duplicate of condensed but usually triggered by above button) */}
            <Dialog open={showNotes} onOpenChange={setShowNotes}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Your Notes</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Voice Note</Label>
                            <NoteRecorder
                                onSave={(blob) => setAudioBlob(blob)}
                                initialAudioUrl={playableUrl}
                                onDelete={handleDeleteAudio}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Written Notes</Label>
                            <Textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="min-h-[120px]"
                            />
                        </div>
                        <Button onClick={handleSaveNote} disabled={loading} className="w-full">
                            Save Everything
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
