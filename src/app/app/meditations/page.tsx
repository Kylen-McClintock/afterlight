"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { MeditationCard } from "@/components/meditations/MeditationCard"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function MeditationsPage() {
    const [meditations, setMeditations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetch = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('library_meditations')
                .select('*')
                .order('category')
                .order('title')

            if (data) setMeditations(data)
            setLoading(false)
        }
        fetch()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/app">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-heading font-bold text-foreground">Meditations</h1>
                    <p className="text-muted-foreground">Science-backed tools for meaning, joy, and peace.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {meditations.map(item => (
                        <MeditationCard key={item.id} meditation={item} />
                    ))}
                </div>
            )}
        </div>
    )
}
