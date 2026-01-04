import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);

        const updateMatch = (e: MediaQueryListEvent | MediaQueryList) => {
            setMatches(e.matches);
        };

        // Set initial value
        updateMatch(media);

        // Listen for changes
        if (typeof media.addEventListener === 'function') {
            media.addEventListener('change', updateMatch);
            return () => media.removeEventListener('change', updateMatch);
        } else {
            // Fallback for older browsers
            media.addListener(updateMatch);
            return () => media.removeListener(updateMatch);
        }
    }, [query]);

    return matches;
}

