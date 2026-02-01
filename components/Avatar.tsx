import React, { useState, useEffect } from 'react';

interface AvatarProps {
    src?: string | null;
    name: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'; // Optional size preset
    alt?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, name, className = '', size = 'md', alt }) => {
    const [imageError, setImageError] = useState(false);

    // Reset error state if src changes
    useEffect(() => {
        setImageError(false);
    }, [src]);

    const getInitials = (fullName: string) => {
        if (!fullName) return '?';
        const names = fullName.trim().split(' ');
        if (names.length === 0) return '?';

        // First letter of first name
        const firstInitial = names[0][0];
        // First letter of last name (if exists)
        const lastInitial = names.length > 1 ? names[names.length - 1][0] : '';

        return (firstInitial + lastInitial).toUpperCase();
    };

    // Generate a consistent color based on name
    const getColor = (fullName: string) => {
        const colors = [
            'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
            'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
            'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
            'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
            'bg-rose-500'
        ];
        let hash = 0;
        for (let i = 0; i < fullName.length; i++) {
            hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    if (!src || imageError) {
        return (
            <div
                className={`flex items-center justify-center font-bold text-white rounded-full bg-[#333333] ${className}`}
                title={name}
            >
                {getInitials(name)}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt || name}
            className={`rounded-full object-cover ${className}`}
            onError={() => setImageError(true)}
        />
    );
};

export default Avatar;
