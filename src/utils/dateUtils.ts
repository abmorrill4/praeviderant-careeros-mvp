
import { format, parseISO, differenceInYears, differenceInMonths } from 'date-fns';

export function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate) return 'Unknown';
  
  const start = startDate;
  const end = endDate || 'Present';
  
  return `${start} - ${end}`;
}

export function calculateExperienceYears(workExperiences: Array<{ start_date?: string; end_date?: string }>): number {
  if (!workExperiences || workExperiences.length === 0) {
    return 0;
  }

  let totalMonths = 0;

  workExperiences.forEach(exp => {
    if (!exp.start_date) return;

    try {
      // Handle various date formats
      const startDate = parseFlexibleDate(exp.start_date);
      const endDate = exp.end_date ? parseFlexibleDate(exp.end_date) : new Date();
      
      if (startDate && endDate) {
        const months = differenceInMonths(endDate, startDate);
        totalMonths += Math.max(0, months);
      }
    } catch (error) {
      console.warn('Error parsing dates for experience:', exp, error);
    }
  });

  return Math.round((totalMonths / 12) * 10) / 10; // Round to 1 decimal place
}

export function formatExperienceYears(years: number): string {
  if (years === 0) return '0 years';
  if (years < 1) return '< 1 year';
  if (years === 1) return '1 year';
  return `${years} years`;
}

function parseFlexibleDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  try {
    // Try ISO format first
    if (dateString.includes('-') && dateString.length >= 7) {
      return parseISO(dateString);
    }
    
    // Handle "Month Year" format like "January 2020"
    const monthYearMatch = dateString.match(/^(\w+)\s+(\d{4})$/);
    if (monthYearMatch) {
      const [, month, year] = monthYearMatch;
      const monthIndex = getMonthIndex(month);
      if (monthIndex !== -1) {
        return new Date(parseInt(year), monthIndex, 1);
      }
    }
    
    // Handle "Year" format like "2020"
    const yearMatch = dateString.match(/^(\d{4})$/);
    if (yearMatch) {
      return new Date(parseInt(yearMatch[1]), 0, 1);
    }
    
    // Handle "MM/YYYY" format
    const mmYearMatch = dateString.match(/^(\d{1,2})\/(\d{4})$/);
    if (mmYearMatch) {
      const [, month, year] = mmYearMatch;
      return new Date(parseInt(year), parseInt(month) - 1, 1);
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to parse date:', dateString, error);
    return null;
  }
}

function getMonthIndex(monthName: string): number {
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  
  return months.findIndex(month => 
    month.startsWith(monthName.toLowerCase().substring(0, 3))
  );
}
