/**
 * Avatar Debug Service
 * Helps diagnose avatar loading issues and 403 errors
 */

export class AvatarDebugService {
  static logAvatarUrl(userId, avatarUrl, context = '') {
    console.group(`🖼️ Avatar Debug - ${context}`);
    console.log(`User ID: ${userId}`);
    console.log(`Avatar URL: ${avatarUrl}`);
    console.log(`Full URL: ${window.location.origin}${avatarUrl}`);
    console.log(`URL Valid: ${this.isValidUrl(avatarUrl)}`);
    console.groupEnd();
  }

  static isValidUrl(url) {
    if (!url) return false;
    if (typeof url !== 'string') return false;
    return url.startsWith('/uploads/') || url.startsWith('http');
  }

  static async testAvatarAccess(avatarUrl) {
    console.group(`🧪 Testing Avatar Access: ${avatarUrl}`);
    try {
      const response = await fetch(avatarUrl, { method: 'HEAD' });
      console.log(`✅ Status: ${response.status} ${response.statusText}`);
      console.log(`Headers:`, {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        cacheControl: response.headers.get('cache-control'),
      });
      console.groupEnd();
      return response.ok;
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      console.groupEnd();
      return false;
    }
  }

  static async testUploadDirectory() {
    console.group('📁 Testing Upload Directory Access');
    const testUrls = [
      '/uploads/',
      '/uploads/avatars/',
      '/uploads/images/',
      '/uploads/documents/',
    ];

    for (const url of testUrls) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        console.log(`${url}: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.log(`${url}: ❌ ${error.message}`);
      }
    }
    console.groupEnd();
  }

  static logProfileData(profile, context = 'Profile Data') {
    console.group(`👤 ${context}`);
    console.log(JSON.stringify(profile, null, 2));
    if (profile?.avatarUrl) {
      console.log(`Avatar URL: ${profile.avatarUrl}`);
      this.testAvatarAccess(profile.avatarUrl);
    }
    console.groupEnd();
  }

  static generateAvatarFallback(email) {
    // Generate avatar from UI Avatars service as fallback
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      email,
    )}&background=0066ff&color=fff`;
  }

  static async validateAndFallback(avatarUrl, email) {
    console.log(`🔄 Validating avatar URL: ${avatarUrl}`);

    if (!avatarUrl) {
      console.log(`❌ No avatar URL provided, using fallback`);
      return this.generateAvatarFallback(email);
    }

    const isAccessible = await this.testAvatarAccess(avatarUrl);

    if (isAccessible) {
      console.log(`✅ Avatar URL is accessible`);
      return avatarUrl;
    }

    console.log(`⚠️ Avatar URL not accessible, using fallback`);
    return this.generateAvatarFallback(email);
  }

  static setupImageErrorHandler(imgElement, fallbackUrl) {
    if (!imgElement) return;

    imgElement.onerror = function() {
      console.warn(
        `🖼️ Failed to load image: ${this.src}, using fallback: ${fallbackUrl}`,
      );
      this.src = fallbackUrl;
    };

    imgElement.addEventListener('load', function() {
      console.log(`✅ Image loaded successfully: ${this.src}`);
    });
  }
}

export default AvatarDebugService;
