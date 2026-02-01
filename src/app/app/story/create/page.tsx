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

    const [textContent, setTextContent] = useState("")
    const [file, setFile] = useState<File | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const handleSaveMedia = async (blob: Blob) => {
        // 1. Upload to Supabase Storage
        const supabase = createClient()
        const fileName = `${Date.now()}-${mode}.webm`

        // Mock upload for now
        await new Promise(resolve => setTimeout(resolve, 2000))
        console.log("Mock upload complete", blob.size)

        router.push("/app/timeline")
    }

    const handleSaveText = async () => {
        if (!textContent.trim()) return
        setIsSaving(true)
        // Mock save
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log("Mock text save", textContent)
        setIsSaving(false)
        router.push("/app/timeline")
    }

    const handleSaveFile = async () => {
        if (!file) return
        setIsSaving(true)
        // Mock upload
        await new Promise(resolve => setTimeout(resolve, 2000))
        console.log("Mock file upload", file.name)
        setIsSaving(false)
        router.push("/app/timeline")
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
