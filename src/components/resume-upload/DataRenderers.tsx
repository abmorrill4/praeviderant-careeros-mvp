
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronDown, 
  ChevronRight, 
  Calendar, 
  MapPin, 
  Building, 
  Mail, 
  Phone, 
  Globe,
  User,
  Briefcase,
  Code
} from 'lucide-react';
import type { ParsedData } from '@/utils/resumeDataParser';

interface DataRendererProps {
  fieldName: string;
  parsedData: ParsedData;
  confidence: number;
}

export const DataRenderer: React.FC<DataRendererProps> = ({ 
  fieldName, 
  parsedData, 
  confidence 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const renderIcon = () => {
    const field = fieldName.toLowerCase();
    if (field.includes('email')) return <Mail className="w-3 h-3" />;
    if (field.includes('phone')) return <Phone className="w-3 h-3" />;
    if (field.includes('address') || field.includes('location')) return <MapPin className="w-3 h-3" />;
    if (field.includes('website') || field.includes('url')) return <Globe className="w-3 h-3" />;
    if (field.includes('date')) return <Calendar className="w-3 h-3" />;
    if (field.includes('company') || field.includes('organization')) return <Building className="w-3 h-3" />;
    if (field.includes('name')) return <User className="w-3 h-3" />;
    if (field.includes('title') || field.includes('position')) return <Briefcase className="w-3 h-3" />;
    if (field.includes('skill') || field.includes('technology')) return <Code className="w-3 h-3" />;
    return null;
  };

  const formatObjectForDisplay = (obj: any): string => {
    if (!obj || typeof obj !== 'object') return String(obj);
    
    // Handle arrays of simple values
    if (Array.isArray(obj)) {
      return obj.map(item => typeof item === 'string' ? item : String(item)).join(', ');
    }
    
    // Handle objects by showing key-value pairs in a readable format
    const entries = Object.entries(obj);
    if (entries.length === 0) return 'No data';
    
    return entries
      .filter(([key, value]) => value !== null && value !== undefined && value !== '')
      .slice(0, 3)
      .map(([key, value]) => {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        if (Array.isArray(value)) {
          return `${formattedKey}: ${value.join(', ')}`;
        }
        return `${formattedKey}: ${String(value)}`;
      })
      .join(' • ') + (entries.length > 3 ? '...' : '');
  };

  const formatArrayItems = (items: any[]): string[] => {
    return items.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        // Extract meaningful text from objects
        if (item.name) return item.name;
        if (item.title) return item.title;
        if (item.value) return String(item.value);
        // For other objects, try to create a readable summary
        const keys = Object.keys(item);
        if (keys.length === 1) return String(item[keys[0]]);
        return keys.slice(0, 2).map(key => `${key}: ${item[key]}`).join(', ');
      }
      return String(item);
    });
  };

  switch (parsedData.type) {
    case 'array':
      const formattedItems = formatArrayItems(parsedData.value);
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {formattedItems.slice(0, 5).map((item: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {item}
              </Badge>
            ))}
            {formattedItems.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{formattedItems.length - 5} more
              </Badge>
            )}
          </div>
          {formattedItems.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 text-xs"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {isExpanded ? 'Show less' : `Show all ${formattedItems.length} items`}
            </Button>
          )}
          {isExpanded && (
            <div className="flex flex-wrap gap-1 mt-2">
              {formattedItems.slice(5).map((item: string, index: number) => (
                <Badge key={index + 5} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          )}
        </div>
      );

    case 'object':
      const formattedDisplay = formatObjectForDisplay(parsedData.value);
      return (
        <div className="space-y-2">
          <div className="text-sm">
            {formattedDisplay}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 text-xs"
          >
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {isExpanded ? 'Hide details' : 'Show details'}
          </Button>
          {isExpanded && (
            <Card className="mt-2">
              <CardContent className="p-3">
                <div className="space-y-2">
                  {Object.entries(parsedData.value).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium text-xs">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      );

    default:
      return (
        <div className="flex items-start gap-2">
          {renderIcon()}
          <span className="text-sm flex-1">{parsedData.displayValue}</span>
        </div>
      );
  }
};

interface ConfidenceBadgeProps {
  score: number;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ score }) => {
  const getVariant = () => {
    if (score >= 0.8) return 'default';
    if (score >= 0.6) return 'secondary';
    return 'outline';
  };

  const getColor = () => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Badge variant={getVariant()} className={`text-xs ${getColor()}`}>
      {Math.round(score * 100)}%
    </Badge>
  );
};
