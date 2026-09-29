import { useState, useEffect } from 'react';

/**
 * Standard debounce function to delay executing a callback until after `delay` ms
 * have elapsed since the last time it was invoked.
 *
 * @param {Function} fn - The callback function to debounce.
 * @param {number} delay - Delay in milliseconds (default 300ms).
 * @returns {Function} Debounced function with a .cancel() method.
 */
export function debounce(fn, delay = 300) {
  let timer = null;
  const debounced = function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  return debounced;
}

/**
 * Custom React Hook for debouncing any state / search input value across the project.
 * Automatically delays updating the returned debounced value until after `delay` ms
 * of input inactivity.
 *
 * @param {any} value - The input / search string value.
 * @param {number} delay - Debounce delay in milliseconds (default 300ms).
 * @returns {any} The debounced value.
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default debounce;
