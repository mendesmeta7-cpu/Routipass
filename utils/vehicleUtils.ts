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
 * Calculates the validity status of a document based on its expiration date.
 * @param expiryDate ISO date string
 * @returns { color: string, label: string }
 */
export function getValidityStatus(expiryDate: string): { color: string, label: string } {
  if (!expiryDate) return { color: 'gray', label: 'Inconnu' };

  const today = new Date();
  const exp = new Date(expiryDate);
  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { color: '#ef4444', label: 'Expiré' }; // Red
  } else if (diffDays <= 30) {
    return { color: '#f59e0b', label: 'Bientôt' }; // Orange
  } else {
    return { color: '#10b981', label: 'Valide' }; // Green
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
