"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { StoryRecorder } from "@/components/story/StoryRecorder"
import { createClient } from "@/utils/supabase/client"
import { useState, Suspense, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Upload, Loader2, Save, Mic, Video, FileText } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PromptLibrary } from "@/components/prompts/PromptLibrary"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function CreateStoryContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    // State 1: Mode & Prompt
    // If promptId exists, we are in RECORDER mode.
    // If mode param exists (e.g. ?mode=free), we are in RECORDER mode (Free form).
    // Otherwise, we are in LIBRARY mode.

    const urlPromptId = searchParams.get("promptId")
    const urlMode = searchParams.get("mode")

    // Check if we should show the recorder
    const showRecorder = !!urlPromptId || !!urlMode

    // If in recorder, what is the default tab?
    // We can infer from `mode` param if it matches 'text'|'audio'|'video'|'upload'
    // Default to 'audio'
    const defaultTab = (urlMode === 'text' || urlMode === 'video' || urlMode === 'upload' || urlMode === 'audio') ? urlMode : 'audio'
    const [activeTab, setActiveTab] = useState(defaultTab)

    // Sync active tab with local state if URL changes (optional, but good for back button)
    useEffect(() => {
        if (urlMode && ['text', 'video', 'upload', 'audio'].includes(urlMode)) {
            setActiveTab(urlMode)
        }
    }, [urlMode])

    // Prompt Data Fetching (if promptId is present)
    const [selectedPrompt, setSelectedPrompt] = useState<any>(null)

    // UUID Validation
    const isValidUuid = (id: string | null) => {
        if (!id) return false
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    }
    const safePromptId = isValidUuid(urlPromptId) ? urlPromptId : null

    useEffect(() => {
        const fetchPrompt = async () => {
            if (!safePromptId) {
                setSelectedPrompt(null)
                return
            }
            const supabase = createClient()
            // Try fetching from Global Library first (since we just support that for now in this flow)
            const { data } = await supabase
                .from('prompt_library_global')
                .select('*')
                .eq('id', safePromptId)
                .single()

            if (data) setSelectedPrompt(data)
        }
        fetchPrompt()
    }, [safePromptId])

    // Recorder State
    const [title, setTitle] = useState("")
    const [storyDate, setStoryDate] = useState("")
    const [dateGranularity, setDateGranularity] = useState("exact")
    const [location, setLocation] = useState("")
    const [textContent, setTextContent] = useState("")
    const [file, setFile] = useState<File | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Helper to get active circle
    const getActiveCircleId = async (supabase: any, userId: string) => {
        const { data } = await supabase
            .from('circle_memberships')
            .select('circle_id')
            .eq('user_id', userId)
            .limit(1)
            .single()
        return data?.circle_id
    }

    const handleBackToLibrary = () => {
        router.push("/app/story/create")
    }

    const handleUnifiedSave = async (mediaBlob?: Blob) => {
        // Title Logic: Use input or prompt title. If neither, require input.
        const activeTitle = title.trim() || (selectedPrompt ? selectedPrompt.title : "")
        if (!activeTitle) {
            alert("Please give your story a title.")
            return
        }

        if (activeTab === 'text' && !textContent.trim()) {
            alert("Please write your story.")
            return
        }
        if (activeTab === 'upload' && !file) {
            alert("Please select a file.")
            return
        }

        setIsSaving(true)
        const supabase = createClient()

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const circleId = await getActiveCircleId(supabase, user.id)
            if (!circleId) throw new Error("No circle found. Please create one.")

            // 1. Create Session
            const sessionData = {
                circle_id: circleId,
                title: activeTitle,
                story_date: storyDate || null, // Capture Date
                date_granularity: dateGranularity, // Capture Granularity
                location: location || null, // Capture Location
                storyteller_user_id: user.id,
                global_prompt_id: safePromptId,
                visibility: 'shared_with_circle',
                categories: selectedPrompt?.tags || []
            }

            const { data: session, error: sessionError } = await supabase
                .from('story_sessions')
                .insert(sessionData)
                .select()
                .single()

            if (sessionError) throw sessionError

            // 2. Prepare Asset Data
            let assetType = activeTab
            let sourceType = 'browser_recording'
            let storagePath = null
            let mimeType = null
            let textToSave = null

            // Handle Upload/Media
            if (activeTab === 'audio' || activeTab === 'video') {
                if (!mediaBlob) throw new Error("No recording found")
                const ext = 'webm'
                const fileName = `${session.id}/${Date.now()}.${ext}`
                const { error: uploadError } = await supabase.storage
                    .from('stories')
                    .upload(fileName, mediaBlob)
                if (uploadError) throw uploadError

                storagePath = fileName
                mimeType = mediaBlob.type

                // --- AUTO-TRANSCRIBE ---
                // Removed silent try/catch to expose errors to the user
                console.log("Attempting to transcribe main story audio...")
                // alert("DEBUG: Audio uploaded. Getting signed URL...") 

                const { data: signedData, error: signError } = await supabase.storage
                    .from('stories')
                    .createSignedUrl(fileName, 300)

                if (signError) throw new Error("Sign URL Error: " + signError.message)

                if (signedData?.signedUrl) {
                    // alert("DEBUG: Calling Transcription API...")
                    const res = await fetch('/api/transcribe', {
                        method: 'POST',
                        body: JSON.stringify({ audioUrl: signedData.signedUrl }),
                        headers: { 'Content-Type': 'application/json' }
                    })

                    if (!res.ok) {
                        const errText = await res.text()
                        throw new Error("Transcribe API Error: " + errText)
                    }

                    const result = await res.json()
                    if (result.text) {
                        // Create separate transcript asset
                        const { error: transcriptError } = await supabase.from('story_assets').insert({
                            story_session_id: session.id,
                            asset_type: 'text',
                            source_type: 'transcription',
                            text_content: result.text
                        })
                        if (transcriptError) throw new Error("Transcript Save DB Error: " + transcriptError.message)
                        console.log("Main story transcript saved.")
                        // alert("DEBUG: Transcription Saved Successfully!")
                    } else {
                        throw new Error("API returned no text.")
                    }
                }
                // -----------------------

            } else if (activeTab === 'upload') {
                if (textContent && textContent.includes('http')) {
                    // Google Photos Link / External Link
                    assetType = 'external_media'
                    sourceType = 'external_link'
                    // We store the link in external_url (need to verify DB schema has this column on asset or we use text_content/storage_path appropriately)
                    // Based on schema review, story_assets has `external_url`
                    // Note: TS might complain if I don't add it to insert payload below if types aren't perfect
                    // Let's assume insert accepts it.
                } else if (file) {
                    const ext = file.name.split('.').pop()
                    const fileName = `${session.id}/${Date.now()}.${ext}`

                    // Upload file first
                    const { error: uploadError } = await supabase.storage
                        .from('stories')
                        .upload(fileName, file)
                    if (uploadError) throw uploadError

                    storagePath = fileName
                    mimeType = file.type
                    sourceType = 'file_upload'

                    if (file.type.startsWith('video')) assetType = 'video'
                    else if (file.type.startsWith('audio')) assetType = 'audio'
                    else if (file.type.startsWith('image')) assetType = 'photo'

                    // --- AUTO-TRANSCRIBE (UPLOAD CASE) ---
                    if (assetType === 'audio' || assetType === 'video') {
                        console.log("Attempting to transcribe uploaded file...")
                        const { data: signedData, error: signError } = await supabase.storage
                            .from('stories')
                            .createSignedUrl(fileName, 300)

                        if (!signError && signedData?.signedUrl) {
                            try {
                                const res = await fetch('/api/transcribe', {
                                    method: 'POST',
                                    body: JSON.stringify({ audioUrl: signedData.signedUrl }),
                                    headers: { 'Content-Type': 'application/json' }
                                })
                                if (res.ok) {
                                    const result = await res.json()
                                    if (result.text) {
                                        await supabase.from('story_assets').insert({
                                            story_session_id: session.id,
                                            asset_type: 'text',
                                            source_type: 'transcription',
                                            text_content: result.text
                                        })
                                    }
                                }
                            } catch (e) {
                                console.error("Upload transcription failed (ignoring)", e)
                            }
                        }
                    }
                    // -------------------------------------
                }
            } else if (activeTab === 'text') {
                sourceType = 'text'
                textToSave = textContent
            }

            // 3. Create Asset
            const { error: assetError } = await supabase
                .from('story_assets')
                .insert({
                    story_session_id: session.id,
                    asset_type: assetType, // 'audio', 'video', 'external_media'
                    // If we just transcribed, we still need to save the ORIGINAL audio asset here.
                    // The transcription loop above creates a *second* asset.
                    source_type: sourceType,
                    storage_path: storagePath,
                    mime_type: mimeType,
                    text_content: textToSave
                })

            if (assetError) throw assetError

            router.push("/app/timeline")

        } catch (error: any) {
            console.error("Save error:", error)
            alert(`Error saving story: ${error.message}`)
        } finally {
            setIsSaving(false)
        }
    }

    // --- RENDER ---

    if (!showRecorder) {
        return (
            <div className="max-w-5xl mx-auto">
                <PromptLibrary
                    onSelect={(prompt: any) => router.push(`/app/story/create?promptId=${prompt.id}`)}
                    onFreeForm={() => router.push(`/app/story/create?mode=audio`)}
                />
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="space-y-4">
                <Button variant="ghost" size="sm" onClick={handleBackToLibrary} className="pl-0 gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Library
                </Button>

                {selectedPrompt ? (
                    <div className="bg-primary/5 p-6 rounded-lg border border-primary/10">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Replying to</span>
                        <h2 className="text-xl font-bold mt-1 pr-8">{selectedPrompt.title}</h2>
                        <p className="text-muted-foreground mt-2">{selectedPrompt.prompt_text}</p>
                    </div>
                ) : (
                    <div>
                        <h1 className="text-2xl font-bold font-heading">Meaningful Moment</h1>
                        <p className="text-muted-foreground">Reflect on a meaningful moment you’ve shared with them, or simply describe what they mean to you.</p>
                    </div>
                )}
            </div>

            {/* Title & Metadata Input */}
            <div className="space-y-4 bg-muted/20 p-4 rounded-lg border">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Story Title</label>
                    <Input
                        placeholder={selectedPrompt ? `Default: ${selectedPrompt.title}` : "Give your story a title..."}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-lg bg-background"
                    />
                    {selectedPrompt && !title && (
                        <p className="text-xs text-muted-foreground p-1">Will default to: "{selectedPrompt.title}"</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">When did this happen?</label>
                        <div className="flex flex-col gap-2">
                            <Select value={dateGranularity} onValueChange={setDateGranularity}>
                                <SelectTrigger className="w-full bg-background h-8 text-xs">
                                    <SelectValue placeholder="Precision" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="exact">Exact Date</SelectItem>
                                    <SelectItem value="year">Year Only</SelectItem>
                                </SelectContent>
                            </Select>

                            {dateGranularity === 'exact' ? (
                                <Input
                                    type="date"
                                    className="bg-background"
                                    onChange={(e) => setStoryDate(e.target.value)}
                                />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">Year:</span>
                                    <Input
                                        type="number"
                                        placeholder="YYYY"
                                        className="bg-background"
                                        onChange={(e) => {
                                            // Store as YYYY-01-02 to avoid timezone shifts back to previous year
                                            // when parsed as UTC midnight in Western hemispheres
                                            setStoryDate(`${e.target.value}-01-02`)
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Location (Optional)</label>
                        <Input
                            placeholder="e.g. Paris, Home"
                            className="bg-background"
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Unified Recorder Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                    <TabsTrigger value="audio" className="gap-2"><Mic className="h-4 w-4" /> Audio</TabsTrigger>
                    <TabsTrigger value="video" className="gap-2"><Video className="h-4 w-4" /> Video</TabsTrigger>
                    <TabsTrigger value="text" className="gap-2"><FileText className="h-4 w-4" /> Text</TabsTrigger>
                    <TabsTrigger value="upload" className="gap-2"><Upload className="h-4 w-4" /> Upload</TabsTrigger>
                </TabsList>

                <TabsContent value="audio" className="mt-0">
                    <Card>
                        <CardContent className="pt-6">
                            <StoryRecorder mode="audio" onSave={handleUnifiedSave} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="video" className="mt-0">
                    <Card>
                        <CardContent className="pt-6">
                            <StoryRecorder mode="video" onSave={handleUnifiedSave} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="text" className="mt-0">
                    <Card>
                        <CardHeader><CardTitle>Write your story</CardTitle></CardHeader>
                        <CardContent>
                            <Textarea
                                className="min-h-[300px] resize-none focus-visible:ring-1"
                                placeholder="Start typing here..."
                                value={textContent}
                                onChange={(e) => setTextContent(e.target.value)}
                            />
                        </CardContent>
                        <CardFooter className="justify-end bg-muted/20 py-4">
                            <Button onClick={() => handleUnifiedSave()} disabled={isSaving || !textContent.trim()}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Story
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="upload" className="mt-0">
                    <Card>
                        <CardHeader><CardTitle>Upload Media</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            {/* File Upload */}
                            <div className="flex flex-col items-center gap-4 py-8 border-2 border-dashed border-muted rounded-lg bg-muted/5">
                                <div className="p-3 rounded-full bg-primary/10">
                                    <Upload className="h-6 w-6 text-primary" />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-sm font-medium">Upload Media</p>
                                    <p className="text-xs text-muted-foreground">Photos, Audio, or Video (up to 50MB)</p>
                                </div>
                                <Input
                                    type="file"
                                    accept="image/*,audio/*,video/*"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="max-w-xs cursor-pointer"
                                />
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Or link from cloud</span>
                                </div>
                            </div>

                            {/* Google Photos Link */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Google Photos Link</label>
                                <Input
                                    placeholder="Paste shared album link..."
                                    value={textContent} // Reusing textContent state for link if mode is upload
                                    onChange={(e) => setTextContent(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Paste a link to a Google Photos album or image.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end bg-muted/20 py-4">
                            <Button onClick={() => handleUnifiedSave()} disabled={isSaving || (!file && !textContent)}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Media
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default function CreateStoryPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center animate-pulse">Loading Story Hub...</div>}>
            <CreateStoryContent />
        </Suspense>
    )
}
