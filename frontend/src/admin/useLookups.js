import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

// The master_* lookup tables (categories, sectors, statuses, guarantor terms, benchmarks, ...) the
// admin selects are built from. Fetched once per page load and shared by every drawer.
let cache = null;

export function useLookups() {
  const [lookups, setLookups] = useState(cache);
  useEffect(() => {
    if (cache) return;
    api.get('/admin/lookups').then(({ data }) => {
      cache = data;
      setLookups(data);
    });
  }, []);
  return lookups;
}

export const toOptions = (rows = []) => rows.map((r) => ({ value: r.id ?? r.code, label: r.label }));
