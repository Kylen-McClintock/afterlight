"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Quote, Video, Mic, FileText, Sparkles, Play, Plus, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MeditationCard } from "@/components/meditations/MeditationCard"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function MeditationsPage() {
    const [activeTab, setActiveTab] = useState("all")
    const [quotes, setQuotes] = useState<any[]>([])
    const [meditations, setMeditations] = useState<any[]>([])
    const [interactions, setInteractions] = useState<Record<string, any>>({}) // Map med_id -> interaction
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // Fetch Quotes
        const { data: qData } = await supabase.from('quotes_global').select('*').limit(20)
        if (qData) setQuotes(qData)

        // Fetch Meditations
        const { data: mData } = await supabase.from('library_meditations').select('*').order('created_at', { ascending: false }).limit(50)
        if (mData) setMeditations(mData)

        // Fetch Interactions (Stars/Notes)
        if (user) {
            const { data: iData } = await supabase.from('meditation_interactions').select('*').eq('user_id', user.id)
            if (iData) {
                const map: Record<string, any> = {}
                iData.forEach(i => map[i.meditation_id] = i)
                setInteractions(map)
            }
        }

        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Mindfulness Library</h1>
                    <p className="text-muted-foreground">Collections of wisdom, quotes, and guided meditations.</p>
                </div>
                <AddCustomMediaDialog onSuccess={fetchData} />
            </div>

            <Tabs defaultValue="all" className="space-y-6" onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="quotes">Quotes</TabsTrigger>
                    <TabsTrigger value="audio">Audio</TabsTrigger>
                    <TabsTrigger value="video">Video</TabsTrigger>
                    <TabsTrigger value="text">Text</TabsTrigger>
                    <TabsTrigger value="wisdom" className="gap-2"><Sparkles className="h-3 w-3" /> Wisdom</TabsTrigger>
                    <TabsTrigger value="history" className="gap-2"><History className="h-3 w-3" /> Favorites/History</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-8">
                    {/* Quotes Section */}
                    <section>
                        <h2 className="text-xl font-heading font-semibold mb-4 flex items-center gap-2">
                            <Quote className="h-5 w-5 text-primary" /> Daily Wisdom
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {quotes.slice(0, 3).map(quote => (
                                <QuoteCard key={quote.id} quote={quote} />
                            ))}
                        </div>
                    </section>

                    {/* Meditations Section (Mixed) */}
                    <section>
                        <h2 className="text-xl font-heading font-semibold mb-4 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" /> Recent Meditations
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {meditations.slice(0, 6).map(med => (
                                <MeditationCard
                                    key={med.id}
                                    meditation={med}
                                    interaction={interactions[med.id]}
                                    onUpdate={fetchData}
                                />
                            ))}
                        </div>
                    </section>
                </TabsContent>

                <TabsContent value="quotes">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {quotes.map(quote => (
                            <QuoteCard key={quote.id} quote={quote} />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="audio">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {meditations.filter(m => m.type === 'audio').map(med => (
                            <MeditationCard key={med.id} meditation={med} interaction={interactions[med.id]} onUpdate={fetchData} />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="video">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {meditations.filter(m => m.type === 'video').map(med => (
                            <MeditationCard key={med.id} meditation={med} interaction={interactions[med.id]} onUpdate={fetchData} />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="text">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {meditations.filter(m => m.type === 'text').map(med => (
                            <MeditationCard key={med.id} meditation={med} interaction={interactions[med.id]} onUpdate={fetchData} />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="wisdom">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {meditations.filter(m => m.type === 'wisdom').map(med => (
                            <MeditationCard key={med.id} meditation={med} interaction={interactions[med.id]} onUpdate={fetchData} />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="history">
                    <div className="space-y-4">
                        <div className="bg-muted/10 p-4 rounded-lg border border-dashed">
                            <p className="text-sm text-muted-foreground">Items are sorted by your <span className="text-yellow-500 font-bold">Usefulness Rating</span> (Stars).</p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {meditations
                                .filter(m => interactions[m.id]) // Only ones with interactions
                                .sort((a, b) => (interactions[b.id]?.rating || 0) - (interactions[a.id]?.rating || 0)) // Sort by rating desc
                                .map(med => (
                                    <MeditationCard key={med.id} meditation={med} interaction={interactions[med.id]} onUpdate={fetchData} />
                                ))
                            }
                        </div>
                        {Object.keys(interactions).length === 0 && (
                            <div className="text-center py-10 text-muted-foreground">
                                No history yet. Rate items to see them here!
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function QuoteCard({ quote }: { quote: any }) {
    return (
        <Card className="bg-muted/20">
            <CardContent className="pt-6">
                <blockquote className="italic text-lg font-serif mb-4">"{quote.quote_text}"</blockquote>
                <p className="text-sm text-muted-foreground">— {quote.author}</p>
            </CardContent>
        </Card>
    )
}

function AddCustomMediaDialog({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: "",
        category: "Custom",
        type: "video",
        content: ""
    })

    const handleSave = async () => {
        if (!formData.title || !formData.content) return
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        // Get circle
        const { data: membership } = await supabase.from('circle_memberships').select('circle_id').eq('user_id', user?.id).single()

        if (membership) {
            const { error } = await supabase.from('library_meditations').insert({
                circle_id: membership.circle_id,
                user_id: user?.id,
                title: formData.title,
                category: formData.category,
                type: formData.type,
                content: formData.content, // For video this should be URL
                is_custom: true,
                description: "Added by you"
            })
            if (!error) {
                setOpen(false)
                setFormData({ title: "", category: "Custom", type: "video", content: "" })
                onSuccess()
            }
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Custom
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Add Custom Meditation / Video</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Favorite Ted Talk" />
                    </div>
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <select
                            className="w-full border rounded-md p-2 text-sm bg-background"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="video">YouTube / Video Link</option>
                            <option value="text">Text / Quote</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>{formData.type === 'video' ? 'Video URL' : 'Content'}</Label>
                        <Textarea
                            value={formData.content}
                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                            placeholder={formData.type === 'video' ? "https://youtube.com/..." : "Enter text here..."}
                        />
                    </div>
                    <Button onClick={handleSave} disabled={loading || !formData.title}>Save to Library</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
