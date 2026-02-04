"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Quote, Video, Mic, FileText, Sparkles, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MeditationsPage() {
    const [activeTab, setActiveTab] = useState("all")
    const [quotes, setQuotes] = useState<any[]>([])
    const [meditations, setMeditations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()

            // Fetch Quotes
            const { data: qData } = await supabase.from('quotes_global').select('*').limit(20)
            if (qData) setQuotes(qData)

            // Fetch Meditations
            const { data: mData } = await supabase.from('meditations_global').select('*').limit(20)
            if (mData) setMeditations(mData)

            setLoading(false)
        }
        fetchData()
    }, [])

    const getIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video className="h-4 w-4" />
            case 'audio': return <Mic className="h-4 w-4" />
            case 'text': return <FileText className="h-4 w-4" />
            default: return <Sparkles className="h-4 w-4" />
        }
    }

    // Filter Logic
    // Ideally the DB has a 'type' column. For now assuming 'category' might mimic it or we just show all.
    // Let's assume for this mock that we filter by client-side logic or just show sections.

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20">
            <div>
                <h1 className="text-3xl font-heading font-bold">Mindfulness Library</h1>
                <p className="text-muted-foreground">Collections of wisdom, quotes, and guided meditations.</p>
            </div>

            <Tabs defaultValue="all" className="space-y-6" onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="quotes">Quotes</TabsTrigger>
                    <TabsTrigger value="audio">Audio</TabsTrigger>
                    <TabsTrigger value="video">Video</TabsTrigger>
                    <TabsTrigger value="text">Text</TabsTrigger>
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

                    {/* Meditations Section */}
                    <section>
                        <h2 className="text-xl font-heading font-semibold mb-4 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" /> Recent Meditations
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {meditations.map(med => (
                                <MeditationCard key={med.id} meditation={med} />
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
                        {meditations.filter(m => !m.type || m.type === 'audio').map(med => (
                            <MeditationCard key={med.id} meditation={med} />
                        ))}
                    </div>
                </TabsContent>
                {/* ... Add other contents similarly ... */}
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

function MeditationCard({ meditation }: { meditation: any }) {
    return (
        <Card className="group hover:border-primary/50 transition-all cursor-pointer">
            <CardHeader>
                <CardTitle className="flex items-start justify-between">
                    <span>{meditation.title}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Play className="h-3 w-3" />
                    </Button>
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                    <span className="bg-secondary px-2 py-0.5 rounded-full text-xs">{meditation.duration_minutes} min</span>
                    <span className="capitalize text-xs">{meditation.category}</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">{meditation.script_text}</p>
            </CardContent>
        </Card>
    )
}
