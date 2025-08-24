"use client";

export function ProspectSearchSummary({ criteria, enrichments }: { criteria: any[]; enrichments: any[] }) {
  return (
    <div className="border rounded-xl p-3 bg-blue-50/60 mb-2 shadow-sm">
      <div className="font-semibold mb-1">Search Preview</div>
      <div className="mb-1">
        <span className="text-muted-foreground">Criteria:</span>
        {criteria.length === 0 ? <span className="ml-2 italic">None</span> :
          <span className="ml-2">{criteria.map(c => c.label).join('; ')}</span>}
      </div>
      <div>
        <span className="text-muted-foreground">Enrichments:</span>
        {enrichments.length === 0 ? <span className="ml-2 italic">None</span> :
          <span className="ml-2">{enrichments.map(e => e.label).join(', ')}</span>}
      </div>
    </div>
  );
} 