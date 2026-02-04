"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Quote, Sparkles, Play, BookOpen } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function InspirationWidget() {
    const [quote, setQuote] = useState<any>(null)
    const [meditation, setMeditation] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchInspiration = async () => {
            const supabase = createClient()

            // Fetch random quote (simple random implementation)
            const { data: quotes } = await supabase.from('quotes_global').select('*').limit(10)
            if (quotes && quotes.length > 0) {
                setQuote(quotes[Math.floor(Math.random() * quotes.length)])
            }

            // Fetch random meditation
            const { data: meditations } = await supabase.from('meditations_global').select('*').limit(5)
            if (meditations && meditations.length > 0) {
                setMeditation(meditations[Math.floor(Math.random() * meditations.length)])
            }

            setLoading(false)
        }
        fetchInspiration()
    }, [])

    return (
        <div className="grid gap-4 md:grid-cols-2 h-full">
            {/* Quote Day */}
            <Card className="bg-primary/5 border-primary/10">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Quote className="h-3 w-3" /> Quote of the Day
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="h-12 w-3/4 bg-muted/20 animate-pulse rounded" />
                    ) : quote ? (
                        <div className="space-y-4">
                            <blockquote className="italic font-serif text-lg leading-relaxed text-foreground/90">
                                "{quote.quote_text}"
                            </blockquote>
                            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                                — {quote.author || "Unknown"}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Every day brings a new beginning.</p>
                    )}
                </CardContent>
            </Card>

            {/* Meditation Day */}
            <Card className="bg-secondary/20 border-secondary/30 relative overflow-hidden group">
                {/* Background Decoration */}
                <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12">
                    <Sparkles className="h-32 w-32" />
                </div>

                <CardHeader className="pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Sparkles className="h-3 w-3" /> Meditation of the Day
                    </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                    {loading ? (
                        <div className="h-12 w-3/4 bg-muted/20 animate-pulse rounded" />
                    ) : meditation ? (
                        <div className="flex flex-col h-full justify-between gap-4">
                            <div>
                                <h3 className="font-heading font-bold text-lg mb-1">{meditation.title}</h3>
                                <div className="flex gap-2 text-xs text-muted-foreground">
                                    <span className="bg-background/50 px-2 py-0.5 rounded-full">{meditation.duration_minutes} min</span>
                                    <span className="bg-background/50 px-2 py-0.5 rounded-full capitalize">{meditation.category || "General"}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-auto">
                                <Link href={`/app/meditations/${meditation.id}`}>
                                    <Button size="sm" className="gap-2">
                                        <Play className="h-3 w-3" /> Start
                                    </Button>
                                </Link>
                                <Link href="/app/meditations">
                                    <Button size="sm" variant="ghost" className="gap-2">
                                        <BookOpen className="h-3 w-3" /> Library
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Take a moment to breathe.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
