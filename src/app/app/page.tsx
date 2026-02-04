import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Mic, PenTool, Upload, Video } from "lucide-react"
import Link from "next/link"
import { WeeklyPlanWidget } from "@/components/dashboard/WeeklyPlanWidget"
import { MeditationFetcher } from "@/components/dashboard/MeditationFetcher"

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

                {/* Right Col: Meditations & Recommendations */}
                <div className="lg:col-span-2 space-y-6">
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-heading font-semibold">Science-Backed Meditations</h2>
                            <Link href="/app/meditations" className="text-sm text-muted-foreground hover:underline">View All</Link>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <MeditationFetcher />
                        </div>
                    </section>
                </div>
            </div>

            {/* Quick Actions */}
            <section>
                <h2 className="text-xl font-heading font-semibold mb-4">Create a Story</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
