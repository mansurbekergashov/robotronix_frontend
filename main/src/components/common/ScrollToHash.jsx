import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AOS from 'aos';

const ScrollToHash = () => {
    const { hash, pathname } = useLocation();

    useEffect(() => {
        if (hash) {
            const timer = setTimeout(() => {
                const id = hash.replace('#', '');
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 500);

            return () => clearTimeout(timer);
        } else {
            // Instant scroll to top to avoid showing broken layout mid-scroll
            window.scrollTo({ top: 0, behavior: 'instant' });
        }

        // Refresh AOS after route change so new elements get animated
        setTimeout(() => {
            AOS.refresh();
        }, 100);
    }, [hash, pathname]);

    return null;
};

export default ScrollToHash;
