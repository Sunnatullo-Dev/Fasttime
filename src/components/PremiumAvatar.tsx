import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface PremiumAvatarProps {
    user: {
        username: string;
        avatar?: string;
        avatar_url?: string;
        plan?: 'FREE' | 'PREMIUM';
        is_premium?: boolean;
    };
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-32 h-32',
};

export default function PremiumAvatar({ user, size = 'md', className }: PremiumAvatarProps) {
    const isPremium = user.plan === 'PREMIUM' || user.is_premium;
    const avatarSrc = user.avatar_url || user.avatar;

    return (
        <div className={cn("relative group", sizeClasses[size], className)}>
            {isPremium && (
                <>
                    {/* Animated Golden Ring */}
                    <motion.div
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-[-3px] rounded-full p-[3px] z-0 will-change-transform"
                        style={{
                            background: 'conic-gradient(from 0deg, #FACC15, #EAB308, #F59E0B, #FBBF24, #FACC15)',
                        }}
                    />
                    {/* Subtle Glow */}
                    <div className="absolute inset-0 rounded-full bg-yellow-400/30 blur-md -z-10 group-hover:bg-yellow-400/50 transition-colors" />
                </>
            )}

            <div className={cn(
                "relative z-10 w-full h-full rounded-full overflow-hidden bg-accent-purple/20 flex items-center justify-center border-2",
                isPremium ? "border-transparent" : "border-white/10"
            )}>
                {avatarSrc ? (
                    <img
                        src={`${avatarSrc}${avatarSrc.includes('?') ? '&' : '?'}t=${Date.now()}`}
                        alt={user.username}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <UserIcon className="text-accent-purple" size={size === 'xl' ? 64 : 20} />
                )}
            </div>
        </div>
    );
}
