import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default async function PromptsPage() {
    const supabase = await createClient()

    // Fetch from global library for now since we don't have circle requests yet
    const { data: prompts, error } = await supabase
        .from('prompt_library_global')
        .select('*')
        .limit(10)

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
                <Button>Request a Prompt</Button>
            </div>

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
                                    <Button size="sm">Answer</Button>
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
                            No prompts found. <br />
                            (If you haven't seeded the database yet, run `npx tsx scripts/seed-defaults.ts`)
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
