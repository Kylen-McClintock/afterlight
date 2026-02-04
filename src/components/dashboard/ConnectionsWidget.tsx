"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus, ArrowRight, Users } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function ConnectionsWidget() {
    const [contacts, setContacts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchContacts = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: membership } = await supabase.from('circle_memberships').select('circle_id').eq('user_id', user.id).single()
            if (membership) {
                const { data } = await supabase
                    .from('contacts')
                    .select('*')
                    .eq('circle_id', membership.circle_id)
                    .order('created_at', { ascending: false })
                    .limit(5)

                if (data) setContacts(data)
            }
            setLoading(false)
        }
        fetchContacts()
    }, [])

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Connections</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                {loading ? (
                    <div className="h-20 animate-pulse bg-muted rounded-md" />
                ) : contacts.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        <p>No family or friends added yet.</p>
                        <Link href="/app/connections">
                            <Button variant="link" className="mt-2 h-auto p-0">Add Connections</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-5 gap-2">
                        {contacts.map(contact => (
                            <div key={contact.id} className="flex flex-col items-center gap-1">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={contact.avatar_url} />
                                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                        {contact.first_name[0]}{contact.last_name?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                                    {contact.first_name}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
            <CardFooter className="pt-0 border-t items-center justify-between p-4">
                <Link href="/app/connections" className="text-xs text-muted-foreground hover:underline flex items-center gap-1">
                    View All <ArrowRight className="h-3 w-3" />
                </Link>
                <Link href="/app/connections">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                        <UserPlus className="h-4 w-4" />
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    )
}
