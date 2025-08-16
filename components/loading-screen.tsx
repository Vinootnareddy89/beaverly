
"use client";

import { Loader } from 'lucide-react';

export function LoadingScreen() {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader className="h-8 w-8 animate-spin" />
        </div>
    );
}
