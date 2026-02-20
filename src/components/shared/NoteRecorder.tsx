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

    // Fetch Audio Devices
    useEffect(() => {
        const getDevices = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices()
                let inputs = devices.filter(d => d.kind === 'audioinput')

                // Prioritize default, remove virtual/teams if possible
                const defaultDevice = inputs.find(d => d.deviceId === 'default')
                if (defaultDevice) {
                    // Move default to front or just set it
                    setSelectedDeviceId(defaultDevice.deviceId)
                } else {
                    const preferred = inputs.find(d => !d.label.toLowerCase().includes('virtual') && !d.label.toLowerCase().includes('teams'))
                    if (inputs.length > 0) setSelectedDeviceId(preferred ? preferred.deviceId : inputs[0].deviceId)
                }

                setAudioDevices(inputs)
            } catch (err) {
                console.error("Device fetch error:", err)
            }
        }
        getDevices()
    }, [])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const startRecording = async () => {
        setError(null)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true
            })

            streamRef.current = stream
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
            audioContextRef.current = audioCtx
            const analyser = audioCtx.createAnalyser()
            analyzerRef.current = analyser
            const source = audioCtx.createMediaStreamSource(stream)
            source.connect(analyser)
            analyser.fftSize = 256
            const dataArray = new Uint8Array(analyser.frequencyBinCount)

            const updateVolume = () => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                    analyser.getByteFrequencyData(dataArray)
                    const avg = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length
                    setVolumeLevel(avg)
                    requestAnimationFrame(updateVolume)
                }
            }

            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                setMediaBlob(blob)
                onSave(blob, duration)
            }

            mediaRecorder.start(100)
            setIsRecording(true)
            updateVolume()

            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1)
            }, 1000)

        } catch (err: any) {
            console.error("Recording error:", err)
            setError(err.message || "Failed to start recording")
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
        if (timerRef.current) clearInterval(timerRef.current)
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop())
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close()
        }
    }

    const reset = () => {
        setMediaBlob(null)
        setDuration(0)
        setVolumeLevel(0)
        chunksRef.current = []
    }

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
            if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop())
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close()
            }
        }
    }, [])

    return (
        <div className="space-y-4">
            {/* Mic Select - Only show when NOT recording and NO blob */}
            {/* Wrapped in a div with explicit z-index to stay above other elements if menu opens */}
            {!isRecording && !mediaBlob && !initialAudioUrl && audioDevices.length > 0 && (
                <div className="relative z-20 mb-8 w-full max-w-[240px] mx-auto">
                    <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                        <SelectTrigger className="w-full text-xs h-8 bg-background/80 backdrop-blur">
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
