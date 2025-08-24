"use client";
import { useEffect, useState } from 'react';
import { ProspectCriteriaEditor } from './prospect-criteria-editor';
import { ProspectEnrichmentsEditor } from './prospect-enrichments-editor';
import { ProspectGrid } from './prospect-grid';
import { ProspectSearchProgress } from './prospect-search-progress';
import { ProspectSearchSummary } from './prospect-search-summary';

export interface ProspectSearchBuilderProps {
  initialCriteria?: any[];
  initialEnrichments?: any[];
  initialCustomEnrichments?: any[];
  initialEntityType?: 'person' | 'company';
  initialCount?: number;
  onRunSearch?: (criteria: any[], enrichments: any[], entityType: string, count: number) => void;
}

export function ProspectSearchBuilder({
  initialCriteria = [],
  initialEnrichments = [
    { label: 'Job Title', value: 'jobTitle' },
    { label: 'Full Name', value: 'fullName' },
    { label: 'Company Name', value: 'company' },
    { label: 'Email Address', value: 'email' },
    { label: 'LinkedIn URL', value: 'linkedin' },
  ],
  initialCustomEnrichments = [],
  initialEntityType = 'person',
  initialCount = 25,
  onRunSearch
}: ProspectSearchBuilderProps) {
  const [criteria, setCriteria] = useState<any[]>(initialCriteria);
  const [enrichments, setEnrichments] = useState<any[]>(initialEnrichments);
  const [customEnrichments, setCustomEnrichments] = useState<any[]>(initialCustomEnrichments);
  const [entityType, setEntityType] = useState<'person' | 'company'>(initialEntityType);
  const [count, setCount] = useState<number>(initialCount);
  const [staged, setStaged] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [progress, setProgress] = useState<{ analyzed: number; found: number; status: string } | null>(null);

  useEffect(() => {
    setCriteria(initialCriteria);
  }, [initialCriteria]);
  useEffect(() => {
    setEnrichments(initialEnrichments);
  }, [initialEnrichments]);
  useEffect(() => {
    setCustomEnrichments(initialCustomEnrichments);
  }, [initialCustomEnrichments]);
  useEffect(() => {
    setEntityType(initialEntityType);
  }, [initialEntityType]);
  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  const handleRunSearch = async () => {
    setStaged(true);
    setSearching(true);
    setResults([]);
    setProgress({ analyzed: 0, found: 0, status: 'running' });
    if (onRunSearch) {
      onRunSearch(criteria, enrichments.concat(customEnrichments), entityType, count);
    }
    // ProspectSearchProgress will handle polling and update results/progress
  };

  const handlePreviewOne = async () => {
    setStaged(true);
    setSearching(true);
    setResults([]);
    setProgress({ analyzed: 0, found: 0, status: 'running' });
    if (onRunSearch) {
      onRunSearch(criteria, enrichments.concat(customEnrichments), entityType, 1);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold mb-2">Prospect Search Builder</h2>
        {/* Simple stepper */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className={staged ? 'font-medium text-gray-900' : ''}>1. Configure</span>
          <span>›</span>
          <span className={results.length > 0 ? 'font-medium text-gray-900' : ''}>2. Preview</span>
          <span>›</span>
          <span>3. Run</span>
          <span>›</span>
          <span>4. Draft</span>
          <span>›</span>
          <span>5. Send</span>
        </div>
      </div>
      <div className="flex gap-4 mb-2">
        <label className="flex items-center gap-2">
          Entity:
          <select value={entityType} onChange={e => setEntityType(e.target.value as any)} className="border rounded px-2 py-1">
            <option value="person">People</option>
            <option value="company">Companies</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          Count:
          <input type="number" min={1} max={100} value={count} onChange={e => setCount(Number(e.target.value))} className="border rounded px-2 py-1 w-20" />
        </label>
      </div>
      <ProspectCriteriaEditor criteria={criteria} setCriteria={setCriteria} />
      <ProspectEnrichmentsEditor enrichments={enrichments} setEnrichments={setEnrichments} customEnrichments={customEnrichments} setCustomEnrichments={setCustomEnrichments} />
      <ProspectSearchSummary criteria={criteria} enrichments={enrichments.concat(customEnrichments)} />
      {!staged && (
        <div className="flex items-center gap-3">
          <button className="btn btn-outline w-fit" onClick={handlePreviewOne} disabled={searching}>
            Preview 1
          </button>
          <button className="btn btn-primary w-fit" onClick={handleRunSearch} disabled={searching}>
            Run Search
          </button>
        </div>
      )}
      {staged && (
        <ProspectSearchProgress
          criteria={criteria}
          enrichments={enrichments.concat(customEnrichments)}
          entityType={entityType}
          count={count}
          onResults={(res, prog) => {
            setResults(res);
            setProgress(prog);
            if (prog.status === 'completed') setSearching(false);
          }}
        />
      )}
      {results.length > 0 && <ProspectGrid prospects={results} />}
    </div>
  );
} 