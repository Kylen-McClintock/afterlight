"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { Loader2, Plus, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

export function WeeklyPlanWidget() {
    const [plan, setPlan] = useState<any>(null)
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [toggling, setToggling] = useState<string | null>(null)
    const router = useRouter()

    const fetchPlan = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get active plan
        // For MVP, we just get the most recent active plan or create one if none exists?
        // Let's just get the latest plan created.
        let { data: currentPlan } = await supabase
            .from('weekly_plans')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (!currentPlan) {
            // Create a plan if none exists
            const { data: newPlan } = await supabase
                .from('weekly_plans')
                .insert({
                    user_id: user.id,
                    week_start_date: new Date().toISOString()
                })
                .select()
                .single()
            currentPlan = newPlan
        }

        setPlan(currentPlan)

        if (currentPlan) {
            const { data: planItems } = await supabase
                .from('weekly_plan_items')
                .select(`
                    *,
                    meditation:meditation_id(title, type),
                    prompt:prompt_id(title)
                `)
                .eq('plan_id', currentPlan.id)
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: true })

            setItems(planItems || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchPlan()
    }, [])

    const toggleItem = async (itemId: string, currentStatus: string) => {
        setToggling(itemId)
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'

        const supabase = createClient()
        await supabase
            .from('weekly_plan_items')
            .update({ status: newStatus })
            .eq('id', itemId)

        setItems(items.map(i => i.id === itemId ? { ...i, status: newStatus } : i))
        setToggling(null)
    }

    // Helper to render item title
    const renderItemTitle = (item: any) => {
        if (item.custom_text) return item.custom_text
        if (item.meditation) return `Meditation: ${item.meditation.title}`
        if (item.prompt) return `Story: ${item.prompt.title}`
        if (item.item_type === 'bucket_list') return "Work on Bucket List"
        return "Unknown Item"
    }

    // Helper to handle click action (e.g. go to meditation)
    const handleItemClick = (item: any) => {
        if (item.meditation_id) {
            // Open meditation modal or page? For now, we don't have a page.
            // Maybe just alert or router push if we had a page.
            // Let's assume we might have a route later.
            // For now, no-op or simple alert if it's not implemented.
            router.push(`/app/meditations/${item.meditation_id}`)
        } else if (item.prompt_id) {
            router.push(`/app/story/create?promptId=${item.prompt_id}`)
        }
    }

    const [newItemText, setNewItemText] = useState("")
    const [adding, setAdding] = useState(false)

    const addItem = async () => {
        if (!newItemText || !plan) return
        setAdding(true)

        const supabase = createClient()
        const { data, error } = await supabase
            .from('weekly_plan_items')
            .insert({
                plan_id: plan.id,
                item_type: 'custom',
                custom_text: newItemText,
                status: 'pending',
                sort_order: items.length
            })
            .select()
            .single()

        if (data) {
            setItems([...items, data])
            setNewItemText("")
        }
        setAdding(false)
    }

    const deleteItem = async (id: string) => {
        if (!confirm("Remove this item?")) return
        const supabase = createClient()
        await supabase.from('weekly_plan_items').delete().eq('id', id)
        setItems(items.filter(i => i.id !== id))
    }

    if (loading) {
        return (
            <Card className="h-full min-h-[200px] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </Card>
        )
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                    <span>Weekly Plan</span>
                    <Button variant="ghost" size="icon" onClick={fetchPlan} className="h-6 w-6">
                        <RefreshCw className="h-3 w-3" />
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto min-h-[100px]">
                    {items.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            <p>Your week is open.</p>
                            <p className="mt-1">Add meditations or goals below.</p>
                        </div>
                    ) : (
                        <ul className="space-y-3 pb-4">
                            {items.map(item => (
                                <li key={item.id} className="flex items-start gap-3 group">
                                    <Checkbox
                                        checked={item.status === 'completed'}
                                        onCheckedChange={() => toggleItem(item.id, item.status)}
                                        disabled={toggling === item.id}
                                        className="mt-1"
                                    />
                                    <div className={`flex-1 text-sm ${item.status === 'completed' ? 'text-muted-foreground line-through' : ''}`}>
                                        <span
                                            className={item.meditation_id || item.prompt_id ? "cursor-pointer hover:underline" : ""}
                                            onClick={() => handleItemClick(item)}
                                        >
                                            {renderItemTitle(item)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => deleteItem(item.id)}
                                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                                    >
                                        <div className="sr-only">Delete</div>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Add Item Input */}
                <div className="pt-4 mt-auto border-t flex gap-2">
                    <input
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        placeholder="Add a goal..."
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addItem()}
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={addItem} disabled={adding || !newItemText}>
                        {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
