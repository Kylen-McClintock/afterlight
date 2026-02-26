import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Bell, Shield } from "lucide-react"
import { createClient } from "@/utils/supabase/server"
import { InviteManager } from "@/components/settings/InviteManager"

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let circleId = null
    let isPrimaryOwner = false

    if (user) {
        const { data: membership } = await supabase
            .from('circle_memberships')
            .select('circle_id, role, circles(name, primary_user_id)')
            .eq('user_id', user.id)
            .single()

        if (membership) {
            circleId = membership.circle_id
            isPrimaryOwner = (membership.circles as any)?.primary_user_id === user.id
        }
    }
    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-heading font-bold">Settings</h1>
                <p className="text-muted-foreground">Manage your account and circle preferences.</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <CardTitle>Profile</CardTitle>
                    </div>
                    <CardDescription>Update your personal information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Display Name</label>
                        <Input placeholder="Your Name" />
                    </div>
                    <Button>Save Changes</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <CardTitle>Circle Access</CardTitle>
                    </div>
                    <CardDescription>Manage who can see and add to your stories.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isPrimaryOwner ? (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground mb-4">You are the Primary owner of your circle.</p>
                            <InviteManager circleId={circleId} isPrimaryOwner={isPrimaryOwner} />
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">You are a Contributor in this circle. Only the Primary User can manage invites.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
