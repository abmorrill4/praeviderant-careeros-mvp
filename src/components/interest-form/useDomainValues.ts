
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DomainValue {
  id: string;
  category: string;
  value: string;
  display_order: number;
}

export const useDomainValues = (isOpen: boolean) => {
  const [domainValues, setDomainValues] = useState<DomainValue[]>([]);

  useEffect(() => {
    const fetchDomainValues = async () => {
      const { data, error } = await supabase
        .from('domain_values')
        .select('*')
        .eq('is_active', true)
        .order('category, display_order');

      if (error) {
        console.error('Error fetching domain values:', error);
      } else {
        setDomainValues(data || []);
      }
    };

    if (isOpen) {
      fetchDomainValues();
    }
  }, [isOpen]);

  const getDomainValuesByCategory = (category: string) => {
    return domainValues.filter(item => item.category === category);
  };

  return {
    domainValues,
    getDomainValuesByCategory,
  };
};
