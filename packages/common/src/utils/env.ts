/**
 * Safe environment variable access utilities
 * Does NOT auto-load .env files - that's the application's responsibility
 */

/**
 * Get environment variable with fallback
 * Works in both Node.js and browser environments
 */
export const getEnv = (key: string, fallback?: string): string | undefined => {
  // Check if we're in a Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[key];
    return value !== undefined ? value : fallback;
  }
  
  // Browser environment - return fallback
  return fallback;
};

/**
 * Get required environment variable
 * Throws error if not found
 */
export const getRequiredEnv = (key: string): string => {
  const value = getEnv(key);
  if (value === undefined) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
};

/**
 * Get environment variable as number
 */
export const getEnvNumber = (key: string, fallback: number): number => {
  const value = getEnv(key);
  if (value === undefined) return fallback;
  
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Get environment variable as boolean
 */
export const getEnvBoolean = (key: string, fallback: boolean): boolean => {
  const value = getEnv(key);
  if (value === undefined) return fallback;
  
  return value.toLowerCase() === 'true' || value === '1';
};
