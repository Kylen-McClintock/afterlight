"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { StoryRecorder } from "@/components/story/StoryRecorder"
import { createClient } from "@/utils/supabase/client"
import { useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Upload, Loader2, Save } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

function CreateStoryContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    // Default to 'audio' if null, but safe cast.
    const modeParam = searchParams.get("mode")
    const mode = (modeParam === "video" || modeParam === "text" || modeParam === "upload")
        ? modeParam
        : "audio"

    const promptId = searchParams.get("promptId")

    const [title, setTitle] = useState("")
    const [textContent, setTextContent] = useState("")
    const [file, setFile] = useState<File | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Helper to get active circle (MVP: fetch first circle user is in)
    const getActiveCircleId = async (supabase: any, userId: string) => {
        const { data } = await supabase
            .from('circle_memberships')
            .select('circle_id')
            .eq('user_id', userId)
            .limit(1)
            .single()
        return data?.circle_id
    }

    const handleSaveMedia = async (blob: Blob) => {
        if (!title.trim()) {
            alert("Please give your story a title.")
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
            const { data: session, error: sessionError } = await supabase
                .from('story_sessions')
                .insert({
                    circle_id: circleId,
                    title: title,
                    storyteller_user_id: user.id,
                    prompt_request_id: promptId || null,
                    visibility: 'shared_with_circle'
                })
                .select()
                .single()

            if (sessionError) throw sessionError

            // 2. Upload File
            const ext = mode === 'video' ? 'webm' : 'webm' // MediaRecorder usually webm
            const fileName = `${session.id}/${Date.now()}.${ext}`
            const { error: uploadError } = await supabase.storage
                .from('stories')
                .upload(fileName, blob)

            if (uploadError) throw uploadError

            // 3. Create Asset
            const { error: assetError } = await supabase
                .from('story_assets')
                .insert({
                    story_session_id: session.id,
                    asset_type: mode, // 'audio' or 'video'
                    source_type: 'browser_recording',
                    storage_path: fileName,
                    mime_type: blob.type,
                    duration_seconds: null // Could calculate if we tracked it
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

    const handleSaveText = async () => {
        if (!title.trim() || !textContent.trim()) {
            alert("Please add a title and story text.")
            return
        }
        setIsSaving(true)
        const supabase = createClient()

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const circleId = await getActiveCircleId(supabase, user.id)
            if (!circleId) throw new Error("No circle found")

            // 1. Create Session
            const { data: session, error: sessionError } = await supabase
                .from('story_sessions')
                .insert({
                    circle_id: circleId,
                    title: title,
                    storyteller_user_id: user.id,
                    prompt_request_id: promptId || null
                })
                .select()
                .single()

            if (sessionError) throw sessionError

            // 2. Create Asset (Text)
            const { error: assetError } = await supabase
                .from('story_assets')
                .insert({
                    story_session_id: session.id,
                    asset_type: 'text',
                    source_type: 'text',
                    text_content: textContent
                })

            if (assetError) throw assetError

            router.push("/app/timeline")
        } catch (error: any) {
            console.error("Save error:", error)
            alert(`Error: ${error.message}`)
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveFile = async () => {
        if (!title.trim() || !file) {
            alert("Title and file are required.")
            return
        }
        setIsSaving(true)
        const supabase = createClient()

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const circleId = await getActiveCircleId(supabase, user.id)
            if (!circleId) throw new Error("No circle found")

            // 1. Create Session
            const { data: session, error: sessionError } = await supabase
                .from('story_sessions')
                .insert({
                    circle_id: circleId,
                    title: title,
                    storyteller_user_id: user.id,
                    prompt_request_id: promptId || null
                })
                .select()
                .single()

            if (sessionError) throw sessionError

            // 2. Upload
            const fileExt = file.name.split('.').pop()
            const fileName = `${session.id}/${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase.storage
                .from('stories')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            // 3. Asset
            const isVideo = file.type.startsWith('video')
            const type = isVideo ? 'video' : 'audio'

            const { error: assetError } = await supabase
                .from('story_assets')
                .insert({
                    story_session_id: session.id,
                    asset_type: type,
                    source_type: 'file_upload',
                    storage_path: fileName,
                    mime_type: file.type
                })

            if (assetError) throw assetError

            router.push("/app/timeline")
        } catch (error: any) {
            console.error("Save error:", error)
            alert(`Error: ${error.message}`)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-heading capitalize">
                        {mode === "upload" ? "Upload Media" :
                            mode === "text" ? "Write Story" :
                                `Record ${mode}`}
                    </h1>
                    <p className="text-muted-foreground">
                        {promptId ? "Answering prompt..." : "Share a memory or thought."}
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Story Title</label>
                <Input
                    placeholder="e.g. The time we went to..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>

            {/* Render based on mode */}
            {(mode === "audio" || mode === "video") && (
                <StoryRecorder mode={mode} onSave={handleSaveMedia} />
            )}

            {mode === "text" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Your Story</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            className="min-h-[300px]"
                            placeholder="Start writing..."
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                        />
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button onClick={handleSaveText} disabled={isSaving || !textContent.trim()}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Story
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {mode === "upload" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Select File</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-6 py-10 border-2 border-dashed m-6 rounded-lg">
                        <Upload className="h-12 w-12 text-muted-foreground" />
                        <div className="text-center space-y-2">
                            <p className="text-sm font-medium">Click to browse or drag and drop</p>
                            <p className="text-xs text-muted-foreground">Audio or Video files up to 50MB</p>
                        </div>
                        <Input
                            type="file"
                            accept="audio/*,video/*"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="max-w-xs"
                        />
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button onClick={handleSaveFile} disabled={isSaving || !file}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Upload
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    )
}

export default function CreateStoryPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <CreateStoryContent />
        </Suspense>
    )
}
