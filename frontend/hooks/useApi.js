"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const load = useCallback(async (silent = false) => {
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try { setState({ data: await api(path), error: null, loading: false }); }
    catch (e) { setState((s) => (silent ? s : { data: null, error: e.message, loading: false })); }
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: () => load(), refresh: () => load(true) };
}