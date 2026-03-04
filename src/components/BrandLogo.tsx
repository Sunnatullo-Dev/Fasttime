import React from 'react';
import logo from '../assets/logo-fasttime.png';

export type BrandLogoVariant = 'hero' | 'header' | 'sidebar';

export interface BrandLogoProps {
    variant?: BrandLogoVariant;
    className?: string;
    onClick?: () => void;
}

const sizeMap: Record<BrandLogoVariant, string> = {
    // Auth / Landing hero — strictly large
    hero: 'w-[120px] sm:w-[140px] md:w-[160px] h-auto',
    // Top navigation header
    header: 'w-10 h-10 md:w-11 md:h-11',
    // Sidebar small brand icon
    sidebar: 'w-9 h-9',
};

export default function BrandLogo({ variant = 'sidebar', className = '', onClick }: BrandLogoProps) {
    return (
        <img
            src={logo}
            alt="FastTime"
            onClick={onClick}
            className={[
                'object-contain rounded-xl',
                sizeMap[variant],
                variant === 'sidebar'
                    ? 'shadow-[0_0_15px_rgba(96,165,250,0.4)]'
                    : '',
                variant === 'hero'
                    ? 'drop-shadow-[0_0_24px_rgba(96,165,250,0.45)] hover:scale-105'
                    : 'hover:scale-110',
                'transition-all duration-300 cursor-pointer',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        />
    );
}
