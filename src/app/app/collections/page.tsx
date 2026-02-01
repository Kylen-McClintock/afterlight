import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function CollectionsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-heading font-bold">Collections</h1>
                <p className="text-muted-foreground">Organize your stories and memories.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-dashed border-2 bg-muted/10">
                    <CardHeader className="text-center py-12">
                        <CardTitle>Create New Collection</CardTitle>
                        <CardDescription>Group stories by theme, person, or era.</CardDescription>
                    </CardHeader>
                </Card>

                {/* Placeholder for future backend wiring */}
                <Card>
                    <CardHeader>
                        <CardTitle>Favorites</CardTitle>
                        <CardDescription>0 items</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    )
}
