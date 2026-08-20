import { Organization, OrgBranding } from '../types';

export interface BrandColorPreset {
  id: string;
  name: string;
  hex: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  description: string;
}

export const BRAND_COLOR_PRESETS: BrandColorPreset[] = [
  {
    id: 'emerald',
    name: 'Emerald Heritage',
    hex: '#059669',
    textClass: 'text-emerald-700',
    bgClass: 'bg-emerald-600',
    borderClass: 'border-emerald-600',
    description: 'Fresh, authoritative Nigerian financial green',
  },
  {
    id: 'royal-blue',
    name: 'Royal Sapphire',
    hex: '#1d4ed8',
    textClass: 'text-blue-700',
    bgClass: 'bg-blue-600',
    borderClass: 'border-blue-600',
    description: 'Distinguished, corporate, institutional trust',
  },
  {
    id: 'navy',
    name: 'Atlantic Navy',
    hex: '#1e3a8a',
    textClass: 'text-blue-900',
    bgClass: 'bg-blue-900',
    borderClass: 'border-blue-900',
    description: 'Deep governance, executive alumni, fraternity',
  },
  {
    id: 'indigo',
    name: 'Imperial Indigo',
    hex: '#4338ca',
    textClass: 'text-indigo-700',
    bgClass: 'bg-indigo-600',
    borderClass: 'border-indigo-600',
    description: 'Prestigious academic, civic, cultural societies',
  },
  {
    id: 'purple',
    name: 'Regal Purple',
    hex: '#7c3aed',
    textClass: 'text-purple-700',
    bgClass: 'bg-purple-600',
    borderClass: 'border-purple-600',
    description: 'Royal fellowships, community elders & honours',
  },
  {
    id: 'burgundy',
    name: 'Crimson Burgundy',
    hex: '#be123c',
    textClass: 'text-rose-700',
    bgClass: 'bg-rose-700',
    borderClass: 'border-rose-700',
    description: 'Bold prestige, traditional titles, social clubs',
  },
  {
    id: 'teal',
    name: 'Lagoon Teal',
    hex: '#0f766e',
    textClass: 'text-teal-700',
    bgClass: 'bg-teal-700',
    borderClass: 'border-teal-700',
    description: 'Modern cooperative, health, thrift societies',
  },
  {
    id: 'amber',
    name: 'Warm Amber Gold',
    hex: '#b45309',
    textClass: 'text-amber-800',
    bgClass: 'bg-amber-600',
    borderClass: 'border-amber-600',
    description: 'Warmth, prosperity, community development',
  },
  {
    id: 'obsidian',
    name: 'Obsidian Slate',
    hex: '#0f172a',
    textClass: 'text-slate-900',
    bgClass: 'bg-slate-900',
    borderClass: 'border-slate-900',
    description: 'Minimalist high-contrast executive luxury',
  },
  {
    id: 'forest',
    name: 'Pine Forest',
    hex: '#15803d',
    textClass: 'text-green-800',
    bgClass: 'bg-green-700',
    borderClass: 'border-green-700',
    description: 'Agricultural cooperatives, youth, conservation',
  },
];

export const DEFAULT_BRAND_COLOR = '#059669';

/**
 * Converts a hex color (#RRGGBB) to RGB components
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  } else if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

/**
 * Lightens or darkens a hex color by a percentage
 */
export function adjustColorBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const adjust = (val: number) => {
    const newVal = Math.round(val + (255 - val) * (percent / 100));
    return Math.min(255, Math.max(0, newVal));
  };
  const darken = (val: number) => {
    const newVal = Math.round(val * (1 + percent / 100));
    return Math.min(255, Math.max(0, newVal));
  };

  const r = percent > 0 ? adjust(rgb.r) : darken(rgb.r);
  const g = percent > 0 ? adjust(rgb.g) : darken(rgb.g);
  const b = percent > 0 ? adjust(rgb.b) : darken(rgb.b);

  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Applies the organization brand color as CSS custom properties to the document root
 */
export function applyBrandTheme(colorHex?: string): void {
  if (typeof document === 'undefined') return;

  const primary = colorHex && colorHex.startsWith('#') ? colorHex : DEFAULT_BRAND_COLOR;
  const rgb = hexToRgb(primary) || { r: 5, g: 150, b: 105 };

  const hoverColor = adjustColorBrightness(primary, -15);
  const activeColor = adjustColorBrightness(primary, -25);
  const lightBg = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`;
  const subtleBorder = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`;
  const strongBorder = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`;

  const root = document.documentElement;
  root.style.setProperty('--brand-primary', primary);
  root.style.setProperty('--brand-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  root.style.setProperty('--brand-primary-hover', hoverColor);
  root.style.setProperty('--brand-primary-active', activeColor);
  root.style.setProperty('--brand-primary-light', lightBg);
  root.style.setProperty('--brand-primary-border', subtleBorder);
  root.style.setProperty('--brand-primary-border-strong', strongBorder);
}

/**
 * Helper to get brand properties and styles for an organization
 */
export function getOrgBranding(org?: Organization | null): OrgBranding {
  return (
    org?.branding || {
      primaryColor: DEFAULT_BRAND_COLOR,
      showLogoOnNavbar: true,
    }
  );
}

/**
 * Client-side file image compressor to base64 Data URL
 * This allows logo uploads to work seamlessly without requiring an external storage bucket.
 */
export function compressImageToBase64(
  file: File,
  maxWidth: number = 400,
  maxHeight: number = 400,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/png', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
