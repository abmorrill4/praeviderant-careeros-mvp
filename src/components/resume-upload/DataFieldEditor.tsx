
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Save, X, Check } from 'lucide-react';

interface DataFieldEditorProps {
  field: {
    id: string;
    field_name: string;
    raw_value: string;
    confidence_score: number;
    parsedData: any;
    displayName: string;
  };
  onSave: (fieldId: string, newData: any) => void;
  onCancel: () => void;
}

export const DataFieldEditor: React.FC<DataFieldEditorProps> = ({
  field,
  onSave,
  onCancel
}) => {
  const [editedData, setEditedData] = useState(field.parsedData);
  const [isMultiline, setIsMultiline] = useState(
    typeof field.parsedData === 'string' && field.parsedData.length > 100
  );

  const handleSave = () => {
    onSave(field.id, editedData);
  };

  const renderEditor = () => {
    if (typeof editedData === 'object' && editedData !== null) {
      return (
        <div className="space-y-3">
          {Object.entries(editedData).map(([key, value]) => (
            <div key={key} className="grid grid-cols-3 gap-2 items-center">
              <label className="text-sm font-medium text-gray-600 capitalize">
                {key.replace(/_/g, ' ')}:
              </label>
              <div className="col-span-2">
                <Input
                  value={String(value || '')}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    [key]: e.target.value
                  })}
                  className="w-full"
                />
              </div>
            </div>
          ))}
        </div>
      );
    }

    return isMultiline ? (
      <Textarea
        value={String(editedData)}
        onChange={(e) => setEditedData(e.target.value)}
        className="min-h-[100px] w-full"
        placeholder="Enter field value..."
      />
    ) : (
      <Input
        value={String(editedData)}
        onChange={(e) => setEditedData(e.target.value)}
        className="w-full"
        placeholder="Enter field value..."
      />
    );
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-blue-900">Editing: {field.displayName}</h4>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsMultiline(!isMultiline)}
            className="text-xs"
          >
            {isMultiline ? 'Single Line' : 'Multi Line'}
          </Button>
        </div>
      </div>

      {renderEditor()}

      <div className="flex gap-2 pt-2">
        <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700">
          <Check className="w-4 h-4 mr-1" />
          Save Changes
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  );
};
