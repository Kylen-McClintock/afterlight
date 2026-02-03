"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

const CATEGORIES = ["All", "Childhood", "Career", "Family", "Relationships", "Wisdom", "Fun", "History"]

export function PromptFilters() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    const currentCategory = searchParams.get("category") || "All"

    const handleFilter = (category: string) => {
        const params = new URLSearchParams(searchParams)
        if (category === "All") {
            params.delete("category")
        } else {
            params.set("category", category)
        }
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="flex flex-wrap gap-2 pb-4">
            {CATEGORIES.map((cat) => (
                <Button
                    key={cat}
                    variant={currentCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilter(cat)}
                    className="rounded-full"
                >
                    {cat}
                </Button>
            ))}
        </div>
    )
}
