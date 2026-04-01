/**
 * Generates a random 17-character alphanumeric VIN (Vehicle Identification Number).
 * Although real VINs have specific rules (e.g., no I, O, Q), for this app
 * we will use a simplified 17-char alphanumeric string as requested.
 */
export function generateVIN(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'; // Excluded I, O, Q for better readability
  const length = 17;
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generates a random license plate number based on usage.
 * Moto-taxi: 99 + 4 digits + 2 letters (e.g., 994012AC)
 * Others: 75 + 4 digits + 2 letters (e.g., 751234XY)
 */
export function generatePlate(usage: string): string {
  const prefix = usage === 'Moto-taxi' ? 'CG099' : 'CG075';
  const digits = Math.floor(1000 + Math.random() * 9000).toString();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const letters = chars.charAt(Math.floor(Math.random() * chars.length)) + 
                 chars.charAt(Math.floor(Math.random() * chars.length));
  
  return `${prefix}${digits}${letters}`;
}

/**
 * Generates a random driving license number.
 * Pattern: AA + 7 digits + KN (e.g., AA0009075KN)
 */
export function generateLicense(): string {
  const digits = Math.floor(1000000 + Math.random() * 9000000).toString().padStart(7, '0');
  return `AA${digits}KN`;
}

/**
 * Calculates the validity status of a document based on its expiration date.
 * @param expiryDate ISO date string
 * @returns { color: string, label: string, bg: string, text: string, badge: string, status: 'valid' | 'warning' | 'expired' }
 */
export function getValidityStatus(expiryDate: string | null): { 
  color: string, 
  label: string, 
  bg: string, 
  border: string,
  text: string, 
  badge: string, 
  status: 'valid' | 'warning' | 'expired'
} {
  if (!expiryDate) return { 
    color: '#9ca3af', 
    label: 'INCONNU', 
    bg: '#f9fafb', // gray-50
    border: '#f3f4f6', // gray-100
    text: '#6b7280', // gray-500
    badge: '#f3f4f6', // gray-100
    status: 'expired'
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  
  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { 
      color: '#ef4444', // red-500
      label: 'EXPIRÉ', 
      bg: '#fff1f2', // red-50
      border: '#ffe4e6', // red-100
      text: '#be123c', // red-700
      badge: '#ffe4e6', // red-100
      status: 'expired'
    };
  } else if (diffDays <= 2) {
    return { 
      color: '#f59e0b', // amber-500
      label: 'ATTENTION', 
      bg: '#fffbeb', // amber-50
      border: '#fef3c7', // amber-100
      text: '#b45309', // amber-700
      badge: '#fef3c7', // amber-100
      status: 'warning'
    };
  } else {
    return { 
      color: '#10b981', // emerald-500
      label: 'VALIDE', 
      bg: '#ecfdf5', // emerald-50
      border: '#d1fae5', // emerald-100
      text: '#047857', // emerald-700
      badge: '#d1fae5', // emerald-100
      status: 'valid'
    };
  }
}

/**
 * Helper to calculate days remaining from an ISO date string.
 */
export function calculateDaysRemaining(dateStr: string | null): number {
  if (!dateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(dateStr);
  exp.setHours(0, 0, 0, 0);
  const diffTime = exp.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates a detailed countdown status for a document.
 * @param expiryDate ISO date string
 * @returns Object with days remaining and visual styling info.
 */
export function getCountdownStatus(expiryDate: string | null): {
  days: number;
  label: string;
  color: string;
  bg: string;
  text: string;
  border: string;
  accent: string;
  status: 'safe' | 'warning' | 'urgent' | 'expired';
} {
  if (!expiryDate) return {
    days: 0,
    label: 'Statut inconnu',
    color: '#9ca3af',
    bg: '#f9fafb',
    border: '#f3f4f6',
    text: '#6b7280',
    accent: '#d1d5db',
    status: 'expired'
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  
  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      days: diffDays,
      label: `Expiré il y a ${Math.abs(diffDays)}j`,
      color: '#ef4444',
      bg: '#fef2f2',
      border: '#fee2e2',
      text: '#b91c1c',
      accent: '#ef4444',
      status: 'expired'
    };
  } else if (diffDays === 0) {
    return {
      days: 0,
      label: 'Expire aujourd\'hui',
      color: '#f97316',
      bg: '#fff7ed',
      border: '#ffedd5',
      text: '#c2410c',
      accent: '#f97316',
      status: 'urgent'
    };
  } else if (diffDays <= 7) {
    return {
      days: diffDays,
      label: `${diffDays}j restants`,
      color: '#f97316',
      bg: '#fff7ed',
      border: '#ffedd5',
      text: '#c2410c',
      accent: '#f97316',
      status: 'urgent'
    };
  } else if (diffDays <= 30) {
    return {
      days: diffDays,
      label: `${diffDays}j restants`,
      color: '#f59e0b',
      bg: '#fffbeb',
      border: '#fef3c7',
      text: '#b45309',
      accent: '#f59e0b',
      status: 'warning'
    };
  } else {
    return {
      days: diffDays,
      label: `${diffDays}j restants`,
      color: '#10b981',
      bg: '#ecfdf5',
      border: '#d1fae5',
      text: '#047857',
      accent: '#10b981',
      status: 'safe'
    };
  }
}

/**
 * Returns the illustration path based on usage category.
 * Note: Actual images will be provided by the user later.
 */
export function getUsageIllustration(usage: string): string {
  switch (usage) {
    case 'Public':
      return '/images/bus.png';
    case 'Commerciaux':
      return '/images/camion.png';
    case 'Moto-taxi':
      return '/images/moto.png';
    case 'Privé':
    default:
      return '/images/berline.png';
  }
}
