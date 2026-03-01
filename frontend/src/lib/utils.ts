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

/**
 * Formats a number representing a word count into a human-readable string.
 * If the count is less than 10,000, it returns the number with commas.
 * If the count is 10,000 or more, it returns the number in units of "万" (ten thousands)
 * with two decimal places.
 *
 * @param count - The word count to format.
 * @returns The formatted word count string.
 */
export function formatWordCount(count: number): string {
  if (count < 10000) {
    return count.toLocaleString();
  } else {
    return `${(count / 10000).toFixed(2)}万`;
  }
}

/**
 * Strips HTML tags from a string.
 * @param html - The HTML string to strip.
 * @returns The plain text string.
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "");
}

/**
 * 可参与“按最近更新时间降序”排序的数据结构。
 */
export interface HasUpdatedAt {
  updatedAt?: string | null;
}

/**
 * 通用排序工具：按 `updatedAt` 从新到旧排序。
 *
 * 设计说明：
 * - 不修改原数组，返回排序后的新数组；
 * - `updatedAt` 为空或非法日期时按 0 处理，自动排到后面；
 * - 适用于任何包含 `updatedAt` 字段的列表。
 */
export function sortByUpdatedAtDesc<T extends HasUpdatedAt>(items: T[]): T[] {
  const toTimestamp = (value?: string | null): number => {
    if (!value) return 0;
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  };

  return [...items].sort(
    (a, b) => toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt)
  );
}
