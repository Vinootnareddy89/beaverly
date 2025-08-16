
"use client";

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

export function FirestoreStatus() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // navigator.onLine is not always available in all environments (e.g. server-side rendering)
        if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
            setIsOnline(navigator.onLine);
        }

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <Badge variant={isOnline ? 'success' : 'destructive'} className="flex items-center gap-2">
            {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {isOnline ? 'Online' : 'Offline'}
        </Badge>
    );
}
