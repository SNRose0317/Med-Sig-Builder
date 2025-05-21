/**
 * This file provides adapter functions to convert between 
 * snake_case database column names and camelCase JavaScript properties
 */

/**
 * Convert camelCase to snake_case
 */
export const camelToSnake = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

/**
 * Convert snake_case to camelCase
 */
export const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Convert object keys from camelCase to snake_case
 */
export const objectToDatabaseFormat = (obj: Record<string, any>): Record<string, any> => {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  const result: Record<string, any> = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const snakeKey = camelToSnake(key);
    
    // Handle nested objects and arrays
    if (value !== null && typeof value === 'object') {
      if (Array.isArray(value)) {
        // For arrays, convert each object in the array
        result[snakeKey] = value.map(item => 
          typeof item === 'object' && item !== null 
            ? objectToDatabaseFormat(item) 
            : item
        );
      } else {
        // For objects, recursively convert
        result[snakeKey] = objectToDatabaseFormat(value);
      }
    } else {
      result[snakeKey] = value;
    }
  });
  
  return result;
};

/**
 * Convert object keys from snake_case to camelCase
 */
export const objectToApplicationFormat = (obj: Record<string, any>): Record<string, any> => {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  const result: Record<string, any> = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const camelKey = snakeToCamel(key);
    
    // Handle nested objects and arrays
    if (value !== null && typeof value === 'object') {
      if (Array.isArray(value)) {
        // For arrays, convert each object in the array
        result[camelKey] = value.map(item => 
          typeof item === 'object' && item !== null 
            ? objectToApplicationFormat(item) 
            : item
        );
      } else {
        // For objects, recursively convert
        result[camelKey] = objectToApplicationFormat(value);
      }
    } else {
      result[camelKey] = value;
    }
  });
  
  return result;
};
