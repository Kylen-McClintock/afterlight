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
                const inputs = devices.filter(d => d.kind === 'audioinput')
                setAudioDevices(inputs)
                if (inputs.length > 0 && !selectedDeviceId) {
                    setSelectedDeviceId(inputs[0].deviceId)
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
            setError("Could not access microphone.")
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
            {/* Mic Select */}
            {!isRecording && !mediaBlob && !initialAudioUrl && audioDevices.length > 0 && (
                <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                    <SelectTrigger className="w-full text-xs">
                        <SelectValue placeholder="Select Microphone" />
                    </SelectTrigger>
                    <SelectContent>
                        {audioDevices.map(d => (
                            <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || "External Mic"}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            <div className="flex flex-col items-center justify-center p-4 bg-muted/20 rounded-lg border border-dashed">
                {/* Timer / Status */}
                <div className={`text-2xl font-mono mb-2 ${isRecording ? "text-red-500 animate-pulse" : ""}`}>
                    {formatTime(duration)}
                </div>

                {/* Visualizer Bar */}
                {isRecording && (
                    <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden mb-4">
                        <div className="h-full bg-green-500 transition-all" style={{ width: `${Math.min(100, volumeLevel * 2)}%` }} />
                    </div>
                )}

                {/* Controls */}
                <div className="flex items-center gap-4">
                    {!isRecording && !mediaBlob && !initialAudioUrl && (
                        <Button
                            variant="destructive" size="icon" className="rounded-full h-12 w-12"
                            onClick={startRecording}
                        >
                            <Mic className="h-5 w-5" />
                        </Button>
                    )}

                    {isRecording && (
                        <Button
                            variant="outline" size="icon" className="rounded-full h-12 w-12 border-red-500 text-red-500 hover:bg-red-50"
                            onClick={stopRecording}
                        >
                            <Square className="h-5 w-5 fill-current" />
                        </Button>
                    )}

                    {(mediaBlob || initialAudioUrl) && (
                        <div className="flex flex-col items-center w-full gap-2">
                            <audio controls src={mediaBlob ? URL.createObjectURL(mediaBlob) : initialAudioUrl || undefined} className="h-8 w-full max-w-[240px]" />
                            {!initialAudioUrl && (
                                <Button variant="ghost" size="sm" onClick={reset} className="text-xs text-muted-foreground">
                                    <RotateCcw className="h-3 w-3 mr-1" /> Retake
                                </Button>
                            )}
                            {initialAudioUrl && onDelete && (
                                <Button variant="ghost" size="sm" onClick={onDelete} className="text-xs text-red-500 hover:text-red-600">
                                    <Trash2 className="h-3 w-3 mr-1" /> Delete Recording
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            </div>
        </div>
    )
}
