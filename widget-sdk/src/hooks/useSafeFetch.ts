// hooks/useSafeFetch.ts
import { useEffect, useRef, useState } from "react";

interface UseSafeFetchOptions<T> {
  fetcher: () => Promise<T>;
  deps?: any[];
  maxFailures?: number; // circuit breaker
}

interface UseSafeFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  disabled: boolean; // true if circuit breaker tripped
}

export function useSafeFetch<T>({
  fetcher,
  deps = [],
  maxFailures = 5,
}: UseSafeFetchOptions<T>): UseSafeFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);
  const failureCountRef = useRef(0);
  const mountedRef = useRef(false);
  const disabledRef = useRef(false);

  const fetchData = async () => {
    if (isFetchingRef.current || disabledRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const res = await fetcher();
      setData(res);
      failureCountRef.current = 0;
    } catch (err: any) {
      setError(err?.message ?? "Fetch failed");
      failureCountRef.current += 1;
      if (failureCountRef.current >= maxFailures) {
        disabledRef.current = true;
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    disabled: disabledRef.current,
  };
}
