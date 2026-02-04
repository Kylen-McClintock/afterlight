import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Mic, PenTool, Upload, Video, Sparkles, Users, Quote } from "lucide-react"
import Link from "next/link"
import { WeeklyPlanWidget } from "@/components/dashboard/WeeklyPlanWidget"
import { ConnectionsWidget } from "@/components/dashboard/ConnectionsWidget"
import { InspirationWidget } from "@/components/dashboard/InspirationWidget"

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            {/* Welcome / Header */}
            <section className="space-y-2">
                <h1 className="text-3xl font-heading font-bold text-foreground">Welcome back.</h1>
                <p className="text-muted-foreground">Here is your plan for the week.</p>
            </section>

            {/* Weekly Plan & Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Left Col: Weekly Plan */}
                <div className="lg:col-span-1 h-full">
                    <WeeklyPlanWidget />
                </div>

                {/* Right Col: Mindfulness */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Daily Wisdom Row */}
                    <div className="h-48">
                        <InspirationWidget />
                    </div>

                    {/* Connections & Library Links Row */}
                    <div className="grid md:grid-cols-2 gap-4 h-56">
                        <ConnectionsWidget />
                        <Card className="flex flex-col h-full justify-center p-6 bg-gradient-to-br from-background to-muted/20">
                            <h3 className="font-heading font-semibold text-lg mb-4">Mindfulness Library</h3>
                            <div className="space-y-3">
                                <Link href="/app/meditations?type=quote">
                                    <div className="flex items-center justify-between group p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Quote className="h-4 w-4 text-primary" />
                                            <span className="text-sm font-medium">Daily Quotes</span>
                                        </div>
                                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </Link>
                                <Link href="/app/meditations">
                                    <div className="flex items-center justify-between group p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Sparkles className="h-4 w-4 text-primary" />
                                            <span className="text-sm font-medium">Browse All Meditations</span>
                                        </div>
                                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </Link>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <section>
                <h2 className="text-xl font-heading font-semibold mb-4">Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Link href="/app/prompts">
                        <Button variant="outline" className="h-24 w-full flex flex-col gap-2 hover:bg-primary/5 hover:border-primary border-dashed">
                            <Sparkles className="h-6 w-6 text-primary" />
                            <span>Explore Prompts</span>
                        </Button>
                    </Link>
                    <Link href="/app/story/create?mode=audio">
                        <Button variant="outline" className="h-24 w-full flex flex-col gap-2 hover:bg-primary/5 hover:border-primary">
                            <Mic className="h-6 w-6 text-primary" />
                            <span>Record Audio</span>
                        </Button>
                    </Link>
                    <Link href="/app/story/create?mode=video">
                        <Button variant="outline" className="h-24 w-full flex flex-col gap-2 hover:bg-primary/5 hover:border-primary">
                            <Video className="h-6 w-6 text-primary" />
                            <span>Record Video</span>
                        </Button>
                    </Link>
                    <Link href="/app/story/create?mode=upload">
                        <Button variant="outline" className="h-24 w-full flex flex-col gap-2 hover:bg-primary/5 hover:border-primary">
                            <Upload className="h-6 w-6 text-primary" />
                            <span>Upload File</span>
                        </Button>
                    </Link>
                    <Link href="/app/story/create?mode=text">
                        <Button variant="outline" className="h-24 w-full flex flex-col gap-2 hover:bg-primary/5 hover:border-primary">
                            <PenTool className="h-6 w-6 text-primary" />
                            <span>Write Text</span>
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    )
}
