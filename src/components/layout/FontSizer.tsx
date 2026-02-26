"use client";

import { useFont } from "@/components/providers/FontProvider";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MonitorUp, Check } from "lucide-react";

export function FontSizer() {
    const { fontSize, setFontSize } = useFont();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                    <MonitorUp className="mr-2 h-4 w-4" />
                    Text Size
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setFontSize("normal")} className="flex justify-between">
                    Normal
                    {fontSize === "normal" && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFontSize("large")} className="flex justify-between">
                    Large
                    {fontSize === "large" && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFontSize("xlarge")} className="flex justify-between">
                    Extra Large
                    {fontSize === "xlarge" && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
