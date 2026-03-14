"use client";
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useState } from 'react';
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
  const [criteria, setCriteria] = useState<any[]>(() => initialCriteria);
  const [enrichments, setEnrichments] = useState<any[]>(() => initialEnrichments);
  const [customEnrichments, setCustomEnrichments] = useState<any[]>(() => initialCustomEnrichments);
  const [entityType, setEntityType] = useState<'person' | 'company'>(() => initialEntityType);
  const [count, setCount] = useState<number>(() => initialCount);
  const [staged, setStaged] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [progress, setProgress] = useState<{ analyzed: number; found: number; status: string } | null>(null);

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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-[2rem] border border-black/5 bg-white/60 p-5 shadow-[0_24px_80px_rgba(62,45,18,0.06)] backdrop-blur-sm md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-black/40">Build the brief</div>
          <h2 className="mt-2 font-serif text-3xl text-gray-950">Prospect Search Builder</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
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
      <div className="mb-2 flex flex-col gap-4 sm:flex-row">
        <label className="flex items-center gap-2 text-sm text-black/70">
          Entity:
          <select value={entityType} onChange={e => setEntityType(e.target.value as any)} className="h-11 rounded-xl border border-input/80 bg-white/90 px-4 py-2 shadow-sm">
            <option value="person">People</option>
            <option value="company">Companies</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-black/70">
          Count:
          <Input type="number" min={1} max={100} value={count} onChange={e => setCount(Number(e.target.value))} className="w-24" />
        </label>
      </div>
      <ProspectCriteriaEditor criteria={criteria} setCriteria={setCriteria} />
      <ProspectEnrichmentsEditor enrichments={enrichments} setEnrichments={setEnrichments} customEnrichments={customEnrichments} setCustomEnrichments={setCustomEnrichments} />
      <ProspectSearchSummary criteria={criteria} enrichments={enrichments.concat(customEnrichments)} />
      {!staged && (
        <div className="flex items-center gap-3">
          <Button variant="outline" className="w-fit" onClick={handlePreviewOne} disabled={searching}>
            Preview 1
          </Button>
          <Button className="w-fit bg-black text-white hover:bg-black/90" onClick={handleRunSearch} disabled={searching}>
            Run Search
          </Button>
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
