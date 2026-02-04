"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, Square, Play, RotateCcw, Save, Video, Loader2 } from "lucide-react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { createClient } from "@/utils/supabase/client"

interface StoryRecorderProps {
    mode: "audio" | "video"
    onSave: (blob: Blob, relationship_label?: string) => Promise<void>
}

export function StoryRecorder({ mode, onSave }: StoryRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [mediaBlob, setMediaBlob] = useState<Blob | null>(null)
    const [duration, setDuration] = useState(0)
    const [isSaving, setIsSaving] = useState(false)
    const [permissionError, setPermissionError] = useState<string | null>(null)

    // Relationship State
    const [relationships, setRelationships] = useState<any[]>([])
    const [relationshipLabel, setRelationshipLabel] = useState<string>("")
    const [showRelationshipSelector, setShowRelationshipSelector] = useState(false)

    useEffect(() => {
        const fetchRelationships = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('relationships').select('*').order('category')
            if (data) setRelationships(data)

            // Allow checking if this is a guest
            // Ideally we pass a 'isGuest' prop, but for now we can infer or fetch user state
            // Let's assume onSave might need it.
            // Actually, we can just always show it or show it if we detect no user?
            // The prompt "How do you know [User]?" implies this is for guests.
            // The recorder is used by everyone though.
            // Let's check auth state.
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setShowRelationshipSelector(true)
            }
        }
        fetchRelationships()
    }, [])

    // Group relationships by category
    const groupedRelationships = relationships.reduce((acc, rel) => {
        if (!acc[rel.category]) acc[rel.category] = []
        acc[rel.category].push(rel)
        return acc
    }, {} as Record<string, any[]>)


    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const videoPreviewRef = useRef<HTMLVideoElement | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const startRecording = async () => {
        try {
            const constraints = {
                audio: true,
                video: mode === "video"
            }

            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            streamRef.current = stream

            if (mode === "video" && videoPreviewRef.current) {
                videoPreviewRef.current.srcObject = stream
            }

            console.log("Stream tracks:", stream.getTracks())

            // Try to identify a supported mime type explicitly if possible, or fall back to default
            let options: MediaRecorderOptions = {}
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                options = { mimeType: 'audio/webm;codecs=opus' }
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                options = { mimeType: 'audio/mp4' }
            }
            // If neither, leave empty to let browser decide

            console.log("Initializing MediaRecorder with options:", options)
            const mediaRecorder = new MediaRecorder(stream, options)
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            mediaRecorder.onstop = () => {
                if (chunksRef.current.length === 0) {
                    console.error("No data chunks recorded!")
                    setPermissionError("Recording failed: No audio data collected. Please check permissions.")
                    return
                }
                // create blob with generic types first, or fallback
                // We won't specify type to Blob constructor to let it infer from chunks or just generic
                // Actually, for playback, we might need it. 
                // Let's try to detect valid type from the recorder itself if possible, or just default to webm which works in Chrome.
                // For Safari, it might need mp4.
                const mimeType = mediaRecorder.mimeType || (mode === 'video' ? 'video/webm' : 'audio/webm')
                const blob = new Blob(chunksRef.current, { type: mimeType })
                console.log("Recording finished. Blob size:", blob.size, "MIME:", mimeType)
                setMediaBlob(blob)
                stopStream()
            }

            // Start with timeslice (1000ms) to ensure chunks are fired periodically
            // This is often more robust for keeping the recorder 'alive' and ensuring data is captured on all browsers
            mediaRecorder.start(1000)
            setIsRecording(true)
            setIsPaused(false)
            setDuration(0)

            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1)
            }, 1000)

            setPermissionError(null)
        } catch (err) {
            console.error("Error accessing media devices:", err)
            setPermissionError("Could not access microphone or camera. Please check permissions.")
        }
    }

    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            setIsPaused(false)
            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }
        }
    }

    const resetRecording = () => {
        setMediaBlob(null)
        setDuration(0)
        setIsRecording(false)
        setIsPaused(false)
    }

    const handleSave = async () => {
        if (!mediaBlob) return
        setIsSaving(true)
        try {
            await onSave(mediaBlob, relationshipLabel)
        } finally {
            setIsSaving(false)
        }
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopStream()
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-center">
                    {isRecording ? "Recording..." : mediaBlob ? "Review" : `Record ${mode === "video" ? "Video" : "Audio"}`}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
                {/* Video Preview */}
                {mode === "video" && (
                    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                        {mediaBlob ? (
                            <video
                                src={URL.createObjectURL(mediaBlob)}
                                controls
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            // Live preview only when recording or initial state (if we want to show preview before starting)
                            // For now, show preview only when recording or about to record?
                            // It's better to show preview before recording starts so user can frame themselves.
                            // We need a helper to start stream preview separate from recording.
                            // For MVP simplicity: Show generic icon if not recording, or start stream on mount?
                            // Let's keep it simple: Show preview only when recording starts.
                            isRecording ? (
                                <video ref={videoPreviewRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-white/50">
                                    <Video className="h-12 w-12" />
                                </div>
                            )
                        )}
                    </div>
                )}

                {/* Audio Visualizer / Time */}
                <div className="text-4xl font-mono font-bold tabular-nums">
                    {formatTime(duration)}
                </div>

                {permissionError && (
                    <p className="text-red-500 text-sm text-center">{permissionError}</p>
                )}

            </CardContent>

            {showRelationshipSelector && mediaBlob && !isSaving && (
                <div className="px-6 pb-4 space-y-2 animate-in fade-in">
                    <Label className="text-center block text-muted-foreground">How do you know them?</Label>
                    <Select value={relationshipLabel} onValueChange={setRelationshipLabel}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select your relationship..." />
                        </SelectTrigger>
                        <SelectContent>
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
                            {/* Fallback generic options just in case */}
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            <CardFooter className="flex justify-center gap-4">
                {!isRecording && !mediaBlob && (
                    <Button size="lg" className="rounded-full h-16 w-16 p-0 bg-red-500 hover:bg-red-600" onClick={startRecording}>
                        <Mic className="h-6 w-6 text-white" /> {/* Or Video icon */}
                    </Button>
                )}

                {isRecording && (
                    <Button size="lg" variant="destructive" className="rounded-full h-16 w-16 p-0" onClick={stopRecording}>
                        <Square className="h-6 w-6 fill-current" />
                    </Button>
                )}

                {mediaBlob && !isSaving && (
                    <>
                        <Button variant="outline" onClick={resetRecording}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Retake
                        </Button>
                        <Button onClick={handleSave}>
                            <Save className="mr-2 h-4 w-4" />
                            Save Story
                        </Button>
                    </>
                )}

                {isSaving && (
                    <Button disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
