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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/utils/supabase/client"
import { Loader2, Upload, Image as ImageIcon, X, FileText, Mic, Users, UserPlus } from "lucide-react"
import { StoryRecorder } from "./StoryRecorder"

interface EditStoryDialogProps {
    story: any
    onSuccess: () => void
    trigger?: React.ReactNode
}

export function EditStoryDialog({ story, onSuccess, trigger }: EditStoryDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form State
    // Default title to story.title -> prompt.title -> "Untitled"
    const [title, setTitle] = useState(story.title || (story.prompt_request ? story.prompt_request.prompt_text : "") || "")
    // Note: story prop might not have prompt_request directly if not fetched carefully.
    // Let's assume passed story object has it or we rely on user input.
    // Actually, `EditStoryDialog` receives `story`. We need to verify `story` has `prompt_request`.

    // If the component mounts and we want to auto-fill title if empty:
    useEffect(() => {
        if (!title && story.prompt_request?.prompt_text) {
            setTitle(story.prompt_request.prompt_text)
        }
    }, [story.prompt_request])

    const [location, setLocation] = useState(story.location || "")
    const [dateGranularity, setDateGranularity] = useState<string>(story.date_granularity || "exact")
    const [storyDate, setStoryDate] = useState<string>(
        story.story_date ? story.story_date.split('T')[0] : ""
    )
    // Using string for date input (YYYY-MM-DD)

    // For fuzzy dates (Year/Season), we might want separate inputs, 
    // but for MVP let's store standard date and use granularity to decide display.
    // If granularity is 'year', we default to Jan 1st of that year in DB but display only year.
    const [yearInput, setYearInput] = useState<string>(story.story_date ? new Date(story.story_date).getFullYear().toString() : new Date().getFullYear().toString())
    const [seasonInput, setSeasonInput] = useState<string>("Summer")

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
            // Fetch members and their profiles
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
    const [photos, setPhotos] = useState<any[]>(story.story_assets?.filter((a: any) => a.asset_type === 'photo') || [])

    const handleSave = async () => {
        setLoading(true)
        const supabase = createClient()

        let finalDate = storyDate
        if (dateGranularity === 'year') {
            // For year only, set to Jan 1st
            finalDate = `${yearInput}-01-01`
        }
        // If exact and empty, maybe set null? Or is it required? 
        // If empty, let's keep it null if allowed.
        if (!finalDate && dateGranularity === 'exact') finalDate = null as any


        const { error } = await supabase
            .from('story_sessions')
            .update({
                title: title,
                story_date: finalDate,
                date_granularity: dateGranularity,

                location: location,
                relationship_label: relationshipLabel === "None" ? null : relationshipLabel
            })
            .eq('id', story.id)

        if (error) {
            console.error(error)
            alert("Failed to update story")
        } else {
            setOpen(false)
            onSuccess()
            // window.location.reload() // Or rely on onSuccess callback to refresh
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

        // 1. Upload to Storage
        const { error: uploadError } = await supabase.storage
            .from('stories')
            .upload(filePath, file)

        if (uploadError) {
            console.error(uploadError)
            alert("Error uploading photo")
            setUploading(false)
            return
        }

        // 2. Create Asset Record
        const { data: assetData, error: dbError } = await supabase
            .from('story_assets')
            .insert({
                story_session_id: story.id,
                asset_type: 'photo',
                source_type: 'file_upload',
                storage_path: filePath,
                mime_type: file.type
            })
            .select()
            .single()

        if (dbError) {
            console.error(dbError)
            alert("Error saving photo record")
        } else {
            setPhotos([...photos, assetData])
        }
        setUploading(false)
        e.target.value = "" // Reset input
    }

    // Helper to delete photo? (Maybe later)

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
                    {/* Title */}
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Story Title" />
                    </div>

                    {/* Location */}
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
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Precision" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="exact">Exact Date</SelectItem>
                                    <SelectItem value="year">Year Only</SelectItem>
                                    {/* <SelectItem value="season">Season & Year</SelectItem> */}
                                    {/* keeping it simple for now */}
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
                                <div key={photo.id} className="relative aspect-square rounded-md overflow-hidden bg-muted border">
                                    <img
                                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/stories/${photo.storage_path}`}
                                        alt="Story attachment"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}

                            <label className="flex flex-col items-center justify-center aspect-square rounded-md border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer bg-muted/5 transition-colors">
                                {uploading ? (
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                ) : (
                                    <>
                                        <PlusIcon className="h-6 w-6 text-muted-foreground mb-1" />
                                        <span className="text-[10px] text-muted-foreground font-medium">Add Photo</span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handlePhotoUpload}
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Add Note Section */}
                <div className="pt-4 border-t space-y-4">
                    <div className="flex flex-col gap-2">
                        <Label className="block">Add Content</Label>
                        <div className="flex flex-wrap gap-2">
                            {/* Add Note */}
                            <Button variant="outline" size="sm" onClick={async () => {
                                const note = prompt("Enter your note:")
                                if (!note) return

                                const supabase = createClient()
                                await supabase.from('story_assets').insert({
                                    story_session_id: story.id,
                                    asset_type: 'text',
                                    source_type: 'text',
                                    text_content: note
                                })
                                onSuccess()
                                setOpen(false)
                            }}>
                                <FileText className="mr-2 h-4 w-4" />
                                Text Note
                            </Button>

                            {/* Add Collection */}
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

                            {/* Add Recording */}
                            <Dialog>
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

                                        await supabase.from('story_assets').insert({
                                            story_session_id: story.id,
                                            asset_type: 'audio',
                                            source_type: 'browser_recording',
                                            storage_path: fileName,
                                            mime_type: 'audio/webm'
                                        })
                                        onSuccess()
                                        setOpen(false) // Close main dialog too? Or just inner?
                                        // Just let inner close by nature of it being done, actually we need to close the inner dialog.
                                        // But here we are inline. We might need a refreshed state.
                                        window.location.reload()
                                    }} />
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-6">
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// Helper Component for Collections
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
            .from('custom_collection_items')
            .insert({
                collection_id: selected,
                story_id: storyId
            })

        if (error) alert("Error adding to collection")
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
            // Optimistic update structure
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
