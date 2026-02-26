"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Copy, Check, Users } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

interface InviteManagerProps {
    circleId: string
    isPrimaryOwner: boolean
}

export function InviteManager({ circleId, isPrimaryOwner }: InviteManagerProps) {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [inviteLink, setInviteLink] = useState("")
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState("")

    if (!isPrimaryOwner) {
        return <p className="text-sm text-muted-foreground">Only the Primary Owner can invite new members.</p>
    }

    const handleCreateInvite = async () => {
        if (!email) {
            setError("Please enter an email address.")
            return
        }
        setLoading(true)
        setError("")
        setInviteLink("")

        const supabase = createClient()

        // Generate a random token
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

        // Set expiration to 7 days from now
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)

        const { data, error: insertError } = await supabase.from('invites').insert({
            circle_id: circleId,
            email: email,
            role: 'contributor', // "read and write access"
            token: token,
            expires_at: expiresAt.toISOString()
        }).select().single()

        if (insertError) {
            console.error("Invite Error:", insertError)
            setError(insertError.message || "Failed to create invite.")
        } else {
            const baseUrl = window.location.origin
            setInviteLink(`${baseUrl}/join?token=${token}`)
            setEmail("")
        }

        setLoading(false)
    }

    const handleCopy = async () => {
        await navigator.clipboard.writeText(inviteLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Invite a Core Contributor</label>
                <div className="flex gap-2">
                    <Input
                        placeholder="friend@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        type="email"
                    />
                    <Button onClick={handleCreateInvite} disabled={loading || !email}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate Link
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    Core Contributors receive read and write access, meaning they can view, create, and record stories in your circle.
                </p>
                {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            {inviteLink && (
                <div className="p-4 bg-muted/30 border rounded-md space-y-2 mt-4 animate-in fade-in zoom-in">
                    <p className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" /> Invite Link Generated!
                    </p>
                    <div className="flex gap-2 items-center">
                        <Input readOnly value={inviteLink} className="bg-background text-xs font-mono" />
                        <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Copy and securely send this link to the person. It expires in 7 days.</p>
                </div>
            )}
        </div>
    )
}
