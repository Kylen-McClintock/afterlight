"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type FontSize = "normal" | "large" | "xlarge";

interface FontContextType {
    fontSize: FontSize;
    setFontSize: (size: FontSize) => void;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

export function FontProvider({ children }: { children: React.ReactNode }) {
    const [fontSize, setFontSizeState] = useState<FontSize>("normal");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem("afterlight-font-size") as FontSize;
        if (stored && ["normal", "large", "xlarge"].includes(stored)) {
            setFontSizeState(stored);
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const html = document.documentElement;
        html.classList.remove("text-normal", "text-large", "text-xlarge");

        if (fontSize !== "normal") {
            html.classList.add(`text-${fontSize}`);
        }

        localStorage.setItem("afterlight-font-size", fontSize);
    }, [fontSize, mounted]);

    const setFontSize = (size: FontSize) => {
        setFontSizeState(size);
    };

    return (
        <FontContext.Provider value={{ fontSize, setFontSize }}>
            {children}
        </FontContext.Provider>
    );
}

export function useFont() {
    const context = useContext(FontContext);
    if (context === undefined) {
        throw new Error("useFont must be used within a FontProvider");
    }
    return context;
}
