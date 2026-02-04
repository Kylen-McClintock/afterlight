"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Star, Plus, MessageSquare, Loader2, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function MeditationCard({ meditation, interaction, onUpdate }: { meditation: any, interaction?: any, onUpdate?: () => void }) {
    const [loading, setLoading] = useState(false)
    const [showNotes, setShowNotes] = useState(false)
    const [notes, setNotes] = useState(interaction?.notes || "")

    const handleRating = async (rating: number) => {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Upsert interaction
        const { error } = await supabase
            .from('meditation_interactions')
            .upsert({
                user_id: user.id,
                meditation_id: meditation.id,
                rating: rating,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,meditation_id' })

        if (!error && onUpdate) onUpdate()
        setLoading(false)
    }

    const saveNotes = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('meditation_interactions')
            .upsert({
                user_id: user.id,
                meditation_id: meditation.id,
                notes: notes,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,meditation_id' })

        if (!error) {
            setShowNotes(false)
            if (onUpdate) onUpdate()
        }
        setLoading(false)
    }

    const addToPlan = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // Find active plan
        const { data: plan } = await supabase
            .from('weekly_plans')
            .select('id')
            .eq('user_id', user?.id)
            .eq('is_active', true)
            .limit(1)
            .single()

        if (plan) {
            await supabase.from('weekly_plan_items').insert({
                plan_id: plan.id,
                item_type: 'meditation',
                meditation_id: meditation.id,
                status: 'pending'
            })
            alert("Added to your weekly plan!")
        } else {
            alert("No active weekly plan found.")
        }
        setLoading(false)
    }

    const currentRating = interaction?.rating || 0

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

                {/* Rating Section */}
                <div className="flex items-center gap-1 mt-auto pt-4 relative z-20" onClick={(e) => e.stopPropagation()}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            disabled={loading}
                            onClick={() => handleRating(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                            title="Rate usefulness"
                        >
                            <Star
                                className={cn(
                                    "h-4 w-4",
                                    star <= currentRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30 hover:text-yellow-400"
                                )}
                            />
                        </button>
                    ))}
                    <span className="text-[10px] text-muted-foreground ml-2">
                        {currentRating > 0 ? "Rated" : "Rate"}
                    </span>
                </div>
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

                            {/* Evidence Link - Only in expanded view */}
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

                    {/* Interactions in Fixed Footer */}
                    <div className="p-6 pt-4 border-t bg-background z-10">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            disabled={loading}
                                            onClick={() => handleRating(star)}
                                            className="focus:outline-none transition-transform hover:scale-110"
                                            title="Rate usefulness"
                                        >
                                            <Star
                                                className={cn(
                                                    "h-5 w-5",
                                                    star <= currentRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30 hover:text-yellow-400"
                                                )}
                                            />
                                        </button>
                                    ))}
                                    <span className="text-xs text-muted-foreground ml-2">
                                        {currentRating > 0 ? "Rated" : "Rate Usefulness"}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowNotes(true)}>
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    {interaction?.notes ? "View/Edit Notes" : "Add Note"}
                                </Button>
                                <Button variant="default" size="sm" className="flex-1" onClick={addToPlan} disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                    Add to Plan
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <CardFooter className="pt-0 border-t p-3 flex justify-between bg-muted/5 z-20 relative">
                <Dialog open={showNotes} onOpenChange={setShowNotes}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {interaction?.notes ? "View Notes" : "Add Note"}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Private Notes</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <p className="text-xs text-muted-foreground">Add private notes about your experience with this meditation.</p>
                            <div className="space-y-2">
                                <Label>Your Reflection</Label>
                                <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="How did this make you feel? Key takeaways?"
                                    className="min-h-[150px]"
                                />
                            </div>
                            <Button onClick={saveNotes} disabled={loading}>Save Note</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={addToPlan} disabled={loading}>
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                    Add to Plan
                </Button>

                {meditation.type === 'video' && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="default" size="sm" className="text-xs h-7 px-2 ml-2 bg-red-600 hover:bg-red-700 text-white">
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
            </CardFooter>
        </Card>
    )
}
