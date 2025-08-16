
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SchedulePage() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Task Scheduler</CardTitle>
          <CardDescription>This feature is temporarily disabled.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">The AI scheduling functionality has been removed to resolve build issues. It can be re-implemented in the future.</p>
        </CardContent>
      </Card>
    </div>
  );
}
