import { useEffect, useState } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T)
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const resolveInitial = () =>
      typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;

    if (typeof window === 'undefined') {
      return resolveInitial();
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : resolveInitial();
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return resolveInitial();
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
