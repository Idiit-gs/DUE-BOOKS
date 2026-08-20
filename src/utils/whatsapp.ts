/**
 * WhatsApp integration utility for Dues Book v7
 * Strictly enforces wa.me/ universal links as the primary target across all platforms,
 * guaranteeing seamless mobile app handoff and browser compatibility without protocol interference.
 */

/**
 * Normalizes phone numbers into E.164-compliant numeric digits suitable for wa.me/ links.
 * Handles Nigerian local formats (080..., 070..., 090..., 081...), prefixed formats (+234, 234),
 * and general international numbers by stripping spaces, hyphens, and symbols.
 */
export function formatNigerianPhoneForWhatsApp(phone?: string): string {
  if (!phone) return '';
  // Strip all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  if (!digitsOnly) return '';

  // Nigerian standard local mobile format (080..., 070..., 090..., 081..., 071...) - 11 digits starting with 0
  if (digitsOnly.startsWith('0') && digitsOnly.length === 11) {
    return '234' + digitsOnly.slice(1);
  }
  // Already prefixed with Nigerian country code 234
  if (digitsOnly.startsWith('234')) {
    return digitsOnly;
  }
  // International format with other country codes (already stripped of '+')
  return digitsOnly;
}

/**
 * Generates the official, RFC-compliant wa.me universal link for WhatsApp.
 * Example: https://wa.me/2348031234567?text=... or https://wa.me/?text=...
 */
export function getWhatsAppUrl(text: string, rawPhone?: string): string {
  const phoneParam = formatNigerianPhoneForWhatsApp(rawPhone);
  const encoded = encodeURIComponent(text);

  if (phoneParam) {
    return `https://wa.me/${phoneParam}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

/**
 * Opens WhatsApp with a pre-composed text message using strictly enforced wa.me/ links.
 * This ensures consistency in native mobile app handoff, avoids custom-protocol blocking,
 * and seamlessly handles web fallback while securing message payload in the clipboard.
 */
export function openWhatsAppWithMessage(text: string, rawPhone?: string): void {
  // Always copy message to clipboard as an instant fallback for the user
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      navigator.clipboard.writeText(text).catch(() => {});
    } catch {
      // ignore clipboard write failure
    }
  }

  // Strictly enforce wa.me/ universal link as primary target across all platforms
  const targetUrl = getWhatsAppUrl(text, rawPhone);

  try {
    // Attempt standard popout with security flags
    const newWin = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
      // Fallback for sandboxed iframes and popup blockers
      const anchor = document.createElement('a');
      anchor.href = targetUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      setTimeout(() => {
        if (document.body.contains(anchor)) {
          document.body.removeChild(anchor);
        }
      }, 300);
    }
  } catch {
    // Safe DOM anchor fallback
    const anchor = document.createElement('a');
    anchor.href = targetUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      if (document.body.contains(anchor)) {
        document.body.removeChild(anchor);
      }
    }, 300);
  }
}

