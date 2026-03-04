import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface VerifiedBadgeProps {
    className?: string;
    size?: number;
}

export default function VerifiedBadge({ className, size = 14 }: VerifiedBadgeProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center justify-center bg-accent-blue rounded-full p-0.5 shadow-lg shadow-accent-blue/20",
                className
            )}
            title="Verified User"
        >
            <Check size={size} className="text-white" strokeWidth={4} />
        </div>
    );
}

