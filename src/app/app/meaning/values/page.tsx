"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
// import { Slider } from "@/components/ui/slider" // Need Slider component
import { Loader2, Save } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

// Mock values for selection
const COMMON_VALUES = [
    "Connection", "Faith", "Comfort", "Joy", "Learning",
    "Service", "Nature", "Family", "Creativity", "Peace",
    "Closure", "Gratitude", "Humor", "Tradition"
]

export default function ValuesPage() {
    const [selectedValues, setSelectedValues] = useState<string[]>([])
    const [energyLevel, setEnergyLevel] = useState(50)
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [circleId, setCircleId] = useState<string | null>(null)

    const supabase = createClient()

    // Fetch initial state
    useEffect(() => {
        const loadValues = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    setIsLoading(false) // If no user, stop loading and show empty state
                    return
                }

                // Get circle
                const { data: membership } = await supabase
                    .from('circle_memberships')
                    .select('circle_id')
                    .eq('user_id', user.id)
                    .limit(1)
                    .single()

                if (membership) {
                    setCircleId(membership.circle_id)
                    // Get values map
                    const { data: map } = await supabase
                        .from('values_map')
                        .select('*')
                        .eq('circle_id', membership.circle_id)
                        .single()

                    if (map) {
                        setSelectedValues(map.values || [])
                        setEnergyLevel(map.energy_level || 50)
                    }
                }
            } catch (error) {
                console.error("Error loading values:", error)
            } finally {
                setIsLoading(false)
            }
        }
        loadValues()
    }, [])

    const toggleValue = (val: string) => {
        if (selectedValues.includes(val)) {
            setSelectedValues(prev => prev.filter(v => v !== val))
        } else {
            if (selectedValues.length >= 5) return // Limit to 5
            setSelectedValues(prev => [...prev, val])
        }
    }

    const handleSave = async () => {
        if (!circleId) {
            alert("No circle found. Please create one in onboarding.")
            return
        }
        setIsSaving(true)

        const { error } = await supabase
            .from('values_map')
            .upsert({
                circle_id: circleId,
                values: selectedValues,
                energy_level: energyLevel
            })

        setIsSaving(false)
        if (error) {
            console.error("Error saving:", error)
            alert("Failed to save.")
        } else {
            alert("Values Map Saved!")
        }
    }

    if (isLoading) return <div className="p-8 text-center">Loading your map...</div>

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-heading font-bold">Values Map</h1>
                <p className="text-muted-foreground">Select up to 5 core values that feel most important to you right now.</p>
            </div>

            {/* Values Selection */}
            <Card>
                <CardHeader>
                    <CardTitle>Core Values</CardTitle>
                    <CardDescription>
                        Selected: {selectedValues.length}/5
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {COMMON_VALUES.map(val => {
                            const isSelected = selectedValues.includes(val)
                            return (
                                <Button
                                    key={val}
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => toggleValue(val)}
                                    className="rounded-full"
                                >
                                    {val}
                                </Button>
                            )
                        })}
                    </div>
                    {/* Custom value input could go here */}
                </CardContent>
            </Card>

            {/* Health/Energy Sliders */}
            <Card>
                <CardHeader>
                    <CardTitle>Current Capacity</CardTitle>
                    <CardDescription>Help us tailor your weekly plan to how you're feeling.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-sm font-medium">Energy Level</label>
                            <span className="text-sm text-muted-foreground">{energyLevel}%</span>
                        </div>
                        <input
                            type="range"
                            className="w-full"
                            min="0" max="100"
                            value={energyLevel}
                            onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                        />
                        {/* Standard Slider component would be better looking */}
                    </div>
                    {/* Add Mobility/Cognition sliders similarly */}
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} size="lg">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save My Map
                </Button>
            </div>
        </div>
    )
}
