import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Mic, PenTool, Upload, Video } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            {/* Welcome / Header */}
            <section className="space-y-2">
                <h1 className="text-3xl font-heading font-bold text-foreground">Welcome back.</h1>
                <p className="text-muted-foreground">Here is your plan for the week.</p>
            </section>

            {/* Weekly Plan Summary (Mock) */}
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Weekly Wins</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside text-sm space-y-1">
                            <li>Record 1 story</li>
                            <li>Call Sarah</li>
                            <li>Read 10 pages</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Connection</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Prompt: "Tell me about your parents."</p>
                        <Button size="sm" variant="outline" className="w-full">
                            Answer Now
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Quote of the Week</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <figure className="text-sm italic">
                            "Life is not measured by the number of breaths we take..."
                        </figure>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Meditation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-medium mb-2">Morning Presence</p>
                        <Button size="sm" variant="secondary" className="w-full">
                            Start (2m)
                        </Button>
                    </CardContent>
                </Card>
            </section>

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
