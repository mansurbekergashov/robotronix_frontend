// Application Configuration

const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';

export const APP_CONFIG = {
    // API URLs
    API_BASE_URL: isDevelopment 
        ? '/api'  // Nginx orqali
        : '/api',
    
    // Dashboard URLs
    USER_DASHBOARD_URL: isDevelopment
        ? 'http://localhost:3002'
        : '/user-panel/',

    ADMIN_DASHBOARD_URL: isDevelopment
        ? 'http://localhost:3001'
        : `${window.location.protocol}//admin.${window.location.hostname}`,
    
    // App Info
    APP_NAME: 'Robotronix',
    APP_VERSION: '1.0.0',
    
    // Features
    ENABLE_CHAT: true,
    ENABLE_NOTIFICATIONS: true,
};

export default APP_CONFIG;
