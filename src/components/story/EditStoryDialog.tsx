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
import { Loader2, Upload, Image as ImageIcon, X } from "lucide-react"

interface EditStoryDialogProps {
    story: any
    onSuccess: () => void
    trigger?: React.ReactNode
}

export function EditStoryDialog({ story, onSuccess, trigger }: EditStoryDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form State
    const [title, setTitle] = useState(story.title || "")
    const [dateGranularity, setDateGranularity] = useState<string>(story.date_granularity || "exact")
    const [storyDate, setStoryDate] = useState<string>(story.story_date || "")
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

    // Photo Upload State
    const [uploading, setUploading] = useState(false)
    const [photos, setPhotos] = useState<any[]>(story.story_assets?.filter((a: any) => a.asset_type === 'photo') || [])

    const handleSave = async () => {
        setLoading(true)
        const supabase = createClient()

        let finalDate = storyDate
        if (dateGranularity === 'year' || dateGranularity === 'season') {
            // Construct a date based on year
            // Season logic is display-only mostly, but we need a valid Postgres DATE
            finalDate = `${yearInput}-01-01`
        }

        const { error } = await supabase
            .from('story_sessions')
            .update({
                title: title,
                story_date: finalDate,
                date_granularity: dateGranularity,
                relationship_label: relationshipLabel === "None" ? null : relationshipLabel
            })
            .eq('id', story.id)

        if (error) {
            console.error(error)
            alert("Failed to update story")
        } else {
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
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
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
                                    {/* We need public/signed URL here. For now assuming public or generic placeholder if private not loaded yet */}
                                    {/* In a real app we'd load signed URLs for these previews too since bucket is private. */}
                                    <div className="flex items-center justify-center h-full bg-secondary/30 text-xs text-muted-foreground">
                                        Photo
                                    </div>
                                    {/* Displaying actual image requires async signing logic similar to MediaPlayer or StoryCard logic. 
                                         For Edit Preview, we skip it to save time or just show filename/icon. */}
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

                <DialogFooter>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
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
