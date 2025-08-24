"use client";

export function ProspectEnrichmentsEditor({ enrichments, setEnrichments, customEnrichments, setCustomEnrichments }: { enrichments: any[]; setEnrichments: (e: any[]) => void; customEnrichments: any[]; setCustomEnrichments: (e: any[]) => void }) {
  const handleRemove = (idx: number) => setEnrichments(enrichments.filter((_, i) => i !== idx));
  const handleRemoveCustom = (idx: number) => setCustomEnrichments(customEnrichments.filter((_, i) => i !== idx));
  const handleAddCustom = () => {
    const label = prompt('Enter custom enrichment (e.g., "Years of Experience")');
    if (label) setCustomEnrichments([...customEnrichments, { label, value: label.toLowerCase().replace(/\s+/g, '_') }]);
  };
  return (
    <div>
      <div className="font-semibold mb-1">Enrichments</div>
      <div className="flex flex-wrap gap-2 mb-2">
        {enrichments.map((e, i) => (
          <span key={i} className="bg-purple-100 text-purple-800 px-2 py-1 rounded flex items-center gap-1">
            {e.label}
            <button className="ml-1 text-xs" onClick={() => handleRemove(i)}>&times;</button>
          </span>
        ))}
        {customEnrichments.map((e, i) => (
          <span key={i} className="bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
            {e.label}
            <button className="ml-1 text-xs" onClick={() => handleRemoveCustom(i)}>&times;</button>
          </span>
        ))}
        <button className="btn btn-xs btn-outline" onClick={handleAddCustom}>+ Custom</button>
      </div>
    </div>
  );
} 