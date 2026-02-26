import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Mic, PenTool, Upload, Video, Sparkles, Users, Quote } from "lucide-react"
import Link from "next/link"
import { WeeklyPlanWidget } from "@/components/dashboard/WeeklyPlanWidget"
import { ConnectionsWidget } from "@/components/dashboard/ConnectionsWidget"
import { InspirationWidget } from "@/components/dashboard/InspirationWidget"
import { createClient } from "@/utils/supabase/server"

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let welcomeName = ""
    let circleContext = "Here is your plan for the week."

    if (user) {
        const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single()
        welcomeName = profile?.display_name || user.email?.split('@')[0] || ""

        const { data: membership } = await supabase
            .from('circle_memberships')
            .select('role, circles(name, primary_user_id, profiles!circles_primary_user_id_fkey(display_name))')
            .eq('user_id', user.id)
            .single()

        if (membership && membership.circles) {
            const circle = membership.circles as any
            const isPrimary = circle.primary_user_id === user.id
            if (!isPrimary && circle.profiles?.display_name) {
                circleContext = `You are actively contributing to ${circle.profiles.display_name}'s Circle. Here is the plan.`
            } else if (!isPrimary) {
                circleContext = `You are actively contributing to a shared Circle. Here is the plan.`
            }
        }
    }

    return (
        <div className="space-y-8">
            {/* Welcome / Header */}
            <section className="space-y-2">
                <h1 className="text-3xl font-heading font-bold text-foreground">
                    Welcome{welcomeName ? ` ${welcomeName}` : ' back'}.
                </h1>
                <p className="text-muted-foreground">{circleContext}</p>
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
                    <div className="min-h-[12rem]">
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
                        <Button variant="outline" className="h-24 w-full flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary border-dashed p-2">
                            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
                            <span className="text-xs sm:text-sm text-center leading-tight whitespace-normal break-words">Explore Prompts</span>
                        </Button>
                    </Link>
                    <Link href="/app/story/create?mode=audio">
                        <Button variant="outline" className="h-24 w-full flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary p-2">
                            <Mic className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
                            <span className="text-xs sm:text-sm text-center leading-tight whitespace-normal break-words">Record Audio</span>
                        </Button>
                    </Link>
                    <Link href="/app/story/create?mode=video">
                        <Button variant="outline" className="h-24 w-full flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary p-2">
                            <Video className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
                            <span className="text-xs sm:text-sm text-center leading-tight whitespace-normal break-words">Record Video</span>
                        </Button>
                    </Link>
                    <Link href="/app/story/create?mode=upload">
                        <Button variant="outline" className="h-24 w-full flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary p-2">
                            <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
                            <span className="text-xs sm:text-sm text-center leading-tight whitespace-normal break-words">Upload File</span>
                        </Button>
                    </Link>
                    <Link href="/app/story/create?mode=text">
                        <Button variant="outline" className="h-24 w-full flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary p-2">
                            <PenTool className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
                            <span className="text-xs sm:text-sm text-center leading-tight whitespace-normal break-words">Write Text</span>
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    )
}
