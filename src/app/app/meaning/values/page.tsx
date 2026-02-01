"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
// import { Slider } from "@/components/ui/slider" // Need Slider component
import { Loader2, Save } from "lucide-react"

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

    const toggleValue = (val: string) => {
        if (selectedValues.includes(val)) {
            setSelectedValues(prev => prev.filter(v => v !== val))
        } else {
            if (selectedValues.length >= 5) return // Limit to 5
            setSelectedValues(prev => [...prev, val])
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        // Mock save to values_map
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log("Saved values:", selectedValues, energyLevel)
        setIsSaving(false)
    }

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
