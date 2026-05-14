// API Configuration
// Override in dev by setting window.__BACKEND_URL__ before this script loads,
// or via the BACKEND_URL env var when using docker-compose.frontend.yml.
const _origin = window.__BACKEND_URL__ ||
    (window.location.origin.includes('localhost') ? '' : window.location.origin);

export const API_BASE_URL = _origin;

export const WS_BASE_URL = _origin.replace(/^http/, 'ws');

/**
 * Handles URL resolution for files and assets.
 * @param {string} path - The file path or URL
 * @returns {string} - The resolved URL
 */
export const getFileUrl = (path) => {
    const defaultImage = 'public/default-image.svg';
    
    if (!path || path.includes('placeholder.svg')) return defaultImage;
    if (path.startsWith('http')) return path;
    if (path.startsWith('public/')) return path; // Already has public prefix
    
    // For uploaded files (starting with /uploads)
    if (path.startsWith('/uploads') || path.startsWith('uploads')) {
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${API_BASE_URL}${cleanPath}`;
    }
    
    return path;
};
