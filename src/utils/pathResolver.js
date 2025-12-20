/**
 * Resolves asset paths for both web and Electron environments
 * In Electron, absolute paths starting with / need to be relative to the dist folder
 */

// Check if running in Electron
const isElectron = () => {
  return navigator.userAgent.toLowerCase().includes('electron');
};

/**
 * Resolves a path to work in both web and Electron environments
 * @param {string} path - The path to resolve (e.g., '/hands/bothhand.html')
 * @returns {string} - The resolved path
 */
export const resolveAssetPath = (path) => {
  if (!isElectron()) {
    return path; // In web, use the path as-is
  }
  
  // In Electron, convert absolute paths to relative paths
  // Remove leading slash and make it relative to current location
  if (path.startsWith('/')) {
    return '.' + path;
  }
  
  return path;
};

export default resolveAssetPath;
