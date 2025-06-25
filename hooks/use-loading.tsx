'use client';
import { useState, useCallback } from 'react';

interface UseLoadingOptions {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function useLoading(initialState = false, options: UseLoadingOptions = {}) {
  const [isLoading, setIsLoading] = useState(initialState);
  
  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);
  
  const withLoading = useCallback(async (asyncFn: () => Promise<any>) => {
    startLoading();
    try {
      const result = await asyncFn();
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);
  
  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
    options
  };
} 