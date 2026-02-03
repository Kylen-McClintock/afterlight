import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Compass, ListTodo, Quote, Sparkles, ArrowRight } from "lucide-react"

export default function MeaningPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-heading font-bold">Meaning & Purpose</h1>
                <p className="text-muted-foreground">Tools to clarify what matters most and plan your days.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Values Map */}
                <Link href="/app/meaning/values" className="group">
                    <Card className="h-full hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <Compass className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                            <CardTitle>Values Map</CardTitle>
                            <CardDescription>Define your core values and current priorities.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Your values guide the weekly plan generation to ensure your time aligns with what matters.
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                {/* Bucket List */}
                <Link href="/app/meaning/bucket-list" className="group">
                    <Card className="h-full hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <ListTodo className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                            <CardTitle>Bucket List</CardTitle>
                            <CardDescription>Track goals with "tiny" and "full" versions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Capture the experiences you want to have, from simple joys to big dreams.
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                {/* Quotes & Meditations */}
                <Link href="/app/prompts?category=Wisdom" className="group">
                    <Card className="h-full hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <Sparkles className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                            <CardTitle>Inspiration</CardTitle>
                            <CardDescription>Quotes and micro-meditations.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Sources of light, comfort, and wisdom for difficult days.
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <div className="p-6 bg-secondary/30 rounded-lg flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-heading font-semibold">Your Weekly Plan</h3>
                    <p className="text-muted-foreground text-sm">Review your generated plan based on your values.</p>
                </div>
                <Link href="/app">
                    <Button variant="outline">View Plan <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
            </div>
        </div>
    )
}
