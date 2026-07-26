/**
 * Compresses an image file into a base64 string suitable for localStorage.
 * Resizes the image to a maximum dimension to save space.
 * 
 * @param {File} file The image file from an input element
 * @param {number} maxSize The maximum width or height of the output image
 * @param {number} quality The JPEG quality factor (0 to 1)
 * @returns {Promise<string>} A promise that resolves to the compressed base64 string
 */
export const compressImageToBase64 = (file, maxSize = 200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Invalid file type'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        let { width, height } = img;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        // Fill white background in case of transparent PNG to JPEG conversion
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Output compressed base64 JPEG
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      
// Vite glob import for all avatar PNG assets
const avatarImages = import.meta.glob('/src/assets/avatars/*.png', { eager: true, import: 'default' });

/**
 * Resolves avatar filenames or data URLs into valid browser image URLs
 * @param {string} avatar Filename (e.g., 'avatar1.png'), data URL, or HTTP link
 * @returns {string|null} Resolved image URL
 */
export const getAvatarPath = (avatar) => {
  if (!avatar) return avatarImages['/src/assets/avatars/avatar1.png'] || null;
  if (typeof avatar === 'string' && (avatar.startsWith('data:image/') || avatar.startsWith('http://') || avatar.startsWith('https://'))) {
    return avatar;
  }

  const filename = String(avatar).split('/').pop();
  const fullPath = `/src/assets/avatars/${filename}`;

  return avatarImages[fullPath] || avatarImages['/src/assets/avatars/avatar1.png'] || null;
};
