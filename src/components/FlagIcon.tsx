import React from 'react';
import { cn } from '../lib/utils';

interface FlagIconProps {
    code: string;
    className?: string;
    size?: number;
}

/**
 * FlagIcon component that renders SVG flags from src/assets/flags/
 * Uses Vite's glob import for efficient asset management.
 */
const FlagIcon: React.FC<FlagIconProps> = ({ code, className, size = 18 }) => {
    const isoCode = code.toLowerCase();

    // Vite glob import to get all SVG flags as URLs
    // We use eager: true to have them available at runtime, and 'url' to get the public path
    const flags = (import.meta as any).glob('../assets/flags/*.svg', { eager: true, query: '?url', import: 'default' });

    const flagPath = flags[`../assets/flags/${isoCode}.svg`];

    if (!flagPath) {
        // Fallback to emoji if flag is missing
        const getFlagEmoji = (c: string) => {
            if (!c || c.length !== 2) return "🏳️";
            return c.toUpperCase().replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
        };

        return (
            <span
                className={cn("flex items-center justify-center select-none pointer-events-none", className)}
                style={{ fontSize: size }}
            >
                {getFlagEmoji(code)}
            </span>
        );
    }

    return (
        <img
            src={flagPath}
            alt={`${code} flag`}
            className={cn("object-cover rounded-full shadow-sm select-none pointer-events-none", className)}
            style={{
                width: size,
                height: size,
                minWidth: size,
                minHeight: size
            }}
            loading="lazy"
        />
    );
};

export default FlagIcon;
