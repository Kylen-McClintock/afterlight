import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CardInteractionBar } from "@/components/shared/CardInteractionBar"

export function MeditationCard({ meditation, interaction, onUpdate }: { meditation: any, interaction?: any, onUpdate?: () => void }) {

    return (
        <Card className="group hover:border-primary/50 transition-all flex flex-col h-full relative">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-semibold line-clamp-1" title={meditation.title}>
                        {meditation.title}
                    </CardTitle>
                    {meditation.type === 'video' && <Play className="h-4 w-4 text-muted-foreground" />}
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
                <DialogContent className="sm:max-w-xl z-50 max-h-[85vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle>{meditation.title}</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6 pt-2">
                        <div className="space-y-6">
                            {meditation.type === 'wisdom' && meditation.metadata?.useful_thought && (
                                <div className="bg-primary/5 p-4 rounded-md border border-primary/10">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Useful Thought</span>
                                    <p className="text-lg font-medium text-primary italic">"{meditation.metadata.useful_thought}"</p>
                                </div>
                            )}

                            <div className="text-base leading-relaxed text-muted-foreground">
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
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <CardFooter className="pt-0 border-t p-3 flex justify-between bg-muted/5 z-20 relative">
                {/* Condensed Bar for Card View */}
                <div className="w-full flex justify-between items-center">
                    <div className="flex-1">
                        <CardInteractionBar
                            itemId={meditation.id}
                            itemType="meditation"
                            interaction={interaction}
                            onUpdate={onUpdate}
                            variant="condensed"
                        />
                    </div>

                    {meditation.type === 'video' && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="default" size="sm" className="text-xs h-7 px-2 ml-2 bg-red-600 hover:bg-red-700 text-white click-stop-propagation" onClick={e => e.stopPropagation()}>
                                    <Play className="h-3 w-3 mr-1" /> Watch
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-3xl">
                                <DialogHeader>
                                    <DialogTitle>{meditation.title}</DialogTitle>
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
                </div>
            </CardFooter>
        </Card>
    )
}
