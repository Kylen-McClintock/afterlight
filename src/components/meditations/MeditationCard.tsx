"use client" // Add use client directive

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Sparkles, Music, ExternalLink } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CardInteractionBar } from "@/components/shared/CardInteractionBar"

export function MeditationCard({ meditation, interaction, onUpdate }: { meditation: any, interaction?: any, onUpdate?: () => void }) {
    const [userId, setUserId] = useState<string | null>(null)

    // Check for user ownership
    useState(() => {
        const checkUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setUserId(user.id)
        }
        checkUser()
    })

    const handleDelete = async () => {
        const supabase = createClient()
        // Soft Delete
        const { error } = await supabase
            .from('library_meditations')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', meditation.id)

        if (error) {
            alert("Failed to delete: " + error.message)
        } else {
            if (onUpdate) onUpdate() // Refresh list
        }
    }

    const isPrimaryUser = userId && meditation.circle?.primary_user_id === userId

    return (
        <Card className="group hover:border-primary/50 transition-all flex flex-col h-full relative">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-semibold line-clamp-1" title={meditation.title}>
                        {meditation.title}
                    </CardTitle>
                    {meditation.type === 'video' && <Play className="h-4 w-4 text-muted-foreground" />}
                    {meditation.type === 'song' && <Music className="h-4 w-4 text-muted-foreground" />}
                </div>
                <CardDescription className="flex items-center gap-2 text-xs">
                    <span className="bg-secondary px-2 py-0.5 rounded-full">{meditation.duration_mins} min</span>
                    <span className="capitalize">{meditation.category}</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-3">
                {meditation.type === 'wisdom' && meditation.metadata?.useful_thought ? (
                    <div className="space-y-4">
                        <div className="bg-primary/5 p-3 rounded-md border border-primary/10">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Useful Thought</span>
                            <p className="font-medium text-primary text-sm italic">"{meditation.metadata.useful_thought}"</p>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                            {meditation.description}
                        </p>
                    </div>
                ) : meditation.type === 'poem' ? (
                    <div className="space-y-2">
                        {meditation.metadata?.author && (
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{meditation.metadata.author}</p>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-4 italic">
                            {meditation.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            <span className="font-semibold">Why:</span> {meditation.description}
                        </p>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {meditation.description || meditation.content || "No description."}
                    </p>
                )}
            </CardContent>

            {/* Click to Expand Trigger */}
            <Dialog>
                <DialogTrigger asChild>
                    <button className="absolute inset-0 w-full h-full cursor-pointer z-0 opacity-0" aria-label="Expand card">
                        <span className="sr-only">Expand</span>
                    </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl max-w-[calc(100vw-2rem)] w-full mx-auto z-50 max-h-[85vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-6 pb-2 min-w-0">
                        <DialogTitle className="break-words">{meditation.title}</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6 pt-3 min-w-0">
                        <div className="space-y-6 min-w-0">
                            {meditation.type === 'wisdom' && meditation.metadata?.useful_thought && (
                                <div className="bg-primary/5 p-4 rounded-md border border-primary/10 min-w-0">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Useful Thought</span>
                                    <p className="text-lg font-medium text-primary italic break-words">"{meditation.metadata.useful_thought}"</p>
                                </div>
                            )}

                            <div className="text-base leading-relaxed text-muted-foreground break-words">
                                {meditation.description}
                            </div>

                            {/* Evidence Link */}
                            {meditation.type === 'wisdom' && meditation.metadata?.evidence_url && (
                                <div className="pt-4 border-t">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Scientific Evidence</span>
                                    <a
                                        href={meditation.metadata.evidence_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary hover:underline flex items-center gap-2"
                                    >
                                        <Sparkles className="h-4 w-4" />
                                        {meditation.metadata.evidence_title || "View Research Source"}
                                    </a>
                                </div>
                            )}

                            {(meditation.content && (meditation.type === 'text' || meditation.type === 'poem')) && (
                                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                                    {meditation.content}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Full Interactions in Fixed Footer */}
                    <div className="p-6 pt-4 border-t bg-background z-10">
                        <CardInteractionBar
                            itemId={meditation.id}
                            itemType="meditation"
                            interaction={interaction}
                            onUpdate={onUpdate}
                            variant="full"
                            onDelete={isPrimaryUser ? handleDelete : undefined}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <CardFooter className="pt-0 border-t p-3 flex justify-between bg-muted/5 z-20 relative overflow-hidden">
                {/* Condensed Bar for Card View */}
                <div className="w-full flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-2 min-w-0">
                    <div className="w-full sm:flex-1 min-w-[120px] sm:min-w-[200px] overflow-hidden">
                        <CardInteractionBar
                            itemId={meditation.id}
                            itemType="meditation"
                            interaction={interaction}
                            onUpdate={onUpdate}
                            variant="condensed"
                            onDelete={isPrimaryUser ? handleDelete : undefined}
                        />
                    </div>

                    {meditation.type === 'video' && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="default" size="sm" className="w-full sm:w-auto text-xs h-7 px-2 shrink-0 bg-red-600 hover:bg-red-700 text-white click-stop-propagation" onClick={e => e.stopPropagation()}>
                                    <Play className="h-3 w-3 mr-1" /> Watch
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-3xl max-w-[calc(100vw-2rem)] w-full mx-auto overflow-hidden p-4 sm:p-6 flex flex-col gap-4">
                                <DialogHeader className="min-w-0">
                                    <DialogTitle className="break-words">{meditation.title}</DialogTitle>
                                </DialogHeader>
                                <div className="aspect-video w-full bg-black rounded-md overflow-hidden">
                                    <iframe
                                        src={meditation.content}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}

                    {meditation.type === 'song' && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="default" size="sm" className="text-xs h-7 px-3 shrink-0 bg-green-600 hover:bg-green-700 text-white click-stop-propagation" onClick={e => e.stopPropagation()}>
                                    <Music className="h-3 w-3 sm:mr-1" /> <span className="hidden sm:inline">Listen</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl max-w-[calc(100vw-2rem)] w-full mx-auto overflow-hidden p-4 sm:p-6 flex flex-col gap-4">
                                <DialogHeader className="min-w-0">
                                    <DialogTitle className="break-words">{meditation.title}</DialogTitle>
                                </DialogHeader>
                                <div className="w-full rounded-md overflow-hidden min-h-[352px]">
                                    {meditation.content.includes('spotify.com') ? (
                                        <iframe
                                            style={{ borderRadius: '12px' }}
                                            src={meditation.content.replace('/track/', '/embed/track/').replace('/playlist/', '/embed/playlist/').replace('/album/', '/embed/album/')}
                                            width="100%"
                                            height="352"
                                            frameBorder="0"
                                            allowFullScreen
                                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-8 bg-muted/20 text-center gap-4 border rounded-md">
                                            <p className="text-sm text-muted-foreground">This song format is not natively embedded.</p>
                                            <a href={meditation.content} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium flex items-center gap-1">
                                                Open Link <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </CardFooter>
        </Card>
    )
}
