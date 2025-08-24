"use client";
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export function ProspectSearchProgress({ criteria, enrichments, entityType, count, onResults }: { criteria: any[]; enrichments: any[]; entityType: string; count: number; onResults: (results: any[], progress: { analyzed: number; found: number; status: string }) => void }) {
  const [progress, setProgress] = useState({ analyzed: 0, found: 0, status: 'running' });
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    async function startSearch() {
      setError(null);
      setProgress({ analyzed: 0, found: 0, status: 'running' });
      setResults([]);
      // Call backend to start search
      const res = await fetch('/api/prospect-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criteria, enrichments, entityType, count })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || 'Failed to start search');
        setProgress({ analyzed: 0, found: 0, status: 'failed' });
        return;
      }
      const { websetId } = await res.json();
      // Poll for progress
      pollingRef.current = setInterval(async () => {
        const statusRes = await fetch(`/api/prospect-search/status?websetId=${websetId}`);
        if (!statusRes.ok) {
          const err = await statusRes.json().catch(() => ({}));
          setError(err.error || 'Failed to fetch status');
          setProgress({ analyzed: 0, found: 0, status: 'failed' });
          clearInterval(pollingRef.current);
          return;
        }
        const { prospects, analyzed, found, status, error: backendError } = await statusRes.json();
        setResults(prospects);
        setProgress({ analyzed, found, status });
        onResults(prospects, { analyzed, found, status });
        if (backendError) {
          setError(backendError);
          setProgress({ analyzed, found, status: 'failed' });
          clearInterval(pollingRef.current);
        }
        if (status === 'completed' || status === 'failed') {
          clearInterval(pollingRef.current);
        }
      }, 5000);
    }
    startSearch();
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    // eslint-disable-next-line
  }, []);

  return (
    <div className="w-full my-4">
      <div className="mb-2">Progress: {progress.found} found, {progress.analyzed} analyzed, status: {progress.status}</div>
      <div className="w-full bg-gray-200 rounded h-2 mb-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (progress.analyzed / 100) * 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-blue-500 h-2 rounded"
        />
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {progress.status === 'completed' && results.length === 0 && !error && (
        <div className="text-gray-600">No results found. Try broadening your criteria.</div>
      )}
    </div>
  );
} 