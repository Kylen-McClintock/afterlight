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
import { Mail, Send, Plus, Loader2 } from "lucide-react"
import { CollectionManager } from "@/components/collections/CollectionManager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PromptLibraryProps {
    onSelect: (prompt: any) => void
    onFreeForm: () => void
}

export function PromptLibrary({ onSelect, onFreeForm }: PromptLibraryProps) {
    const searchParams = useSearchParams()
    const category = searchParams.get("category")
    const [prompts, setPrompts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<'browse' | 'collections'>('browse')
    const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null)

    // Invitation Dialog State
    const [inviteOpen, setInviteOpen] = useState(false)
    const [inviteEmails, setInviteEmails] = useState("")
    const [selectedInvitePrompt, setSelectedInvitePrompt] = useState<any>(null)

    const fetchPrompts = async () => {
        setLoading(true)
        const supabase = createClient()

        let combined: any[] = []

        if (activeCollectionId) {
            // Fetch collection items
            const { data: items } = await supabase
                .from('custom_collection_items')
                .select('*, prompt:prompt_library_global(*)') // Expand linked prompt
                .eq('collection_id', activeCollectionId)

            if (items) {
                combined = items.map(item => ({
                    ...item.prompt,
                    // valid prompt data or fallback title if custom item w/o link
                    title: item.prompt?.title || item.title,
                    prompt_text: item.prompt?.prompt_text || item.title
                })).filter(p => p.title) // filter out junk
            }
        } else {
            // Standard Fetch (Global + Requests)
            // ... existing logic ...
            let globalQuery = supabase
                .from('prompt_library_global')
                .select('*')
                .limit(100)

            if (category && category !== "All") {
                globalQuery = globalQuery.contains('tags', [category])
            }

            const { data: globalData, error: globalError } = await globalQuery

            let userPrompts: any[] = []
            if (!category || category === 'All') {
                const { data: userData } = await supabase
                    .from('prompt_requests')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (userData) {
                    userPrompts = userData.map(p => ({
                        id: p.id,
                        title: p.prompt_text,
                        prompt_text: p.prompt_text,
                        tags: ['Custom'],
                        is_custom: true
                    }))
                }
            }
            combined = [...(userPrompts || []), ...(globalData || [])]
        }

        setPrompts(combined)
        setLoading(false)
    }

    useEffect(() => {
        fetchPrompts()
    }, [category, activeCollectionId])

    const handleSelectCollection = (id: string) => {
        setActiveCollectionId(id)
        setViewMode('browse') // Switch back to browse to show items? Or stay in collections view?
        // Let's keep it simple: "Browse" shows standard feed. "Collections" shows list of collections.
        // If you click a collection, we show those prompts.
        // It might be cleaner to just have a "Collection" filter in the Browse view, but let's try a dedicated flow.
    }

    // Reset collection if category changes or user clicks "All"
    useEffect(() => {
        if (category) setActiveCollectionId(null)
    }, [category])


    const handleShareClick = (prompt: any, e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedInvitePrompt(prompt)
        setInviteOpen(true)
    }

    const [userName, setUserName] = useState("A friend")

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.user_metadata?.full_name) {
                setUserName(user.user_metadata.full_name)
            }
        }
        fetchUser()
    }, [])

    const handleSendInvite = () => {
        if (!inviteEmails) return

        // Personal message
        // Using window.open ensures it's treated as navigation in some contexts, but href is standard for mailto

        const subject = encodeURIComponent(`${userName} would love to hear your story: ${selectedInvitePrompt?.title}`)
        const url = `${window.location.origin}/app/story/create?promptId=${selectedInvitePrompt?.id}`

        const emailBody = `Hi,

${userName} is using AfterLight to preserve family memories and thought this question would be perfect for you to answer:

"${selectedInvitePrompt?.prompt_text}"

You can answer it directly here:
${url}

Help us keep our stories alive.
`

        window.location.href = `mailto:${inviteEmails}?subject=${subject}&body=${encodeURIComponent(emailBody)}`
        setInviteOpen(false)
        setInviteEmails("")
    }

    const handleGlobalInvite = () => {
        const subject = encodeURIComponent(`Join me on AfterLight`)
        const url = `${window.location.origin}`

        const emailBody = `Hi,

I'm using AfterLight to capture and preserve our family's most important stories and values. I'd love for you to join me so we can keep these memories forever.

Check it out here: ${url}

Best,
${userName}`

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

            <Tabs defaultValue="browse" value={viewMode} onValueChange={(v: any) => {
                setViewMode(v)
                if (v === 'browse') setActiveCollectionId(null)
            }}>
                <TabsList>
                    <TabsTrigger value="browse">Browse Prompts</TabsTrigger>
                    <TabsTrigger value="collections">My Collections</TabsTrigger>
                </TabsList>

                <TabsContent value="browse">
                    <PromptFilters />
                    {activeCollectionId && (
                        <div className="mb-4 flex items-center justify-between bg-muted/20 p-3 rounded-md">
                            <span className="font-medium">Viewing Collection</span>
                            <Button variant="ghost" size="sm" onClick={() => setActiveCollectionId(null)}>Clear</Button>
                        </div>
                    )}
                    <div className="grid gap-4 mt-4">
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
                                                <Button variant="ghost" size="sm" onClick={() => onSelect(prompt)}>Select</Button>
                                                <AddToPlanButton promptId={prompt.id} />
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
                </TabsContent>

                <TabsContent value="collections">
                    <CollectionManager onSelectCollection={handleSelectCollection} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function AddToPlanButton({ promptId }: { promptId: string }) {
    const [loading, setLoading] = useState(false)

    const addToPlan = async (e: React.MouseEvent) => {
        e.stopPropagation()
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // Find active plan
        const { data: plan } = await supabase
            .from('weekly_plans')
            .select('id')
            .eq('user_id', user?.id)
            .eq('is_active', true)
            .limit(1)
            .single()

        if (plan) {
            await supabase.from('weekly_plan_items').insert({
                plan_id: plan.id,
                item_type: 'prompt',
                prompt_id: promptId,
                status: 'pending'
            })
            alert("Added to your weekly plan!")
        } else {
            alert("No active weekly plan found.")
        }
        setLoading(false)
    }

    return (
        <Button variant="ghost" size="sm" onClick={addToPlan} disabled={loading} className="gap-1">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            <span className="sr-only sm:not-sr-only sm:inline-block">Plan</span>
        </Button>
    )
}
