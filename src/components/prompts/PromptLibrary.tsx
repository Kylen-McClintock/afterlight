"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PromptFilters } from "@/components/prompts/PromptFilters"
import { useSearchParams, useRouter } from "next/navigation"

interface PromptLibraryProps {
    onSelect: (prompt: any) => void
    onFreeForm: () => void
}

export function PromptLibrary({ onSelect, onFreeForm }: PromptLibraryProps) {
    const searchParams = useSearchParams()
    const category = searchParams.get("category")
    const [prompts, setPrompts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPrompts = async () => {
            setLoading(true)
            const supabase = createClient()
            let query = supabase
                .from('prompt_library_global')
                .select('*')
                .limit(100)

            if (category && category !== "All") {
                query = query.contains('tags', [category])
            }

            const { data, error } = await query
            if (error) console.error("Error fetching prompts:", error)
            else setPrompts(data || [])
            setLoading(false)
        }
        fetchPrompts()
    }, [category])

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold">What's your story today?</h1>
                    <p className="text-muted-foreground">Choose a prompt or share a free-form thought.</p>
                </div>
                <Button size="lg" onClick={onFreeForm} className="w-full md:w-auto">
                    Create Free Form
                </Button>
            </div>

            <PromptFilters />

            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-10 text-muted-foreground">Loading prompts...</div>
                ) : prompts.length > 0 ? (
                    prompts.map((prompt) => (
                        <Card key={prompt.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onSelect(prompt)}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <CardTitle className="text-lg">{prompt.title}</CardTitle>
                                        <div className="flex gap-2">
                                            {prompt.tags && prompt.tags.map((tag: string) => (
                                                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm">Select</Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{prompt.prompt_text}</p>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center p-8 border rounded-lg bg-muted/20">
                        <p className="text-muted-foreground">
                            No prompts found for this category.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
