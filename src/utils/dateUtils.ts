
export function parseDate(dateString: string): Date | null {
  if (!dateString || dateString.trim() === '') {
    return null;
  }

  const cleanedDate = dateString.trim().toLowerCase();
  
  // Handle "present", "current", etc.
  if (cleanedDate.includes('present') || cleanedDate.includes('current') || cleanedDate === 'now') {
    return new Date();
  }

  // Try various date formats
  const formats = [
    // ISO format
    /^\d{4}-\d{2}-\d{2}$/,
    // Year-Month format
    /^\d{4}-\d{2}$/,
    // Year only
    /^\d{4}$/,
    // Month Year format (e.g., "January 2020", "Jan 2020")
    /^[a-zA-Z]+\s+\d{4}$/,
    // MM/YYYY format
    /^\d{1,2}\/\d{4}$/,
    // MM-YYYY format
    /^\d{1,2}-\d{4}$/
  ];

  let parsedDate: Date | null = null;

  // Try direct parsing first
  parsedDate = new Date(dateString);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  // Handle year-only format
  if (/^\d{4}$/.test(cleanedDate)) {
    return new Date(parseInt(cleanedDate), 0, 1); // January 1st of that year
  }

  // Handle year-month format (YYYY-MM)
  if (/^\d{4}-\d{2}$/.test(cleanedDate)) {
    const [year, month] = cleanedDate.split('-').map(Number);
    return new Date(year, month - 1, 1); // month is 0-indexed
  }

  // Handle MM/YYYY format
  if (/^\d{1,2}\/\d{4}$/.test(cleanedDate)) {
    const [month, year] = cleanedDate.split('/').map(Number);
    return new Date(year, month - 1, 1);
  }

  // Handle MM-YYYY format
  if (/^\d{1,2}-\d{4}$/.test(cleanedDate)) {
    const [month, year] = cleanedDate.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }

  console.warn(`Unable to parse date: "${dateString}"`);
  return null;
}

export function calculateExperienceYears(experiences: Array<{ start_date?: string; end_date?: string; title: string; company: string }>): number {
  console.log('Calculating experience years for:', experiences.length, 'experiences');
  
  if (!experiences || experiences.length === 0) {
    console.log('No experiences provided');
    return 0;
  }

  let totalYears = 0;

  for (let i = 0; i < experiences.length; i++) {
    const exp = experiences[i];
    
    console.log(`Processing experience ${i + 1}:`, {
      title: exp.title,
      company: exp.company,
      start_date: exp.start_date,
      end_date: exp.end_date
    });

    if (!exp.start_date) {
      console.warn(`Experience ${i + 1} missing start_date:`, exp.title);
      continue;
    }
    
    try {
      const start = parseDate(exp.start_date);
      const end = exp.end_date ? parseDate(exp.end_date) : new Date();
      
      if (!start) {
        console.warn(`Invalid start date for experience: ${exp.title} at ${exp.company}`, exp.start_date);
        continue;
      }
      
      if (!end) {
        console.warn(`Invalid end date for experience: ${exp.title} at ${exp.company}`, exp.end_date);
        continue;
      }
      
      // Calculate years difference more accurately
      const timeDiff = end.getTime() - start.getTime();
      
      // Handle negative time differences (invalid date ranges)
      if (timeDiff < 0) {
        console.warn(`Invalid date range for ${exp.title}: start after end`);
        continue;
      }
      
      const yearsDiff = timeDiff / (1000 * 60 * 60 * 24 * 365.25); // Use 365.25 to account for leap years
      
      console.log(`Experience duration for ${exp.title}:`, {
        start: start.toISOString(),
        end: end.toISOString(),
        years: yearsDiff.toFixed(2)
      });
      
      const validYears = Math.max(0, yearsDiff);
      totalYears += validYears;
    } catch (error) {
      console.warn(`Error calculating experience duration for ${exp.title}:`, error);
      continue;
    }
  }
  
  console.log('Total calculated years:', totalYears);
  return totalYears;
}

export function formatExperienceYears(years: number): string {
  // Handle edge cases
  if (!years || isNaN(years) || years < 0) {
    return '0';
  }
  
  if (years >= 1) {
    const wholeYears = Math.floor(years);
    const remainingMonths = Math.round((years - wholeYears) * 12);
    
    if (remainingMonths > 0) {
      return `${wholeYears}y ${remainingMonths}m`;
    } else {
      return `${wholeYears}y`;
    }
  } else if (years > 0) {
    const months = Math.round(years * 12);
    return `${months}m`;
  }
  
  return '0';
}

export function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate) return 'Unknown';
  
  const start = startDate;
  const end = endDate || 'Present';
  
  return `${start} - ${end}`;
}
