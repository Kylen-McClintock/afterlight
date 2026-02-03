import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"


import { PromptFilters } from "@/components/prompts/PromptFilters"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function PromptsPage({
    searchParams,
}: {
    searchParams: Promise<{ category?: string }>
}) {
    const supabase = await createClient()
    const { category } = await searchParams

    let query = supabase
        .from('prompt_library_global')
        .select('*')
        .limit(100) // 10x prompts

    if (category) {
        // Filter where tags array contains the category
        query = query.contains('tags', [category])
    }

    const { data: prompts, error } = await query

    if (error) {
        console.error("Error fetching prompts:", error)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Prompt Queue</h1>
                    <p className="text-muted-foreground">Questions waiting for your story.</p>
                </div>
                {/* Future: Request a prompt modal */}
                {/* <Button>Request a Prompt</Button> */}
            </div>

            <PromptFilters />

            <div className="grid gap-4">
                {prompts && prompts.length > 0 ? (
                    prompts.map((prompt) => (
                        <Card key={prompt.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{prompt.title}</CardTitle>
                                        <div className="flex gap-2 mt-2">
                                            {prompt.tags && prompt.tags.map((tag: string) => (
                                                <Badge key={tag} variant="secondary">{tag}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <Link href={`/app/story/create?mode=text&promptId=${prompt.id}`}>
                                        <Button size="sm">Answer</Button>
                                    </Link>
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
