"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, Play, RotateCcw, Save, Loader2, Trash2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface NoteRecorderProps {
    onSave: (blob: Blob, duration: number) => void
    initialAudioUrl?: string | null
    onDelete?: () => void
}

export function NoteRecorder({ onSave, initialAudioUrl, onDelete }: NoteRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [mediaBlob, setMediaBlob] = useState<Blob | null>(null)
    const [duration, setDuration] = useState(0)
    const [volumeLevel, setVolumeLevel] = useState(0)
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")
    const [error, setError] = useState<string | null>(null)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const analyzerRef = useRef<AnalyserNode | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)

    // Fetch Devices
    useEffect(() => {
        const getDevices = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices()
                let inputs = devices
                    .filter(d => d.kind === 'audioinput')

                // Smart Filtering: Remove virtual/teams devices
                inputs = inputs.filter(d => {
                    const label = d.label.toLowerCase()
                    return !label.includes('virtual') && !label.includes('teams') && !label.includes('stereo mix')
                })

                // Smart Sorting: Default/Built-in first
                inputs.sort((a, b) => {
                    const aLabel = a.label.toLowerCase()
                    const bLabel = b.label.toLowerCase()
                    if (aLabel.includes('default')) return -1
                    if (bLabel.includes('default')) return 1
                    if (aLabel.includes('built-in')) return -1
                    if (bLabel.includes('built-in')) return 1
                    return 0
                })

                setAudioDevices(inputs)
                // Set default if available and not set
                if (inputs.length > 0) {
                    setSelectedDeviceId(prev => prev || inputs[0].deviceId)
                }
            } catch (err) {
                console.error("Device fetch error:", err)
            }
        }
        getDevices()
    }, [])

    const startRecording = async () => {
        try {
            setError(null)
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true
            })

            // Setup Analyzer
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            if (audioContext.state === 'suspended') await audioContext.resume()
            audioContextRef.current = audioContext
            const source = audioContext.createMediaStreamSource(stream)
            const analyzer = audioContext.createAnalyser()
            analyzer.fftSize = 256
            source.connect(analyzer)
            analyzerRef.current = analyzer

            streamRef.current = stream

            // MimeType Selection
            const types = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"]
            const selectedType = types.find(t => MediaRecorder.isTypeSupported(t)) || ""

            const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedType })
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            mediaRecorder.onstop = () => {
                const type = mediaRecorder.mimeType || selectedType
                const blob = new Blob(chunksRef.current, { type })
                setMediaBlob(blob)
                onSave(blob, duration)
                stopStream()
            }

            mediaRecorder.start(1000) // timeslice
            setIsRecording(true)
            setDuration(0)

            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1)
            }, 1000)

            requestAnimationFrame(updateVolume)

        } catch (err: any) {
            console.error("Recording error:", err)
            setError(err.message || "Could not access microphone.")
        }
    }

    const updateVolume = () => {
        if (!isRecording || !analyzerRef.current) return
        const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount)
        analyzerRef.current.getByteFrequencyData(dataArray)
        const vol = dataArray.reduce((subject, a) => subject + a, 0) / dataArray.length
        setVolumeLevel(vol)
        requestAnimationFrame(updateVolume)
    }

    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop())
            streamRef.current = null
        }
        if (audioContextRef.current) {
            audioContextRef.current.close()
            audioContextRef.current = null
        }
        setVolumeLevel(0)
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }

    const reset = () => {
        setMediaBlob(null)
        setDuration(0)
        setIsRecording(false)
    }

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60)
        const sec = s % 60
        return `${m}:${sec.toString().padStart(2, '0')}`
    }

    return (
        <div className="space-y-4">
            {/* Mic Select - Only show when NOT recording and NO blob */}
            {/* Wrapped in a div with explicit z-index to stay above other elements if menu opens */}
            {!isRecording && !mediaBlob && !initialAudioUrl && audioDevices.length > 0 && (
                <div className="relative z-20">
                    <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                        <SelectTrigger className="w-full text-xs h-8">
                            <SelectValue placeholder="Select Microphone" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] z-50">
                            {audioDevices.map(d => (
                                <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || "External Mic"}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="flex flex-col items-center justify-center p-6 bg-muted/20 rounded-lg border border-dashed relative min-h-[140px] z-10">
                {/* Timer / Status */}
                <div className={`text-3xl font-mono mb-4 transition-colors ${isRecording ? "text-red-500 font-bold" : "text-foreground/50"}`}>
                    {formatTime(duration)}
                </div>

                {/* Visualizer Bar */}
                {isRecording && (
                    <div className="w-48 h-2 bg-muted rounded-full overflow-hidden mb-6">
                        <div className="h-full bg-red-500 transition-all duration-75 ease-out" style={{ width: `${Math.min(100, volumeLevel * 2.5)}%` }} />
                    </div>
                )}

                {/* Controls */}
                <div className="flex items-center gap-4 z-10">
                    {!isRecording && !mediaBlob && !initialAudioUrl && (
                        <div className="flex flex-col items-center gap-2">
                            <Button
                                variant="destructive" size="icon" className="rounded-full h-14 w-14 shadow-lg hover:scale-105 transition-transform"
                                onClick={startRecording}
                            >
                                <Mic className="h-6 w-6" />
                            </Button>
                            <span className="text-xs text-muted-foreground">Tap to Record</span>
                        </div>
                    )}

                    {isRecording && (
                        <Button
                            variant="outline" size="icon" className="rounded-full h-14 w-14 border-red-500 text-red-500 hover:bg-red-50 animate-pulse"
                            onClick={stopRecording}
                        >
                            <Square className="h-6 w-6 fill-current" />
                        </Button>
                    )}

                    {(mediaBlob || initialAudioUrl) && (
                        <div className="flex flex-col items-center w-full gap-3 animate-in fade-in zoom-in">
                            <audio controls src={mediaBlob ? URL.createObjectURL(mediaBlob) : initialAudioUrl || undefined} className="h-10 w-full max-w-[260px] shadow-sm rounded-full" />
                            <div className="flex gap-2">
                                {!initialAudioUrl && (
                                    <Button variant="outline" size="sm" onClick={reset} className="text-xs">
                                        <RotateCcw className="h-3 w-3 mr-1" /> Retake
                                    </Button>
                                )}
                                {initialAudioUrl && onDelete && (
                                    <Button variant="ghost" size="sm" onClick={onDelete} className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50">
                                        <Trash2 className="h-3 w-3 mr-1" /> Delete Recording
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {error && <p className="text-xs text-red-500 mt-4 bg-red-50 px-2 py-1 rounded">{error}</p>}
            </div>
        </div>
    )
}
