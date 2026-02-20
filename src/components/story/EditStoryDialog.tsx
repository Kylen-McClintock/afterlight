"use client"

import { useState, useEffect, useRef } from "react"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/utils/supabase/client"
import { Calendar as CalendarIcon, Loader2, X, Upload, Mic, Play, Pause, Wand2, UserPlus, Users, FileText, Trash2 } from "lucide-react"
import { StoryRecorder } from "./StoryRecorder"
import { StoryImage } from "@/components/timeline/StoryImage"

interface EditStoryDialogProps {
    story: any
    onSuccess: () => void
    trigger?: React.ReactNode
}

export function EditStoryDialog({ story, onSuccess, trigger }: EditStoryDialogProps) {
    const [open, setOpen] = useState(false)
    const [recorderOpen, setRecorderOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form State
    const [title, setTitle] = useState(story.title || (story.prompt_request ? story.prompt_request.prompt_text : "") || "")

    // Auto-fill title if empty
    useEffect(() => {
        if (!title && story.prompt_request?.prompt_text) {
            setTitle(story.prompt_request.prompt_text)
        }
    }, [story.prompt_request])

    const [location, setLocation] = useState(story.location || "")
    const [dateGranularity, setDateGranularity] = useState<string>(story.date_granularity || "exact")
    const [storyDate, setStoryDate] = useState<string>(
        story.story_date ? (() => {
            const dateStr = story.story_date.split('T')[0]
            return dateStr
        })() : ""
    )

    const [yearInput, setYearInput] = useState<string>(story.story_date ? parseInt(story.story_date.split('-')[0]).toString() : new Date().getFullYear().toString())
    // const [seasonInput, setSeasonInput] = useState<string>("Summer") 

    // Relationship State
    const [relationshipLabel, setRelationshipLabel] = useState<string>(story.relationship_label || "None")
    const [relationships, setRelationships] = useState<any[]>([])

    // Fetch Relationships on mount
    useEffect(() => {
        const fetchRelationships = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('relationships').select('*').order('category')
            if (data) setRelationships(data)
        }
        fetchRelationships()
    }, [])

    // Group relationships
    const groupedRelationships = relationships.reduce((acc, rel) => {
        if (!acc[rel.category]) acc[rel.category] = []
        acc[rel.category].push(rel)
        return acc
    }, {} as Record<string, any[]>)

    // Recipients State
    const [recipients, setRecipients] = useState<any[]>(story.recipients || [])
    const [members, setMembers] = useState<any[]>([])

    // Fetch Circle Members
    useEffect(() => {
        const fetchMembers = async () => {
            if (!story.circle_id) return
            const supabase = createClient()
            const { data } = await supabase
                .from('circle_memberships')
                .select('user_id, profile:user_id(display_name, avatar_url)')
                .eq('circle_id', story.circle_id)

            if (data) {
                setMembers(data.map((m: any) => ({
                    user_id: m.user_id,
                    display_name: m.profile?.display_name || "Unknown Member",
                    avatar_url: m.profile?.avatar_url
                })))
            }
        }
        fetchMembers()
    }, [story.circle_id])

    // Photo Upload State
    const [uploading, setUploading] = useState(false)
    const [transcribing, setTranscribing] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [photos, setPhotos] = useState<any[]>(story.story_assets?.filter((a: any) => a.asset_type === 'photo') || [])

    const [audioAssets, setAudioAssets] = useState<any[]>(() => {
        const fromAssets = story.story_assets?.filter((a: any) => a.asset_type === 'audio') || []
        const fromMedia = story.media?.filter((m: any) => m.type === 'audio') || []
        return fromMedia.length > 0 ? fromMedia : fromAssets
    })

    const [transcriptText, setTranscriptText] = useState<string>(() => {
        const txt = story.story_assets?.find((a: any) => a.asset_type === 'text' && a.source_type === 'transcription')
        return txt ? txt.text_content : ""
    })

    // Sync state if story updates 
    useEffect(() => {
        const fromAssets = story.story_assets?.filter((a: any) => a.asset_type === 'audio') || []
        const fromMedia = story.media?.filter((m: any) => m.type === 'audio') || []
        const updated = fromMedia.length > 0 ? fromMedia : fromAssets

        if (updated.length !== audioAssets.length) {
            setAudioAssets(updated)
        }

        const txt = story.story_assets?.find((a: any) => a.asset_type === 'text' && a.source_type === 'transcription')
        if (txt && txt.text_content !== transcriptText) {
            setTranscriptText(txt.text_content)
        }
    }, [story.story_assets, story.media])

    const handleSave = async () => {
        setLoading(true)
        const supabase = createClient()

        let finalDate = storyDate
        if (dateGranularity === 'year') {
            finalDate = `${yearInput}-01-02`
        }
        if (!finalDate && dateGranularity === 'exact') finalDate = null as any

        console.log("Saving Story:", { title, finalDate, dateGranularity, id: story.id })

        const { error } = await supabase
            .from('story_sessions')
            .update({
                title: title,
                story_date: finalDate || null,
                date_granularity: dateGranularity,
                location: location,
                relationship_label: relationshipLabel === "None" ? null : relationshipLabel
            })
            .eq('id', story.id)

        if (error) {
            console.error("Supabase Save Error:", error)
            alert(`Failed to update story. DB Error: ${JSON.stringify(error, null, 2)}`)
        } else {
            console.log("Save successful")
            setOpen(false)
            onSuccess()
        }
        setLoading(false)
    }

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        setUploading(true)
        const file = e.target.files[0]
        const supabase = createClient()
        const fileExt = file.name.split('.').pop()
        const fileName = `${story.id}/${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('stories')
            .upload(filePath, file)

        if (uploadError) {
            console.error("Storage Error:", uploadError)
            alert(`Error uploading photo to storage: ${JSON.stringify(uploadError, null, 2)}`)
            setUploading(false)
            return
        }

        const { data: { user } } = await supabase.auth.getUser()

        const { data: assetData, error: dbError } = await supabase
            .from('story_assets')
            .insert({
                story_session_id: story.id,
                asset_type: 'photo',
                source_type: 'file_upload',
                storage_path: filePath,
                mime_type: file.type,
                created_by_user_id: user?.id
            })
            .select()
            .single()

        if (dbError) {
            console.error("Asset DB Error:", dbError)
            alert(`Error creating database record for photo: ${JSON.stringify(dbError, null, 2)}`)
        } else {
            setPhotos([...photos, assetData])
        }
        setUploading(false)
        e.target.value = ""
    }

    const handleDeletePhoto = async (photoId: string, storagePath?: string) => {
        if (!confirm("Are you sure you want to delete this photo?")) return
        setLoading(true)
        const supabase = createClient()

        let success = true

        if (storagePath) {
            const { error: storageError } = await supabase.storage.from('stories').remove([storagePath])
            if (storageError) {
                console.error("Error removing from storage:", storageError)
            }
        }

        const { error: dbError } = await supabase.from('story_assets').delete().eq('id', photoId)
        if (dbError) {
            console.error("Error deleting from DB:", dbError)
            alert("Failed to delete photo from database.")
            success = false
        }

        if (success) {
            setPhotos(photos.filter(p => p.id !== photoId))
            onSuccess() // Refresh parent state if needed
        }
        setLoading(false)
    }

    const [isPlaying, setIsPlaying] = useState(false)

    const handleTranscribe = async () => {
        const audioMedia = audioAssets[0]
        if (!audioMedia?.url) {
            alert("No audio URL found. You may need to reload to get the signed URL.")
            return
        }

        setTranscribing(true)
        try {
            const response = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioUrl: audioMedia.url })
            })

            const data = await response.json()
            if (data.error) throw new Error(data.error)

            if (data.text) {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                await supabase.from('story_assets').insert({
                    story_session_id: story.id,
                    asset_type: 'text',
                    source_type: 'transcription',
                    text_content: data.text,
                    created_by_user_id: user?.id
                })

                alert("Transcription complete! Added as a note.")
                onSuccess()
            }
        } catch (error) {
            console.error("Transcription failed", error)
            alert("Failed to transcribe audio. Please try again.")
        } finally {
            setTranscribing(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Edit Story</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Story Details</DialogTitle>
                    <DialogDescription>
                        Add details to place this story on your timeline.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Story Title" />
                    </div>

                    <div className="space-y-2">
                        <Label>Location (Optional)</Label>
                        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Grandma's House, Paris" />
                    </div>

                    {/* Shared With */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Shared With</Label>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                                        <UserPlus className="h-3 w-3 mr-1" />
                                        Add Person
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-sm">
                                    <DialogHeader><DialogTitle>Share Story</DialogTitle></DialogHeader>
                                    <RecipientSelector
                                        storyId={story.id}
                                        existingMembers={members}
                                        onAdd={(newRecipient) => setRecipients([...recipients, newRecipient])}
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {recipients.length === 0 && (
                                <span className="text-xs text-muted-foreground italic pl-1">Visible to all circle members</span>
                            )}
                            {recipients.map((r, i) => (
                                <div key={i} className="flex items-center gap-1.5 bg-secondary/50 rounded-full pl-1 pr-3 py-1 border">
                                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                        {r.profile?.avatar_url ? (
                                            <img src={r.profile.avatar_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <Users className="h-3 w-3 text-muted-foreground" />
                                        )}
                                    </div>
                                    <span className="text-xs font-medium">
                                        {r.recipient_email || r.profile?.display_name || "Guest"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Relationship/Author */}
                    <div className="space-y-2">
                        <Label>Who is telling this story?</Label>
                        <Select value={relationshipLabel} onValueChange={setRelationshipLabel}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select relationship..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="None">Me (Primary User)</SelectItem>
                                {Object.entries(groupedRelationships).map(([category, rels]) => (
                                    <div key={category}>
                                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/20">
                                            {category}
                                        </div>
                                        {/* @ts-ignore */}
                                        {rels.map((rel: any) => (
                                            <SelectItem key={rel.id} value={rel.label}>
                                                {rel.label}
                                            </SelectItem>
                                        ))}
                                    </div>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date Section */}
                    <div className="space-y-3 p-3 border rounded-md bg-muted/20">
                        <Label>When did this happen?</Label>
                        <div className="flex gap-2 mb-2">
                            <Select value={dateGranularity} onValueChange={setDateGranularity}>
                                <SelectTrigger className="w-[240px]">
                                    <SelectValue placeholder="Precision" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="exact">Exact Date</SelectItem>
                                    <SelectItem value="year">Year Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {dateGranularity === 'exact' ? (
                            <Input
                                type="date"
                                value={storyDate}
                                onChange={(e) => setStoryDate(e.target.value)}
                            />
                        ) : (
                            <div className="flex items-center gap-2">
                                <Label className="whitespace-nowrap">Year:</Label>
                                <Input
                                    type="number"
                                    value={yearInput}
                                    onChange={(e) => setYearInput(e.target.value)}
                                    className="w-24"
                                />
                            </div>
                        )}
                    </div>

                    {/* Photos Section */}
                    <div className="space-y-3">
                        <Label>Photos</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {photos.map((photo: any) => (
                                <div key={photo.id} className="relative aspect-square rounded-md overflow-hidden bg-muted border group">
                                    <StoryImage
                                        storagePath={photo.storage_path}
                                        alt="Story attachment"
                                        className="w-full h-full object-cover"
                                    />
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeletePhoto(photo.id, photo.storage_path)
                                        }}
                                        disabled={loading}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}

                            <div className="flex flex-col items-center justify-center aspect-square rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/5 relative">
                                {uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10"><Loader2 className="h-6 w-6 animate-spin" /></div>}

                                {audioAssets.length > 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full w-full p-2 bg-muted/40 rounded-md gap-2 overflow-hidden">
                                        <div className="flex items-center gap-2 w-full justify-center">
                                            <Button variant="ghost" size="icon" onClick={() => audioRef.current?.paused ? audioRef.current?.play() : audioRef.current?.pause()} type="button" className="h-6 w-6">
                                                {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                                            </Button>
                                            <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[60px]">Audio</span>
                                        </div>

                                        {/* Transcript Display or Button */}
                                        {transcriptText ? (
                                            <div className="relative group w-full">
                                                <div className="w-full max-h-[60px] overflow-y-auto hidden-scrollbar bg-white/50 dark:bg-black/20 p-1.5 rounded text-[9px] text-muted-foreground leading-snug border">
                                                    {transcriptText}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-0 right-0 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
                                                    title="Re-transcribe"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        if (confirm("Regenerate transcript? This will overwrite existing notes.")) {
                                                            handleTranscribe()
                                                        }
                                                    }}
                                                >
                                                    <Wand2 className="h-2.5 w-2.5 text-primary" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                variant={transcribing ? "outline" : "secondary"}
                                                size="sm"
                                                className="w-full text-[10px] h-6 gap-1 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                                                onClick={handleTranscribe}
                                                disabled={transcribing}
                                                type="button"
                                            >
                                                {transcribing ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Wand2 className="h-2.5 w-2.5" />}
                                                {transcribing ? "Transcribing..." : "Generate Transcript"}
                                            </Button>
                                        )}

                                        <audio
                                            ref={audioRef}
                                            src={audioAssets[0].url || ""}
                                            onPlay={() => setIsPlaying(true)}
                                            onPause={() => setIsPlaying(false)}
                                            onEnded={() => setIsPlaying(false)}
                                            className="hidden"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full w-full opacity-60">
                                        <Wand2 className="h-5 w-5 text-muted-foreground mb-1" />
                                        <span className="text-[10px] text-muted-foreground text-center px-1">Record audio to enable transcription</span>
                                    </div>
                                )}

                                {/* Hidden file input kept for photo upload if clicked on border? No, this div was a label. 
                                    Separating audio handling from photo upload to avoid confusion. 
                                    The original code mixed them. Let's keep the photo upload capability on specific click or add a dedicated button? 
                                    Actually, the user wants TRANSCRIPTION key.
                                    Let's just keep this box as the "Audio Status" box since Photos are rendered in the grid.
                                */}
                            </div>

                            {/* Add Photo Button Separate */}
                            <label className="flex flex-col items-center justify-center aspect-square rounded-md border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer bg-muted/5 transition-colors">
                                <PlusIcon className="h-6 w-6 text-muted-foreground mb-1" />
                                <span className="text-[10px] text-muted-foreground font-medium">Add Photo</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t space-y-4">
                    <div className="flex flex-col gap-2">
                        <Label className="block">Add Content</Label>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={async () => {
                                const note = prompt("Enter your note:")
                                if (!note) return

                                const supabase = createClient()
                                const { data: { user } } = await supabase.auth.getUser()
                                await supabase.from('story_assets').insert({
                                    story_session_id: story.id,
                                    asset_type: 'text',
                                    source_type: 'text',
                                    text_content: note,
                                    created_by_user_id: user?.id
                                })
                                onSuccess()
                                setOpen(false)
                            }}>
                                <FileText className="mr-2 h-4 w-4" />
                                Text Note
                            </Button>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <PlusIcon className="mr-2 h-4 w-4" />
                                        Add to Collection
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Add to Collection</DialogTitle></DialogHeader>
                                    <div className="py-4">
                                        <CollectionSelector storyId={story.id} />
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={recorderOpen} onOpenChange={setRecorderOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Mic className="mr-2 h-4 w-4" />
                                        Record Audio
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader><DialogTitle>Record Audio</DialogTitle></DialogHeader>
                                    <StoryRecorder mode="audio" onSave={async (blob: Blob) => {
                                        const supabase = createClient()
                                        const fileName = `${story.id}/${Date.now()}.webm`
                                        const { error: uploadError } = await supabase.storage
                                            .from('stories')
                                            .upload(fileName, blob)

                                        if (uploadError) {
                                            alert("Error uploading")
                                            return
                                        }

                                        const { data: { publicUrl } } = supabase.storage.from('stories').getPublicUrl(fileName)
                                        const { data: { user } } = await supabase.auth.getUser()

                                        const { data: newAsset, error: dbError } = await supabase.from('story_assets').insert({
                                            story_session_id: story.id,
                                            asset_type: 'audio',
                                            source_type: 'browser_recording',
                                            storage_path: fileName,
                                            mime_type: 'audio/webm',
                                            created_by_user_id: user?.id
                                        }).select().single()

                                        if (dbError) {
                                            alert(`Error saving to database: ${dbError.message}`)
                                            console.error("DB Error:", dbError)
                                            return
                                        }

                                        if (newAsset) {
                                            const assetWithUrl = { ...newAsset, url: publicUrl }
                                            setAudioAssets([assetWithUrl])
                                            alert("Audio saved! Transcribing now...")
                                            setRecorderOpen(false)

                                            setTranscribing(true)
                                            try {
                                                const response = await fetch('/api/transcribe', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ audioUrl: publicUrl })
                                                })
                                                const data = await response.json()
                                                if (data.text) {
                                                    await supabase.from('story_assets').insert({
                                                        story_session_id: story.id,
                                                        asset_type: 'text',
                                                        source_type: 'transcription',
                                                        text_content: data.text,
                                                        created_by_user_id: user?.id
                                                    })
                                                    setTranscriptText(data.text)
                                                    alert("Transcription complete!")
                                                }
                                            } catch (err) {
                                                console.error("Auto-transcription failed", err)
                                            } finally {
                                                setTranscribing(false)
                                                onSuccess()
                                            }
                                        }
                                    }} />
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-6 flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground mr-auto">vDebug 3.0</span>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function CollectionSelector({ storyId }: { storyId: string }) {
    const [collections, setCollections] = useState<any[]>([])
    const [selected, setSelected] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetch = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('prompt_collections').select('*')
            if (data) setCollections(data)
        }
        fetch()
    }, [])

    const handleAdd = async () => {
        if (!selected) return
        setLoading(true)
        const supabase = createClient()
        const { error } = await supabase
            .from('prompt_collection_items')
            .insert({
                collection_id: selected,
                story_id: storyId
            })

        if (error) alert(`Error adding to collection: ${error.message}`)
        else {
            alert("Added!")
            window.location.reload()
        }
        setLoading(false)
    }

    return (
        <div className="flex gap-2">
            <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Collection" />
                </SelectTrigger>
                <SelectContent>
                    {collections.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={loading || !selected}>Add</Button>
        </div>
    )
}

function PlusIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}

function RecipientSelector({ storyId, existingMembers, onAdd }: { storyId: string, existingMembers: any[], onAdd: (r: any) => void }) {
    const [email, setEmail] = useState("")
    const [selectedMember, setSelectedMember] = useState("")
    const [loading, setLoading] = useState(false)

    const handleInvite = async () => {
        if (!email && !selectedMember) return
        setLoading(true)
        const supabase = createClient()

        const payload: any = { story_session_id: storyId }

        if (selectedMember) {
            payload.recipient_user_id = selectedMember
        } else {
            payload.recipient_email = email
        }

        const { data, error } = await supabase
            .from('story_recipients')
            .insert(payload)
            .select()
            .single()

        if (error) {
            alert("Error adding recipient")
        } else {
            const newRecip = {
                ...data,
                profile: existingMembers.find(m => m.user_id === selectedMember)
            }
            onAdd(newRecip)
            setEmail("")
            setSelectedMember("")
        }
        setLoading(false)
    }

    return (
        <div className="space-y-4 py-2">
            <div className="space-y-2">
                <Label>Select Family Member</Label>
                <Select value={selectedMember} onValueChange={(val) => { setSelectedMember(val); setEmail("") }}>
                    <SelectTrigger>
                        <SelectValue placeholder="Choose member..." />
                    </SelectTrigger>
                    <SelectContent>
                        {existingMembers.map(m => (
                            <SelectItem key={m.user_id} value={m.user_id}>
                                {m.display_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or share via email</span>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Guest Email</Label>
                <Input
                    placeholder="guest@example.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setSelectedMember("") }}
                />
            </div>

            <Button className="w-full" onClick={handleInvite} disabled={loading || (!email && !selectedMember)}>
                {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                Add to Story
            </Button>
        </div>
    )
}
