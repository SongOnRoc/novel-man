/**
 * @file Type Utilities
 * @description This file contains generic utility types that can be reused across the application.
 */

/**
 * A utility type to recursively convert snake_case keys of an object to camelCase.
 * e.g., { user_id: 1, created_at: "..." } => { userId: 1, createdAt: "..." }
 */
export type SnakeToCamel<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamel<U>>}`
  : S;

export type SnakeToCamelCase<T> = T extends object
  ? {
      [K in keyof T as SnakeToCamel<K & string>]: SnakeToCamelCase<T[K]>;
    }
  : T;