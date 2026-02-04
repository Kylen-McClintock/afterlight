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
    const [debugInfo, setDebugInfo] = useState<string>("")

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
            if (!user) setShowRelationshipSelector(true)
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
            console.log("Requesting user media...")
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: mode === "video"
            })

            streamRef.current = stream

            if (mode === "video" && videoPreviewRef.current) {
                videoPreviewRef.current.srcObject = stream
            }

            // NUCLEAR OPTION: Default to browser standard. No custom MIME options.
            // Chrome/Mac works best with default or explicit audio/webm
            let options: MediaRecorderOptions | undefined = undefined;
            if (MediaRecorder.isTypeSupported("audio/webm")) {
                options = { mimeType: "audio/webm" }
            }

            console.log("Starting MediaRecorder with options:", options)
            setDebugInfo(`Init: ${options?.mimeType || 'default'} | Tracks: ${stream.getAudioTracks().length}`)

            const mediaRecorder = new MediaRecorder(stream, options)
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    chunksRef.current.push(e.data)
                    setDebugInfo(prev => prev + ` .`)
                }
            }

            mediaRecorder.onstop = () => {
                console.log("Recorder stopped. Chunks:", chunksRef.current.length)
                const type = mediaRecorder.mimeType || (mode === 'video' ? 'video/webm' : 'audio/webm')
                const blob = new Blob(chunksRef.current, { type })
                console.log("Blob created:", blob.size, type)
                setDebugInfo(`Stopped. Size: ${blob.size} bytes. Type: ${type}`)

                if (blob.size === 0) {
                    setPermissionError("Error: 0-byte recording. Please check microphone.")
                } else {
                    setMediaBlob(blob)
                }

                stopStream()
            }

            // Start normally. No timeslice for max compatibility with default blobs.
            mediaRecorder.start()
            setIsRecording(true)
            setIsPaused(false)
            setDuration(0)

            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1)
            }, 1000)

            setPermissionError(null)
        } catch (err: any) {
            console.error("Error accessing media devices:", err)
            setPermissionError(`Microphone Error: ${err.message || err.name}`)
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
        setDebugInfo("")
    }

    const handleSave = async () => {
        if (!mediaBlob) return
        setIsSaving(true)
        try {
            await onSave(mediaBlob, relationshipLabel)
        } catch (e: any) {
            alert(`Save Error: ${e.message}`)
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
        <Card className="w-full max-w-md mx-auto border-none shadow-none">
            <CardHeader className="p-4 pb-0">
                <CardTitle className="text-center text-lg">
                    {isRecording ? "Recording..." : mediaBlob ? "Ready to Save" : `Record ${mode === "video" ? "Video" : "Audio"}`}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 p-6">
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
                <div className="relative flex flex-col items-center">
                    <div className={`text-5xl font-mono font-bold tabular-nums tracking-wider ${isRecording ? "text-red-500 animate-pulse" : "text-foreground"}`}>
                        {formatTime(duration)}
                    </div>
                    {/* Debug Info */}
                    <div className="text-[10px] text-muted-foreground mt-2 max-w-[200px] text-center font-mono break-all opacity-70">
                        {debugInfo}
                    </div>
                </div>

                {permissionError && (
                    <div className="bg-red-50 text-red-600 px-3 py-2 rounded-md text-xs text-center border border-red-100">
                        {permissionError}
                    </div>
                )}

            </CardContent>

            {showRelationshipSelector && mediaBlob && !isSaving && (
                <div className="px-6 pb-4 space-y-2 animate-in fade-in slide-in-from-bottom-2">
                    <Label className="text-center block text-muted-foreground text-xs uppercase tracking-wide">Relationship</Label>
                    <Select value={relationshipLabel} onValueChange={setRelationshipLabel}>
                        <SelectTrigger>
                            <SelectValue placeholder="How do you know them?" />
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
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            <CardFooter className="flex justify-center gap-6 pb-6">
                {!isRecording && !mediaBlob && (
                    <Button
                        size="lg"
                        className="rounded-full h-16 w-16 p-0 bg-red-500 hover:bg-red-600 shadow-lg hover:scale-105 transition-all"
                        onClick={startRecording}
                    >
                        <Mic className="h-7 w-7 text-white" />
                    </Button>
                )}

                {isRecording && (
                    <Button
                        size="lg"
                        variant="destructive"
                        className="rounded-full h-16 w-16 p-0 shadow-lg hover:scale-105 transition-all animate-in zoom-in"
                        onClick={stopRecording}
                    >
                        <Square className="h-6 w-6 fill-current" />
                    </Button>
                )}

                {mediaBlob && !isSaving && (
                    <>
                        <Button variant="outline" size="lg" className="rounded-full px-6" onClick={resetRecording}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Retake
                        </Button>
                        <Button size="lg" className="rounded-full px-8 bg-green-600 hover:bg-green-700 text-white" onClick={handleSave}>
                            <Save className="mr-2 h-4 w-4" />
                            Save
                        </Button>
                    </>
                )}

                {isSaving && (
                    <Button disabled size="lg" className="rounded-full px-8">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
