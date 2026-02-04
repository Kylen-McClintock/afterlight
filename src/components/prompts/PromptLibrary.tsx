"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PromptFilters } from "@/components/prompts/PromptFilters"
import { CreatePromptDialog } from "@/components/prompts/CreatePromptDialog"
import { useSearchParams, useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Mail, Send } from "lucide-react"

interface PromptLibraryProps {
    onSelect: (prompt: any) => void
    onFreeForm: () => void
}

export function PromptLibrary({ onSelect, onFreeForm }: PromptLibraryProps) {
    const searchParams = useSearchParams()
    const category = searchParams.get("category")
    const [prompts, setPrompts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Invitation Dialog State
    const [inviteOpen, setInviteOpen] = useState(false)
    const [inviteEmails, setInviteEmails] = useState("")
    const [selectedInvitePrompt, setSelectedInvitePrompt] = useState<any>(null)

    const fetchPrompts = async () => {
        setLoading(true)
        const supabase = createClient()

        // 1. Fetch Global Prompts
        let globalQuery = supabase
            .from('prompt_library_global')
            .select('*')
            .limit(100)

        if (category && category !== "All") {
            globalQuery = globalQuery.contains('tags', [category])
        }

        const { data: globalData, error: globalError } = await globalQuery
        if (globalError) console.error("Error fetching global prompts:", globalError)

        // 2. Fetch User Requests (Custom Prompts)
        // Only if "All" or "Request" (if we had that category)
        // For now, always append them at the top if no category or category matches "Custom"
        let userPrompts: any[] = []
        if (!category || category === 'All') {
            const { data: userData } = await supabase
                .from('prompt_requests')
                .select('*')
                .order('created_at', { ascending: false })

            if (userData) {
                userPrompts = userData.map(p => ({
                    id: p.id,
                    title: p.prompt_text, // Map text to title for consistency
                    prompt_text: p.prompt_text,
                    tags: ['Custom'],
                    is_custom: true
                }))
            }
        }

        const combined = [...(userPrompts || []), ...(globalData || [])]
        setPrompts(combined)
        setLoading(false)
    }

    useEffect(() => {
        fetchPrompts()
    }, [category])

    const handleShareClick = (prompt: any, e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedInvitePrompt(prompt)
        setInviteOpen(true)
    }

    const handleSendInvite = async () => {
        if (!inviteEmails) return
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // Personal message
        const senderName = user?.user_metadata?.full_name || "A friend"

        const subject = encodeURIComponent(`${senderName} would love to hear your story: ${selectedInvitePrompt?.title}`)
        const url = `${window.location.origin}/app/story/create?promptId=${selectedInvitePrompt?.id}`

        const emailBody = `Hi,

${senderName} is using AfterLight to preserve family memories and thought this question would be perfect for you to answer:

"${selectedInvitePrompt?.prompt_text}"

You can answer it directly here:
${url}

Help us keep our stories alive.
`

        window.location.href = `mailto:${inviteEmails}?subject=${subject}&body=${encodeURIComponent(emailBody)}`
        setInviteOpen(false)
        setInviteEmails("")
    }

    const handleGlobalInvite = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const senderName = user?.user_metadata?.full_name || "A friend"

        const subject = encodeURIComponent(`Join me on AfterLight`)
        const url = `${window.location.origin}`

        const emailBody = `Hi,

I'm using AfterLight to capture and preserve our family's most important stories and values. I'd love for you to join me so we can keep these memories forever.

Check it out here: ${url}

Best,
${senderName}`

        window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(emailBody)}`
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold">What's your story today?</h1>
                    <p className="text-muted-foreground">Choose a prompt or share a free-form thought.</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <Button variant="outline" onClick={handleGlobalInvite}>
                        <Mail className="mr-2 h-4 w-4" />
                        Invite Friends
                    </Button>
                    <CreatePromptDialog onSuccess={fetchPrompts} />
                    <Button onClick={onFreeForm}>
                        Free Form
                    </Button>
                </div>
            </div>

            <PromptFilters />

            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-10 text-muted-foreground">Loading prompts...</div>
                ) : prompts.length > 0 ? (
                    prompts.map((prompt) => (
                        <Card key={prompt.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onSelect(prompt)}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <CardTitle className="text-lg">{prompt.title}</CardTitle>
                                        <div className="flex gap-2">
                                            {prompt.is_custom && <Badge variant="default">Custom</Badge>}
                                            {prompt.tags && prompt.tags.map((tag: string) => (
                                                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={(e) => handleShareClick(prompt, e)}>
                                            Share
                                        </Button>
                                        <Button variant="ghost" size="sm">Select</Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{prompt.prompt_text}</p>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center p-8 border rounded-lg bg-muted/20">
                        <p className="text-muted-foreground">
                            No prompts found for this category.
                        </p>
                    </div>
                )}
            </div>

            {/* Share/Invite Dialog */}
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ask a Friend</DialogTitle>
                        <DialogDescription>
                            Send this prompt to a friend or family member to answer.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-muted/30 rounded-md">
                            <p className="font-medium text-sm">{selectedInvitePrompt?.title || selectedInvitePrompt?.prompt_text}</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">To (Email Addresses)</label>
                            <Input
                                placeholder="mom@example.com, brother@example.com"
                                value={inviteEmails}
                                onChange={(e) => setInviteEmails(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Separate multiple emails with commas.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSendInvite} disabled={!inviteEmails}>
                            <Send className="mr-2 h-4 w-4" />
                            Open Email App
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
