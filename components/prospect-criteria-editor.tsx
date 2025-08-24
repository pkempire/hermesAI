"use client";

export function ProspectCriteriaEditor({ criteria, setCriteria }: { criteria: any[]; setCriteria: (c: any[]) => void }) {
  const handleAdd = () => {
    const value = prompt('Enter new search criterion (e.g., "CTO at fintech companies")');
    if (value) setCriteria([...criteria, { label: value, value }]);
  };
  const handleRemove = (idx: number) => setCriteria(criteria.filter((_, i) => i !== idx));
  return (
    <div>
      <div className="font-semibold mb-1">Search Criteria</div>
      <div className="flex flex-wrap gap-2 mb-2">
        {criteria.map((c, i) => (
          <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
            {c.label}
            <button className="ml-1 text-xs" onClick={() => handleRemove(i)}>&times;</button>
          </span>
        ))}
        <button className="btn btn-xs btn-outline" onClick={handleAdd}>+ Add</button>
      </div>
    </div>
  );
} 