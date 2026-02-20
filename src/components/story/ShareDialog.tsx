"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Share2, Copy, Check, Users, BookOpen, PenTool, Mail } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

interface ShareDialogProps {
    storyId: string
    storyTitle?: string | null
    trigger?: React.ReactNode
}

export function ShareDialog({ storyId, storyTitle, trigger }: ShareDialogProps) {
    const [copied, setCopied] = useState(false)
    const [open, setOpen] = useState(false)
    const [activeTab, setActiveTab] = useState("prompt")
    const [contacts, setContacts] = useState<any[]>([])

    // Default to a fallback if window is not defined (SSR)
    const [baseUrl, setBaseUrl] = useState('https://afterlight.app')

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin)
        }
    }, [])

    useEffect(() => {
        const fetchContacts = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: membership } = await supabase
                .from('circle_memberships')
                .select('circle_id')
                .eq('user_id', user.id)
                .single()

            if (membership) {
                const { data } = await supabase
                    .from('contacts')
                    .select('*')
                    .eq('circle_id', membership.circle_id)
                    .order('first_name')

                if (data) setContacts(data)
            }
        }
        if (open) {
            fetchContacts()
        }
    }, [open])

    const storyUrl = `${baseUrl}/app/story/${storyId}`
    const safeTitle = storyTitle || "My Story"

    const generateText = (type: string) => {
        switch (type) {
            case "prompt":
                return `I'm capturing my memories and stories, and I'd love your help. Could you record a story about "${safeTitle}" for my collection? Please add your voice here: ${storyUrl}`
            case "complete":
                return `I'm working on preserving my memories, and I just recorded a story called "${safeTitle}". I wanted to share this piece of my journey with you. You can listen to it here: ${storyUrl}`
            case "collaborate":
                return `I'm capturing some of my memories, and I started a story called "${safeTitle}". I feel like it's missing your perspective. I'd love for you to add your part to make it complete. Add your voice here: ${storyUrl}`
            default:
                return storyUrl
        }
    }

    const [shareText, setShareText] = useState(generateText("prompt"))

    // Update share text whenever the base URL changes (i.e., after mount)
    useEffect(() => {
        setShareText(generateText(activeTab))
    }, [baseUrl, activeTab])

    const handleTabChange = (val: string) => {
        setActiveTab(val)
        setShareText(generateText(val))
        setCopied(false)
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareText)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy", err)
        }
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `AfterLight: ${safeTitle}`,
                    text: shareText,
                })
            } catch (err) {
                console.log("Error sharing", err)
            }
        } else {
            handleCopy()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 focus:outline-none focus:ring-0">
                        <Share2 className="h-4 w-4" />
                        <span>Share</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Share Story</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="prompt" className="flex items-center gap-1 text-xs">
                            <Users className="h-3 w-3" /> Ask
                        </TabsTrigger>
                        <TabsTrigger value="complete" className="flex items-center gap-1 text-xs">
                            <BookOpen className="h-3 w-3" /> Send
                        </TabsTrigger>
                        <TabsTrigger value="collaborate" className="flex items-center gap-1 text-xs">
                            <PenTool className="h-3 w-3" /> Collaborate
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="prompt" className="mt-4 outline-none">
                        <Textarea
                            value={shareText}
                            onChange={(e) => setShareText(e.target.value)}
                            className="min-h-[120px] text-sm resize-none focus-visible:ring-1"
                        />
                    </TabsContent>

                    <TabsContent value="complete" className="mt-4 outline-none">
                        <Textarea
                            value={shareText}
                            onChange={(e) => setShareText(e.target.value)}
                            className="min-h-[120px] text-sm resize-none focus-visible:ring-1"
                        />
                    </TabsContent>

                    <TabsContent value="collaborate" className="mt-4 outline-none">
                        <Textarea
                            value={shareText}
                            onChange={(e) => setShareText(e.target.value)}
                            className="min-h-[120px] text-sm resize-none focus-visible:ring-1"
                        />
                    </TabsContent>

                    <div className="flex justify-end gap-2 mt-4 pt-2 border-t">
                        <Button variant="outline" onClick={handleCopy} className="gap-2">
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            {copied ? "Copied" : "Copy"}
                        </Button>
                        <Button onClick={handleShare} className="gap-2 bg-primary">
                            <Share2 className="h-4 w-4" />
                            Share
                        </Button>
                    </div>

                    {contacts.filter(c => c.email).length > 0 && (
                        <div className="mt-6 border-t pt-4 animate-in fade-in">
                            <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                                <Mail className="h-4 w-4" /> Send directly via Email:
                            </p>
                            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2">
                                {contacts.filter(c => c.email).map(contact => (
                                    <div key={contact.id} className="flex items-center justify-between bg-muted/20 p-2.5 rounded-md border text-sm group hover:bg-muted/40 transition-colors">
                                        <div className="truncate pr-2">
                                            <span className="font-medium">{contact.first_name} {contact.last_name}</span>
                                            <span className="text-xs text-muted-foreground ml-2 hidden sm:inline-block">({contact.email})</span>
                                        </div>
                                        <a
                                            href={`mailto:${contact.email}?subject=${encodeURIComponent(`A story from my collection: ${safeTitle}`)}&body=${encodeURIComponent(shareText)}`}
                                            className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-md font-medium transition-colors shrink-0"
                                        >
                                            Send
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
