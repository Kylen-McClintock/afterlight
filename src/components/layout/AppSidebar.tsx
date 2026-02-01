"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    Home,
    BookOpen, // Stories/Timeline
    Library, // Collections
    Lightbulb, // Meaning
    MessageSquarePlus, // Prompts
    Settings,
    LogOut,
    Menu,
    X
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const navItems = [
    { href: "/app", label: "Home", icon: Home },
    { href: "/app/timeline", label: "Timeline", icon: BookOpen },
    { href: "/app/collections", label: "Collections", icon: Library },
    { href: "/app/prompts", label: "Prompts", icon: MessageSquarePlus },
    { href: "/app/meaning", label: "Meaning", icon: Lightbulb },
    { href: "/app/settings", label: "Settings", icon: Settings },
]

export function AppSidebar() {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            {/* Mobile Menu Button */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            </div>

            {/* Sidebar Overlay for Mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:block",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-full flex flex-col">
                    {/* Logo / Header */}
                    <div className="p-6 border-b">
                        <h1 className="text-2xl font-heading font-bold text-primary">AfterLight</h1>
                        <p className="text-sm text-muted-foreground">Preserve your light.</p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Footer / User Profile */}
                    <div className="p-4 border-t">
                        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </aside>
        </>
    )
}
