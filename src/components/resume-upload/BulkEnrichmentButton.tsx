
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { useBulkEntryEnrichment } from '@/hooks/useBulkEntryEnrichment';
import { useEnrichmentStats } from '@/hooks/useEntryEnrichment';

interface BulkEnrichmentButtonProps {
  versionId: string;
  onComplete?: () => void;
}

export const BulkEnrichmentButton: React.FC<BulkEnrichmentButtonProps> = ({
  versionId,
  onComplete
}) => {
  const bulkEnrichMutation = useBulkEntryEnrichment();
  const { data: stats } = useEnrichmentStats(versionId);
  const [hasStarted, setHasStarted] = useState(false);

  const handleBulkEnrich = async () => {
    setHasStarted(true);
    try {
      await bulkEnrichMutation.mutateAsync(versionId);
      onComplete?.();
    } catch (error) {
      console.error('Bulk enrichment failed:', error);
    }
  };

  // Show different states based on enrichment progress
  const isFullyEnriched = stats && stats.enrichment_percentage === 100;
  const isLoading = bulkEnrichMutation.isPending;
  const hasPartialEnrichment = stats && stats.enriched_entities > 0 && stats.enrichment_percentage < 100;

  if (isFullyEnriched && !hasStarted) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="flex items-center gap-2 text-green-600 border-green-200"
      >
        <CheckCircle className="w-4 h-4" />
        All Entries Enriched
      </Button>
    );
  }

  return (
    <Button
      onClick={handleBulkEnrich}
      disabled={isLoading}
      size="sm"
      className="flex items-center gap-2"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4" />
      )}
      {isLoading 
        ? 'Enriching Entries...' 
        : hasPartialEnrichment 
          ? 'Complete Enrichment'
          : 'Enrich Work & Education'
      }
    </Button>
  );
};
