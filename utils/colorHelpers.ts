import { avatarColors } from '../constants/colors';

/**
 * Generates a deterministic color from the avatarColors array based on a string (e.g., a name).
 * @param name The string to hash
 * @returns A hex color string
 */
export const getAvatarColor = (name: string): string => {
  if (!name) return avatarColors[0];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Ensure the hash is positive and within the bounds of the array
  const index = Math.abs(hash) % avatarColors.length;
  return avatarColors[index];
};

/**
 * Converts a hex color to an rgba string with the specified opacity.
 * @param hex The hex color (e.g., '#EF5350')
 * @param alpha The opacity (0 to 1)
 * @returns An rgba string
 */
export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
