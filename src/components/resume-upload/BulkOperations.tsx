
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, GitMerge, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BulkOperationsProps {
  selectedItems: Set<string>;
  totalItems: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkMerge: () => Promise<void>;
  onBulkDelete?: () => Promise<void>;
  onBulkEdit?: () => void;
}

export const BulkOperations: React.FC<BulkOperationsProps> = ({
  selectedItems,
  totalItems,
  onSelectAll,
  onClearSelection,
  onBulkMerge,
  onBulkDelete,
  onBulkEdit
}) => {
  const { toast } = useToast();

  const handleMerge = async () => {
    if (selectedItems.size === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select items to merge",
        variant: "destructive"
      });
      return;
    }

    try {
      await onBulkMerge();
      toast({
        title: "Merge Successful",
        description: `${selectedItems.size} items merged to profile`,
      });
    } catch (error) {
      toast({
        title: "Merge Failed",
        description: "Failed to merge selected items",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Bulk Operations</CardTitle>
        <CardDescription className="text-xs">
          Manage multiple items at once
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {selectedItems.size} of {totalItems} selected
            </Badge>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onSelectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={onClearSelection}>
                Clear
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleMerge}
            disabled={selectedItems.size === 0}
            className="bg-green-600 hover:bg-green-700 flex-1"
            size="sm"
          >
            <GitMerge className="w-4 h-4 mr-2" />
            Merge to Profile
          </Button>
          
          {onBulkDelete && (
            <Button
              onClick={onBulkDelete}
              disabled={selectedItems.size === 0}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          
          {onBulkEdit && (
            <Button
              onClick={onBulkEdit}
              disabled={selectedItems.size === 0}
              variant="outline"
              size="sm"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
