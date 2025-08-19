import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { camelCase, snakeCase, isObject, transform } from "lodash";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// =================================================================
// Key Transformation Utilities
// =================================================================

const deepTransformKeys = (
  obj: any,
  transformer: (key: string) => string
): any => {
  if (Array.isArray(obj)) {
    return obj.map((v) => deepTransformKeys(v, transformer));
  } else if (isObject(obj) && obj !== null && !(obj instanceof Date)) {
    return transform(
      obj,
      (result: { [key: string]: any }, value: any, key: string) => {
        const newKey = transformer(key);
        result[newKey] = deepTransformKeys(value, transformer);
      }
    );
  }
  return obj;
};

export const toSnakeCase = (obj: any) => deepTransformKeys(obj, snakeCase);
export const toCamelCase = (obj: any) => deepTransformKeys(obj, camelCase);

export function formatDate(dateString?: string | null): string {
  if (!dateString) {
    return "N/A";
  }

  try {
    // Attempt to parse the date string.
    // The main issue with strings like "2025-08-06T21:22:16.4597736+08:00"
    // is the high-precision fractional seconds, which JS Date constructor may not handle.
    // We can truncate the fractional seconds to a more standard 3 digits (milliseconds).
    const sanitizedDateString = dateString.replace(/(\.\d{3})\d+/, "$1");
    const date = new Date(sanitizedDateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    return "Invalid Date";
  }
}
