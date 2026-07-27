import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

interface State<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches a GET endpoint and re-fetches when `deps` change.
 *
 * Deliberately minimal — the app has no client cache and each page owns its own
 * data, so a query library would be more machinery than this needs.
 */
export function useApi<T>(path: string | null, deps: unknown[] = []) {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null });

  const refetch = useCallback(() => {
    if (path === null) {
      setState({ data: null, loading: false, error: null });
      return () => {};
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .get<T>(path)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : "Failed to load data.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);

  useEffect(() => refetch(), [refetch]);

  return { ...state, refetch };
}

/** Shared empty/error/loading presentation so every page behaves the same. */
export function statusMessage(loading: boolean, error: string | null): string | null {
  if (loading) return "Loading…";
  if (error) return error;
  return null;
}
