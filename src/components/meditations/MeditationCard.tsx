"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Star, Plus, MessageSquare, Loader2 } from "lucide-react"
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
        <Card className="group hover:border-primary/50 transition-all flex flex-col h-full">
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
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {meditation.description || meditation.content || "No description."}
                </p>

                {/* Rating Section */}
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            disabled={loading}
                            onClick={() => handleRating(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                            title="Rate usefulness: This helps surface the most impactful meditations for you."
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
                        {currentRating > 0 ? "Rated" : "Rate Usefulness"}
                    </span>
                </div>
            </CardContent>
            <CardFooter className="pt-0 border-t p-3 flex justify-between bg-muted/5">
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
