"use client";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Grid3x3, List, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ProspectCard } from './prospect-card';

// Prospect interface definition
export interface Prospect {
  id: string
  exaItemId?: string
  fullName: string
  jobTitle?: string
  company?: string
  email?: string
  linkedinUrl?: string
  phone?: string
  location?: string
  industry?: string
  companySize?: string
  website?: string
  enrichments?: Record<string, any>
  note?: string
  avatarUrl?: string
  companyLogoUrl?: string
}

export function ProspectGrid({ prospects, onSelectionChange, onReviewComplete }: { prospects: Prospect[]; onSelectionChange?: (ids: string[]) => void; onReviewComplete?: () => void }) {
  const [current, setCurrent] = useState(0);
  const [feedback, setFeedback] = useState<{ [id: string]: 'good' | 'bad' }>({});
  const [notes, setNotes] = useState<{ [id: string]: string }>({});
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [selectedProspects, setSelectedProspects] = useState<Set<string>>(new Set());

  // Calculate stats (must be before any early return to keep hooks order stable)
  const reviewedCount = Object.keys(feedback).length;
  const goodCount = Object.values(feedback).filter(f => f === 'good').length;
  const badCount = Object.values(feedback).filter(f => f === 'bad').length;

  // (effects defined once above; ensure no duplicates below)

  if (!prospects || prospects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Users className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No prospects found</p>
        <p className="text-sm text-gray-400">Try adjusting your search criteria</p>
      </div>
    );
  }

  const prospect = prospects[current];
  const progressPercentage = ((current + 1) / prospects.length) * 100;

  const handleFeedback = (type: 'good' | 'bad') => {
    setFeedback({ ...feedback, [prospect.id]: type });
    if (current < prospects.length - 1) {
      setCurrent(current + 1);
    }
  };
  
  const handleNote = (id: string, n: string) => setNotes({ ...notes, [id]: n });
  
  const handleProspectSelect = (prospectId: string, selected: boolean) => {
    const newSelected = new Set(selectedProspects);
    if (selected) {
      newSelected.add(prospectId);
    } else {
      newSelected.delete(prospectId);
    }
    setSelectedProspects(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  };

  const navigateProspect = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && current > 0) {
      setCurrent(current - 1);
    } else if (direction === 'next' && current < prospects.length - 1) {
      setCurrent(current + 1);
    }
  };

  // Notify parent when selection changes (good fits)
  useEffect(() => {
    const goodIds = Object.entries(feedback)
      .filter(([, val]) => val === 'good')
      .map(([id]) => id)
    onSelectionChange?.(goodIds)
  }, [feedback, onSelectionChange])

  // Notify parent when review is complete
  useEffect(() => {
    if (reviewedCount === prospects.length && prospects.length > 0) {
      onReviewComplete?.()
    }
  }, [reviewedCount, prospects.length, onReviewComplete])

  if (viewMode === 'grid') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              {prospects.length} Prospects Found
            </h3>
            <Badge variant="secondary">
              {selectedProspects.size} Selected
            </Badge>
          </div>
          <Button
            onClick={() => setViewMode('single')}
            variant="outline"
            size="sm"
          >
            <List className="w-4 h-4 mr-1" />
            Single View
          </Button>
        </div>

        {/* Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {prospects.map((prospect, index) => (
              <motion.div
                key={prospect.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ProspectCard
                  prospect={prospect}
                  note={notes[prospect.id] || ''}
                  onNoteChange={n => handleNote(prospect.id, n)}
                  onSelect={(selected) => handleProspectSelect(prospect.id, selected)}
                  selected={selectedProspects.has(prospect.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Bulk Actions */}
        {selectedProspects.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border p-4 flex items-center gap-4"
          >
            <span className="text-sm font-medium text-gray-700">
              {selectedProspects.size} prospects selected
            </span>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              Create Campaign
            </Button>
            <Button size="sm" variant="outline">
              Export List
            </Button>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Prospect Review
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {current + 1} of {prospects.length}
              </Badge>
              {reviewedCount > 0 && (
                <>
                  <Badge variant="default" className="bg-green-600">
                    {goodCount} Good
                  </Badge>
                  <Badge variant="secondary" className="bg-red-100 text-red-700">
                    {badCount} Skip
                  </Badge>
                </>
              )}
            </div>
          </div>
          <Button
            onClick={() => setViewMode('grid')}
            variant="outline"
            size="sm"
          >
            <Grid3x3 className="w-4 h-4 mr-1" />
            Grid View
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Review Progress</span>
            <span className="font-medium">{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Single Prospect View */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          <ProspectCard
            prospect={prospect}
            note={notes[prospect.id] || ''}
            onNoteChange={n => handleNote(prospect.id, n)}
            onFeedback={handleFeedback}
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <Button
          onClick={() => navigateProspect('prev')}
          disabled={current === 0}
          variant="outline"
          size="sm"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        
        <div className="flex items-center gap-1">
          {prospects.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === current 
                  ? 'bg-blue-600' 
                  : feedback[prospects[index].id]
                    ? feedback[prospects[index].id] === 'good'
                      ? 'bg-green-400'
                      : 'bg-red-400'
                    : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        <Button
          onClick={() => navigateProspect('next')}
          disabled={current === prospects.length - 1}
          variant="outline"
          size="sm"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Summary */}
      {reviewedCount === prospects.length && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-6 text-center"
        >
          <h4 className="text-lg font-semibold text-green-900 mb-2">
            🎉 Review Complete!
          </h4>
          <p className="text-sm text-green-700 mb-4">
            You&apos;ve reviewed all {prospects.length} prospects. Found {goodCount} good fits!
          </p>
          <Button className="bg-green-600 hover:bg-green-700">
            Create Email Campaign
          </Button>
        </motion.div>
      )}
    </div>
  );
}