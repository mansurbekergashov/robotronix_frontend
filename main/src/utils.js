export const getAPIUrl = () => {
    return window.location.origin.includes('localhost')
        ? 'http://localhost'
        : window.location.origin;
};

export const getFileUrl = (path) => {
    const defaultImage = '/assets/images/placeholder.svg';
    const fallbackImage = defaultImage;
    
    if (!path || path.includes('placeholder.svg')) return defaultImage;
    if (path.startsWith('http')) return path;
    if (path.startsWith('public/')) return path;
    
    // For uploaded files
    if (path.startsWith('/uploads') || path.startsWith('uploads')) {
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        const apiUrl = getAPIUrl();
        // Since Nginx serves /uploads/, we can just point to the mapped location
        return `${apiUrl}${cleanPath}`;
    }
    
    return path || fallbackImage;
};
