import { useEffect, useState } from "react";

const useLocalStorage = <T>(
  key: string,
  initialValue: T,
  // eslint-disable-next-line no-unused-vars
): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try {
          setStoredValue(JSON.parse(event.newValue) as T);
        } catch (error) {
          console.error(`Error parsing stored value for key "${key}":`, error);
        }
      }
    };

    if (typeof window !== "undefined") {
      // Set the initial value from localStorage in case it was updated by another tab/window before this hook mounted
      // or if the initialValue function was slow.
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item) as T);
        }
      } catch (error) {
        console.error(`Error reading localStorage key "${key}" on mount:`, error);
      }

      window.addEventListener("storage", handleStorageChange);
      return () => {
        window.removeEventListener("storage", handleStorageChange);
      };
    }
    return () => {};
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    if (typeof window === "undefined") {
      console.warn("localStorage is not available during SSR");
      return;
    }
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      // Dispatch a custom event to notify other instances of this hook in the same window/tab
      // This is because the 'storage' event doesn't fire for changes made in the same window.
      window.dispatchEvent(new StorageEvent("storage", { key: key, newValue: JSON.stringify(valueToStore) }));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue as (value: T) => void];
};

export default useLocalStorage;
