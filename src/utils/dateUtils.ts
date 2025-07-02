
export function calculateExperienceYears(experiences: Array<{ start_date?: string; end_date?: string; title: string; company: string }>): number {
  return experiences.reduce((total, exp) => {
    if (!exp.start_date) return total;
    
    try {
      const start = new Date(exp.start_date);
      const end = exp.end_date ? new Date(exp.end_date) : new Date();
      
      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.warn(`Invalid date for experience: ${exp.title} at ${exp.company}`);
        return total;
      }
      
      // Calculate years difference more accurately
      const timeDiff = end.getTime() - start.getTime();
      const yearsDiff = timeDiff / (1000 * 60 * 60 * 24 * 365.25); // Use 365.25 to account for leap years
      
      return total + Math.max(0, yearsDiff); // Ensure we don't add negative years
    } catch (error) {
      console.warn(`Error calculating experience duration for ${exp.title}:`, error);
      return total;
    }
  }, 0);
}

export function formatExperienceYears(years: number): string {
  if (years >= 1) {
    return `${Math.floor(years)}y`;
  } else if (years > 0) {
    return `${Math.round(years * 12)}m`;
  }
  return '0';
}

export function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate) return 'Unknown';
  
  const start = startDate;
  const end = endDate || 'Present';
  
  return `${start} - ${end}`;
}
