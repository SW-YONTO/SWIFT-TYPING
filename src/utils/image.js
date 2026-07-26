import avatar1 from '../assets/avatars/avatar1.png';
import avatar2 from '../assets/avatars/avatar2.png';
import avatar3 from '../assets/avatars/avatar3.png';
import avatar4 from '../assets/avatars/avatar4.png';
import avatar5 from '../assets/avatars/avatar5.png';
import avatar6 from '../assets/avatars/avatar6.png';
import avatar7 from '../assets/avatars/avatar7.png';
import avatar8 from '../assets/avatars/avatar8.png';
import avatar9 from '../assets/avatars/avatar9.png';
import avatar10 from '../assets/avatars/avatar10.png';
import avatar11 from '../assets/avatars/avatar11.png';
import avatar12 from '../assets/avatars/avatar12.png';
import avatar13 from '../assets/avatars/avatar13.png';
import avatar14 from '../assets/avatars/avatar14.png';
import avatar15 from '../assets/avatars/avatar15.png';

const AVATAR_MAP = {
  'avatar1.png': avatar1,
  'avatar2.png': avatar2,
  'avatar3.png': avatar3,
  'avatar4.png': avatar4,
  'avatar5.png': avatar5,
  'avatar6.png': avatar6,
  'avatar7.png': avatar7,
  'avatar8.png': avatar8,
  'avatar9.png': avatar9,
  'avatar10.png': avatar10,
  'avatar11.png': avatar11,
  'avatar12.png': avatar12,
  'avatar13.png': avatar13,
  'avatar14.png': avatar14,
  'avatar15.png': avatar15,
};

/**
 * Compresses an image file into a base64 string suitable for localStorage.
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
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Resolves avatar filenames or data URLs into valid browser image URLs
 * @param {string} avatar Filename (e.g., 'avatar1.png'), data URL, or HTTP link
 * @returns {string} Resolved image URL
 */
export const getAvatarPath = (avatar) => {
  if (!avatar) return avatar1;
  if (typeof avatar === 'string' && (avatar.startsWith('data:image/') || avatar.startsWith('http://') || avatar.startsWith('https://'))) {
    return avatar;
  }

  const filename = String(avatar).split('/').pop();
  return AVATAR_MAP[filename] || avatar1;
};
