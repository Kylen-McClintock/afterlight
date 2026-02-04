"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Loader2, ArrowLeft, Play, Check } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useParams, useRouter } from "next/navigation"

export default function MeditationDetailPage() {
    const { id } = useParams()
    const [meditation, setMeditation] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const fetch = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('library_meditations')
                .select('*')
                .eq('id', id)
                .single()

            if (data) setMeditation(data)
            setLoading(false)
        }
        if (id) fetch()
    }, [id])

    // Helper to complete? (Maybe optional)
    const handleComplete = () => {
        router.push('/app')
    }

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    if (!meditation) return <div className="p-8">Meditation not found.</div>

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in py-8">
            <Link href="/app/meditations">
                <Button variant="ghost" className="pl-0 gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Library
                </Button>
            </Link>

            <div className="space-y-4">
                <div className="space-y-2">
                    <span className="text-sm font-medium text-primary uppercase tracking-wider">{meditation.category}</span>
                    <h1 className="text-4xl font-heading font-bold">{meditation.title}</h1>
                    <p className="text-xl text-muted-foreground">{meditation.description}</p>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 min-h-[400px] flex flex-col">
                    {meditation.type === 'video' ? (
                        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                            <iframe
                                src={meditation.content}
                                title={meditation.title}
                                className="w-full h-full"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    ) : (
                        <div className="prose prose-lg dark:prose-invert max-w-none flex-1">
                            <div className="whitespace-pre-wrap leading-relaxed">
                                {meditation.content}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-center pt-8">
                    <Button size="lg" onClick={handleComplete} className="gap-2">
                        <Check className="h-5 w-5" />
                        Complete Session
                    </Button>
                </div>
            </div>
        </div>
    )
}
