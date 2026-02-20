"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Share2, Copy, Check, Users, BookOpen, PenTool } from "lucide-react"

interface ShareDialogProps {
    storyId: string
    storyTitle?: string | null
    trigger?: React.ReactNode
}

export function ShareDialog({ storyId, storyTitle, trigger }: ShareDialogProps) {
    const [copied, setCopied] = useState(false)
    const [open, setOpen] = useState(false)
    const [activeTab, setActiveTab] = useState("prompt")

    // Default to a fallback if window is not defined (SSR)
    const [baseUrl, setBaseUrl] = useState('https://afterlight.app')

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin)
        }
    }, [])

    const storyUrl = `${baseUrl}/app/story/${storyId}`
    const safeTitle = storyTitle || "My Story"

    const generateText = (type: string) => {
        switch (type) {
            case "prompt":
                return `Hey! I thought you'd have a great perspective on this topic. I'd love it if you recorded a story about "${safeTitle}". You can add your voice here: ${storyUrl}`
            case "complete":
                return `I just recorded a story called "${safeTitle}" and wanted to share it with you. You can listen to it here: ${storyUrl}`
            case "collaborate":
                return `Hey! I started a story called "${safeTitle}" but I feel like it's missing something. I'd love your perspective to make it complete. Add your part here: ${storyUrl}`
            default:
                return storyUrl
        }
    }

    const [shareText, setShareText] = useState(generateText("prompt"))

    // Update share text whenever the base URL changes (i.e., after mount)
    useEffect(() => {
        setShareText(generateText(activeTab))
    }, [baseUrl])

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
            <DialogContent className="sm:max-w-md">
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
                            <PenTool className="h-3 w-3" /> Colлаб
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="prompt" className="mt-4 outline-none">
                        <Textarea
                            value={shareText}
                            onChange={(e) => setShareText(e.target.value)}
                            className="min-h-[100px] text-sm resize-none focus-visible:ring-1"
                        />
                    </TabsContent>

                    <TabsContent value="complete" className="mt-4 outline-none">
                        <Textarea
                            value={shareText}
                            onChange={(e) => setShareText(e.target.value)}
                            className="min-h-[100px] text-sm resize-none focus-visible:ring-1"
                        />
                    </TabsContent>

                    <TabsContent value="collaborate" className="mt-4 outline-none">
                        <Textarea
                            value={shareText}
                            onChange={(e) => setShareText(e.target.value)}
                            className="min-h-[100px] text-sm resize-none focus-visible:ring-1"
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
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
