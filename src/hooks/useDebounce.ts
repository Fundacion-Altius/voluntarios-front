import { useState, useEffect, useRef } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const ref = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (ref.current) clearTimeout(ref.current);
    ref.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      if (ref.current) clearTimeout(ref.current);
    };
  }, [value, delay]);

  return debouncedValue;
}
