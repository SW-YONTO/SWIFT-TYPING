// Central Promo & Coupon Code Management for Swift Typing

const _ck = [70,82,69,69,66,65,78,75,65,73];
const _gc = () => _ck.map(c => String.fromCharCode(c)).join('');

export const VALID_PROMO_CODES = [
  'FREEBANKAI',
  'FREEFORU',
  'FREEFORYOU',
  'SWIFTFREE',
  'FREEPRO',
  'FREEACCESS',
  'FREE',
  _gc()
];

/**
 * Validates whether a given promo / coupon code is valid.
 * Normalizes input by trimming, uppercase, and removing non-alphanumeric characters.
 */
export const isValidPromoCode = (inputCode) => {
  if (!inputCode || typeof inputCode !== 'string') return false;
  const normalized = inputCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return VALID_PROMO_CODES.includes(normalized);
};

/**
 * Extracts promo/referral code from any URL string or current window location.
 */
export const extractPromoCodeFromUrl = (urlStr = window.location.href) => {
  try {
    const match = urlStr.match(/[?&](code|coupon|ref)=([^&/#]+)/i);
    if (match && match[2]) {
      return decodeURIComponent(match[2]).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    }
  } catch (e) {
    console.error('Failed to extract promo code from URL:', e);
  }
  return null;
};
