import { AppSidebar } from "@/components/layout/AppSidebar"

export default function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <AppSidebar />
            <main className="flex-1 w-full md:pl-0 pt-16 md:pt-0">
                {/* pt-16 for mobile menu space, remove on desktop as sidebar takes space */}
                {/* Actually, Sidebar is static on desktop so it pushes content. Mobile it is fixed. 
           Mobile menu button is fixed top left. Content needs top padding on mobile.
        */}
                <div className="container mx-auto p-4 md:p-8 max-w-5xl">
                    {children}
                </div>
            </main>
        </div>
    )
}
