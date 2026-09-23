/**
 * SecurityGuard — Application-Wide Security & Anti-Abuse Engine
 * 
 * Provides:
 * 1. XSS / Script Injection Sanitization
 * 2. Chat & Interaction Rate Limiting (Flood / DoS Protection)
 * 3. YouTube Stream URL & ID Strict Validation
 * 4. Safe JSON Deserialization & Storage Integrity Protection
 * 5. Input Bounds Validation for User Profiles, Rooms & Playlists
 */

export class SecurityGuard {
  // Rate limiting storage: key -> timestamps array
  private static rateLimitBuckets: Map<string, number[]> = new Map();

  /**
   * 1. Sanitize Plain Text to prevent HTML/XSS injection
   * Escapes dangerous characters: <, >, &, ", ', `
   */
  public static sanitizeText(raw: string | null | undefined, maxLength = 500): string {
    if (!raw) return '';
    
    // Trim and cut to max length
    let str = String(raw).trim().slice(0, maxLength);

    // Strip invisible control chars (except newline and tab)
    str = str.replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g, '');

    // Escape HTML special characters
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '`': '&#x60;',
      '/': '&#x2F;'
    };

    return str.replace(/[&<>"'`/]/g, (char) => htmlEscapes[char] || char);
  }

  /**
   * 2. Strip all HTML tags completely
   */
  public static stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
  }

  /**
   * 3. Rate Limit Check (Flood Protection for Chat & Reactions)
   * Returns true if allowed, false if rate limit exceeded.
   */
  public static checkRateLimit(
    actionKey: string,
    maxActions = 5,
    windowMs = 3000
  ): { allowed: boolean; remainingCooldownMs: number } {
    const now = Date.now();
    let timestamps = this.rateLimitBuckets.get(actionKey) || [];

    // Filter out timestamps outside the current window
    timestamps = timestamps.filter((ts) => now - ts < windowMs);

    if (timestamps.length >= maxActions) {
      const oldestInWindow = timestamps[0];
      const cooldownRemaining = Math.max(0, windowMs - (now - oldestInWindow));
      this.rateLimitBuckets.set(actionKey, timestamps);
      return { allowed: false, remainingCooldownMs: cooldownRemaining };
    }

    timestamps.push(now);
    this.rateLimitBuckets.set(actionKey, timestamps);
    return { allowed: true, remainingCooldownMs: 0 };
  }

  /**
   * 4. Strict YouTube URL & Video ID Validation
   * Ensures URL points exclusively to genuine YouTube domains and has valid ID syntax.
   */
  public static isValidYouTubeVideoId(id: string | null | undefined): boolean {
    if (!id) return false;
    // Standard YouTube video IDs are 11 characters alphanumeric + '-' or '_'
    return /^[a-zA-Z0-9_-]{11}$/.test(id);
  }

  public static isValidYouTubeUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    try {
      const parsed = new URL(url);
      const trustedHosts = [
        'youtube.com',
        'www.youtube.com',
        'm.youtube.com',
        'music.youtube.com',
        'youtu.be'
      ];
      return trustedHosts.includes(parsed.hostname.toLowerCase());
    } catch {
      return false;
    }
  }

  /**
   * 5. Safe URL Sanitizer
   * Only permits safe http/https URLs or relative paths. Blocks javascript:, data: (non-image), vbscript:.
   */
  public static sanitizeUrl(url: string | null | undefined, fallback = ''): string {
    if (!url) return fallback;
    const clean = url.trim();

    // Check for dangerous pseudo-protocols
    if (/^(javascript|vbscript|data(?!:image)):/i.test(clean)) {
      console.warn('SecurityGuard: Blocked dangerous URL protocol:', clean);
      return fallback;
    }

    if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/') || clean.startsWith('data:image/')) {
      return clean;
    }

    return fallback;
  }

  /**
   * 6. Safe JSON Deserializer with prototype poisoning protection
   */
  public static safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw);
      // Protect against __proto__ prototype pollution
      if (parsed && typeof parsed === 'object') {
        delete (parsed as any).__proto__;
        delete (parsed as any).constructor;
        delete (parsed as any).prototype;
      }
      return parsed as T;
    } catch (err) {
      console.warn('SecurityGuard: Corrupted JSON detected, returned fallback:', err);
      return fallback;
    }
  }

  /**
   * 7. Room Input Validation
   */
  public static validateRoomInput(name: string, description: string): { valid: boolean; error?: string } {
    const cleanName = name.trim();
    if (!cleanName || cleanName.length < 2) {
      return { valid: false, error: 'Room name must be at least 2 characters long.' };
    }
    if (cleanName.length > 50) {
      return { valid: false, error: 'Room name cannot exceed 50 characters.' };
    }
    if (description && description.length > 250) {
      return { valid: false, error: 'Room description cannot exceed 250 characters.' };
    }
    return { valid: true };
  }

  /**
   * 8. Username Validation
   */
  public static validateUsername(username: string): { valid: boolean; error?: string } {
    const clean = username.trim();
    if (!clean || clean.length < 3) {
      return { valid: false, error: 'Username must be at least 3 characters.' };
    }
    if (clean.length > 24) {
      return { valid: false, error: 'Username cannot exceed 24 characters.' };
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(clean)) {
      return { valid: false, error: 'Username can only contain letters, numbers, underscores, and dashes.' };
    }
    return { valid: true };
  }
}

export default SecurityGuard;
