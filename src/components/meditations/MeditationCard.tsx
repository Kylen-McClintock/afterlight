"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { Play, Plus, Check, Loader2, BookOpen } from "lucide-react"
import { useRouter } from "next/navigation"

interface MeditationCardProps {
    meditation: any
    onAdded?: () => void
}

export function MeditationCard({ meditation, onAdded }: MeditationCardProps) {
    const [adding, setAdding] = useState(false)
    const [added, setAdded] = useState(false)
    const router = useRouter()

    const handleAddToPlan = async () => {
        setAdding(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Get/Create Plan (Simulated helper logic basically)
        let { data: currentPlan } = await supabase
            .from('weekly_plans')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .limit(1)
            .single()

        if (!currentPlan) {
            const { data: newPlan } = await supabase
                .from('weekly_plans')
                .insert({ user_id: user.id, week_start_date: new Date().toISOString() })
                .select()
                .single()
            currentPlan = newPlan
        }

        if (!currentPlan) {
            console.error("Failed to create plan")
            setAdding(false)
            return
        }

        // 2. Add Item
        await supabase.from('weekly_plan_items').insert({
            plan_id: currentPlan.id,
            item_type: 'meditation',
            meditation_id: meditation.id
        })

        setAdding(false)
        setAdded(true)
        if (onAdded) onAdded()

        // Reset checkmark after 2s
        setTimeout(() => setAdded(false), 2000)
    }

    const handleStart = () => {
        // Navigate to detail page
        router.push(`/app/meditations/${meditation.id}`)
    }

    return (
        <Card className="flex flex-col h-full hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight line-clamp-2">
                        {meditation.title}
                    </CardTitle>
                    {meditation.type === 'video' ? (
                        <Play className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                        <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
                <p className="text-xs text-muted-foreground line-clamp-3 mb-2">
                    {meditation.description}
                </p>
                <div className="flex gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    <span className="bg-secondary/30 px-1.5 py-0.5 rounded">{meditation.duration_mins} min</span>
                    <span className="bg-secondary/30 px-1.5 py-0.5 rounded">{meditation.category}</span>
                </div>
            </CardContent>
            <CardFooter className="pt-0 gap-2">
                <Button variant="default" size="sm" className="w-full text-xs" onClick={handleStart}>
                    Start
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 w-8 h-8"
                    onClick={handleAddToPlan}
                    disabled={adding || added}
                >
                    {adding ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : added ? (
                        <Check className="h-3 w-3 text-green-600" />
                    ) : (
                        <Plus className="h-3 w-3" />
                    )}
                </Button>
            </CardFooter>
        </Card>
    )
}
