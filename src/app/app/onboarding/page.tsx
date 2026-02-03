"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowRight, Loader2, Users } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

export default function OnboardingPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [circleName, setCircleName] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleCreateCircle = async () => {
        if (!circleName) return
        setIsSaving(true)
        setError(null)

        const supabase = createClient()
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Please sign in first.")

            // 1. Create Circle
            const { data: circle, error: circleError } = await supabase
                .from('circles')
                .insert({
                    primary_user_id: user.id,
                    name: circleName
                })
                .select()
                .single()

            if (circleError) throw circleError

            // 2. Add Membership (Primary)
            // Note: RLS might handle primary user logic, but let's be explicit if needed.
            // Or check triggers? No trigger set for this.
            const { error: memberError } = await supabase
                .from('circle_memberships')
                .insert({
                    circle_id: circle.id,
                    user_id: user.id,
                    role: 'primary',
                    relationship_label: 'Primary'
                })

            if (memberError) throw memberError

            setStep(2)
        } catch (err: any) {
            console.error(err)
            setError(err.message)
            alert(`Error creating circle: ${err.message}`)
        } finally {
            setIsSaving(false)
        }
    }

    const handleFinish = () => {
        router.push("/app")
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-lg shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Users className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-heading">
                        {step === 1 ? "Name Your Circle" : "Circle Created!"}
                    </CardTitle>
                    <CardDescription>
                        {step === 1
                            ? "Create a private space for your stories and loved ones."
                            : "You're all set to start preserving your light."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Circle Name</label>
                                <Input
                                    placeholder="e.g. The Smith Family, Grandma's Legacy..."
                                    value={circleName}
                                    onChange={(e) => setCircleName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 text-center">
                            <p className="text-muted-foreground">
                                Your circle <strong>"{circleName}"</strong> is ready. You can invite family members from your dashboard settings later.
                            </p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between">
                    {step === 1 ? (
                        <Button className="w-full" onClick={handleCreateCircle} disabled={!circleName || isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Circle
                        </Button>
                    ) : (
                        <Button className="w-full" onClick={handleFinish}>
                            Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
