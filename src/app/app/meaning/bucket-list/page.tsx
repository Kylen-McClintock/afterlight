"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Check, Trash2, Edit2, ChevronDown, ChevronUp, Save, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

interface BucketItem {
    id: string
    title: string
    tiny_version: string
    full_version: string
    why_it_matters: string
    effort_level: number // 1-3
    is_completed: boolean
}

export default function BucketListPage() {
    const [items, setItems] = useState<BucketItem[]>([])
    const [isAdding, setIsAdding] = useState(false)
    const [newItem, setNewItem] = useState({
        title: "", tiny_version: "", full_version: "", why_it_matters: "", effort_level: 1
    })
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [circleId, setCircleId] = useState<string | null>(null)

    const supabase = createClient()

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                // Get circle (reusing this logic, should extract to hook later)
                const { data: membership } = await supabase
                    .from('circle_memberships')
                    .select('circle_id')
                    .eq('user_id', user.id)
                    .limit(1)
                    .single()

                if (membership) {
                    setCircleId(membership.circle_id)
                    const { data } = await supabase
                        .from('bucket_list_items')
                        .select('*')
                        .eq('circle_id', membership.circle_id)
                        .order('created_at', { ascending: false })

                    if (data) setItems(data as BucketItem[])
                }
            } catch (e) {
                console.error(e)
            } finally {
                setIsLoading(false)
            }
        }
        fetchItems()
    }, [])

    const handleAddItem = async () => {
        if (!newItem.title || !circleId) return

        const { data, error } = await supabase
            .from('bucket_list_items')
            .insert({
                circle_id: circleId,
                title: newItem.title,
                tiny_version: newItem.tiny_version,
                full_version: newItem.full_version,
                why_it_matters: newItem.why_it_matters,
                effort_level: newItem.effort_level,
                is_completed: false
            })
            .select()
            .single()

        if (data) {
            setItems([data as BucketItem, ...items])
            setIsAdding(false)
            setNewItem({ title: "", tiny_version: "", full_version: "", why_it_matters: "", effort_level: 1 })
        }
    }

    const toggleComplete = async (id: string, currentStatus: boolean) => {
        // Optimistic update
        setItems(items.map(i => i.id === id ? { ...i, is_completed: !currentStatus } : i))

        await supabase
            .from('bucket_list_items')
            .update({ is_completed: !currentStatus })
            .eq('id', id)
    }

    const deleteItem = async (id: string) => {
        // Optimistic
        setItems(items.filter(i => i.id !== id))
        await supabase.from('bucket_list_items').delete().eq('id', id)
    }

    if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></div>

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Bucket List</h1>
                    <p className="text-muted-foreground">Dreams big and small. Every full version has a tiny version.</p>
                </div>
                <Button onClick={() => setIsAdding(!isAdding)}>
                    {isAdding ? "Cancel" : <><Plus className="mr-2 h-4 w-4" /> Add Item</>}
                </Button>
            </div>

            {isAdding && (
                <Card className="border-primary/50 bg-secondary/10">
                    <CardHeader>
                        <CardTitle>New Dream</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">What do you want to do?</label>
                            <Input
                                placeholder="e.g. See the Northern Lights"
                                value={newItem.title}
                                onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tiny Version (Doable now)</label>
                                <Input
                                    placeholder="e.g. Watch a 4K video of auroras"
                                    value={newItem.tiny_version}
                                    onChange={e => setNewItem({ ...newItem, tiny_version: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Full Version (Big dream)</label>
                                <Input
                                    placeholder="e.g. Trip to Iceland"
                                    value={newItem.full_version}
                                    onChange={e => setNewItem({ ...newItem, full_version: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Why does this matter?</label>
                            <Input
                                placeholder="Takes my breath away..."
                                value={newItem.why_it_matters}
                                onChange={e => setNewItem({ ...newItem, why_it_matters: e.target.value })}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button onClick={handleAddItem} disabled={!newItem.title}>
                            <Save className="mr-2 h-4 w-4" /> Save Dream
                        </Button>
                    </CardFooter>
                </Card>
            )}

            <div className="grid gap-4">
                {items.map(item => (
                    <Card key={item.id} className={item.is_completed ? "opacity-60" : ""}>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                    <button
                                        className={`mt-1 h-6 w-6 shrink-0 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${item.is_completed ? "bg-primary border-primary text-white" : "border-muted-foreground hover:border-primary"}`}
                                        onClick={() => toggleComplete(item.id)}
                                    >
                                        {item.is_completed && <Check className="h-4 w-4" />}
                                    </button>
                                    <div className="space-y-1 flex-1">
                                        <h3 className={`font-heading font-semibold text-lg ${item.is_completed ? "line-through text-muted-foreground" : ""}`}>
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">{item.why_it_matters}</p>

                                        {/* Detailed View */}
                                        {expandedId === item.id && (
                                            <div className="mt-4 pt-4 border-t grid md:grid-cols-2 gap-4 text-sm animate-in slide-in-from-top-2">
                                                <div>
                                                    <span className="font-semibold block text-primary mb-1">Tiny Version</span>
                                                    <p className="bg-secondary/30 p-2 rounded">{item.tiny_version || "Not defined"}</p>
                                                </div>
                                                <div>
                                                    <span className="font-semibold block text-primary mb-1">Full Version</span>
                                                    <p className="bg-secondary/30 p-2 rounded">{item.full_version || "Not defined"}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                                        {expandedId === item.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => deleteItem(item.id)}>
                                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
