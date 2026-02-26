import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function JoinPage(props: { searchParams: Promise<{ token?: string }> }) {
    const searchParams = await props.searchParams
    const token = searchParams?.token

    if (!token) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <h1 className="text-2xl font-bold mb-4">Invalid Invite Link</h1>
                <p className="text-muted-foreground mb-6">This invite link is missing a token or is invalid.</p>
                <Link href="/"><Button>Go to Home</Button></Link>
            </div>
        )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        // Redirect to login/signup and persist the destination
        redirect(`/login?next=/join?token=${token}`)
    }

    // Lookup token
    const { data: invite, error } = await supabase
        .from('invites')
        .select('*')
        .eq('token', token)
        .is('accepted_at', null)
        .single()

    if (error || !invite) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <h1 className="text-2xl font-bold mb-4">Invite Not Found</h1>
                <p className="text-muted-foreground mb-6">This invite link may have expired or already been used.</p>
                <Link href="/app"><Button>Go to App</Button></Link>
            </div>
        )
    }

    // Check expiration
    if (new Date(invite.expires_at) < new Date()) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <h1 className="text-2xl font-bold mb-4">Invite Expired</h1>
                <p className="text-muted-foreground mb-6">This invite link has expired. Please ask the sender for a new one.</p>
                <Link href="/app"><Button>Go to App</Button></Link>
            </div>
        )
    }

    // Process Invite
    const { error: memberError } = await supabase.from('circle_memberships').insert({
        circle_id: invite.circle_id,
        user_id: user.id,
        role: invite.role,
        relationship_label: "Core Contributor"
    })

    if (memberError && memberError.code !== '23505') { // ignore duplicate key constraint if they are already in
        console.error("Error joining circle:", memberError)
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Error Joining</h1>
                <p className="text-muted-foreground mb-6">There was a problem adding you to the circle.</p>
                <Link href="/app"><Button>Go to App</Button></Link>
            </div>
        )
    }

    // Mark invite as used (Even if they were already in the circle)
    await supabase.from('invites').update({ accepted_at: new Date().toISOString() }).eq('id', invite.id)

    // Redirect to app
    redirect('/app')
}
