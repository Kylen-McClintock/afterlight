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
    const analyzerRef = useRef<AnalyserNode | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const [volumeLevel, setVolumeLevel] = useState(0)

    const startRecording = async () => {
        try {
            console.log("Requesting user media...")
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: mode === "video"
            })

            // Verify Tracks
            stream.getAudioTracks().forEach(track => {
                console.log(`Track: ${track.label}, Enabled: ${track.enabled}, Muted: ${track.muted}, State: ${track.readyState}`)
                if (!track.enabled || track.muted) {
                    alert("Warning: Microphone track is muted or disabled.")
                }
            })

            streamRef.current = stream

            if (mode === "video" && videoPreviewRef.current) {
                videoPreviewRef.current.srcObject = stream
            }

            // Web Audio API Analyzer (Visual Proof of Sound)
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            audioContextRef.current = audioContext
            const source = audioContext.createMediaStreamSource(stream)
            const analyzer = audioContext.createAnalyser()
            analyzer.fftSize = 256
            source.connect(analyzer)
            analyzerRef.current = analyzer

            // Determine MIME Type (Safest for Mac/Chrome mix)
            // Priority: audio/mp4 (best for Safari/Mac), then audio/webm (Chrome)
            const types = [
                "audio/mp4",
                "audio/webm;codecs=opus",
                "audio/webm",
                "audio/ogg"
            ]
            let selectedType = ""
            for (const t of types) {
                if (MediaRecorder.isTypeSupported(t)) {
                    selectedType = t
                    break
                }
            }
            if (!selectedType) selectedType = "audio/webm" // Fallback

            console.log("Starting MediaRecorder with type:", selectedType)
            setDebugInfo(`Init: ${selectedType}`)

            const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedType })
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
                const type = mediaRecorder.mimeType || selectedType
                const blob = new Blob(chunksRef.current, { type })
                console.log("Blob created:", blob.size, type)
                setDebugInfo(`Stopped. Size: ${blob.size} bytes. Type: ${type}`)

                if (blob.size < 1000) { // < 1KB is suspicious for any clip > 1sec
                    setPermissionError(`Warning: File too small (${blob.size}b). Mic likely blocked or silent.`)
                } else {
                    setMediaBlob(blob)
                }

                stopStream()
            }

            // Use timeslice to force periodic data output (fix for some Chrome silences)
            mediaRecorder.start(1000)
            setIsRecording(true)
            setIsPaused(false)
            setDuration(0)

            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1)
            }, 1000)

            setPermissionError(null)

            // Volume Meter Loop
            const checkVolume = () => {
                if (!analyzerRef.current || !isRecording) return
                const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount)
                analyzerRef.current.getByteFrequencyData(dataArray)
                const vol = dataArray.reduce((subject, a) => subject + a, 0) / dataArray.length
                setVolumeLevel(vol) // Update react state for UI meter
                if (isRecording) requestAnimationFrame(checkVolume)
            }
            // requestAnimationFrame(checkVolume) // Triggered via useEffect or just running it now?
            // Since isRecording state inside closure might be stale, use ref or rely on component re-render?
            // Let's use a separate useEffect for the analyzer loop to be safe.

        } catch (err: any) {
            console.error("Error accessing media devices:", err)
            setPermissionError(`Microphone Error: ${err.message || err.name}`)
        }
    }

    // Volume Loop Effect
    useEffect(() => {
        let animId: number
        const updateMeter = () => {
            if (isRecording && analyzerRef.current) {
                const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount)
                analyzerRef.current.getByteFrequencyData(dataArray)
                const vol = dataArray.reduce((s, a) => s + a, 0) / dataArray.length
                setVolumeLevel(vol)
                animId = requestAnimationFrame(updateMeter)
            }
        }
        if (isRecording) {
            updateMeter()
        } else {
            setVolumeLevel(0)
        }
        return () => cancelAnimationFrame(animId)
    }, [isRecording])


    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        if (audioContextRef.current) {
            audioContextRef.current.close()
            audioContextRef.current = null
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
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
                    {/* Volume Meter */}
                    {isRecording && (
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden mt-1">
                            <div
                                className="h-full bg-green-500 transition-all duration-75 ease-out"
                                style={{ width: `${Math.min(100, volumeLevel * 2)}%` }} // amplifying level for visibility
                            />
                        </div>
                    )}

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
