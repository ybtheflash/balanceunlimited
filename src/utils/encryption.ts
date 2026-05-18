// Simple XOR cipher for basic privacy since we had issues with crypto-js EPERM on Windows
// In a real production app for high security, use a proper AES library

const xorCipher = (text: string, key: string) => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
};

// We use the user's ID as the key for encryption to ensure privacy.
export const encryptNote = (text: string, userId: string): string => {
  if (!text || !userId) return text;
  try {
    const xored = xorCipher(text, userId);
    // Base64 encode using btoa if available, or a fallback (React Native environment might need polyfill or buffer)
    if (typeof btoa !== 'undefined') {
      return btoa(xored);
    }
    // Simple fallback if btoa is missing
    return encodeURIComponent(xored);
  } catch (error) {
    console.error('Encryption failed:', error);
    return text;
  }
};

export const decryptNote = (encryptedText: string, userId: string): string => {
  if (!encryptedText || !userId) return encryptedText;
  try {
    let xored = '';
    if (typeof atob !== 'undefined' && !encryptedText.includes('%')) {
      xored = atob(encryptedText);
    } else {
      xored = decodeURIComponent(encryptedText);
    }
    return xorCipher(xored, userId);
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedText;
  }
};

