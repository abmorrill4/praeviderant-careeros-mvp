import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon, Check, X, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface FlexibleDatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

type DateLevel = 'decades' | 'years' | 'months' | 'days';

export function FlexibleDatePicker({
  value = "",
  onChange,
  placeholder = "Select date",
  className,
}: FlexibleDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentLevel, setCurrentLevel] = React.useState<DateLevel>('decades');
  const [selectedDecade, setSelectedDecade] = React.useState<number | null>(null);
  const [selectedYear, setSelectedYear] = React.useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = React.useState<number | null>(null);
  const [selectedDay, setSelectedDay] = React.useState<number | null>(null);

  const currentYear = new Date().getFullYear();
  const currentDecade = Math.floor(currentYear / 10) * 10;

  // Parse existing value when component mounts
  React.useEffect(() => {
    if (!value) {
      resetSelection();
      return;
    }

    // Try to parse different formats
    if (/^\d{4}$/.test(value)) {
      // Year only (e.g., "2020")
      const year = parseInt(value);
      setSelectedDecade(Math.floor(year / 10) * 10);
      setSelectedYear(year);
      setSelectedMonth(null);
      setSelectedDay(null);
      setCurrentLevel('years');
    } else if (/^\w+ \d{4}$/.test(value)) {
      // Month Year (e.g., "January 2020")
      const date = parse(value, "MMMM yyyy", new Date());
      if (isValid(date)) {
        const year = date.getFullYear();
        const month = date.getMonth();
        setSelectedDecade(Math.floor(year / 10) * 10);
        setSelectedYear(year);
        setSelectedMonth(month);
        setSelectedDay(null);
        setCurrentLevel('months');
      }
    } else {
      // Try full date formats
      let parsedDate: Date | undefined;
      
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        parsedDate = parse(value, "yyyy-MM-dd", new Date());
      }
      
      if (parsedDate && isValid(parsedDate)) {
        const year = parsedDate.getFullYear();
        const month = parsedDate.getMonth();
        const day = parsedDate.getDate();
        setSelectedDecade(Math.floor(year / 10) * 10);
        setSelectedYear(year);
        setSelectedMonth(month);
        setSelectedDay(day);
        setCurrentLevel('days');
      }
    }
  }, [value]);

  const resetSelection = () => {
    setSelectedDecade(null);
    setSelectedYear(null);
    setSelectedMonth(null);
    setSelectedDay(null);
    setCurrentLevel('decades');
  };

  const handleSelect = () => {
    let result = "";
    
    if (selectedDay !== null && selectedMonth !== null && selectedYear !== null) {
      const date = new Date(selectedYear, selectedMonth, selectedDay);
      result = format(date, "yyyy-MM-dd");
    } else if (selectedMonth !== null && selectedYear !== null) {
      const date = new Date(selectedYear, selectedMonth, 1);
      result = format(date, "MMMM yyyy");
    } else if (selectedYear !== null) {
      result = selectedYear.toString();
    }
    
    onChange(result);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    resetSelection();
    setIsOpen(false);
  };

  const handleBack = () => {
    switch (currentLevel) {
      case 'years':
        setCurrentLevel('decades');
        setSelectedDecade(null);
        break;
      case 'months':
        setCurrentLevel('years');
        setSelectedMonth(null);
        break;
      case 'days':
        setCurrentLevel('months');
        setSelectedDay(null);
        break;
    }
  };

  const formatDisplayValue = () => {
    if (!value) return placeholder;
    return value;
  };

  const renderDecades = () => {
    const decades = [];
    for (let decade = 1970; decade <= currentDecade + 10; decade += 10) {
      decades.push(decade);
    }

    return (
      <div className="grid grid-cols-4 gap-2 p-2">
        {decades.map((decade) => (
          <Button
            key={decade}
            variant={selectedDecade === decade ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedDecade(decade);
              setCurrentLevel('years');
            }}
            className="h-12"
          >
            {decade}s
          </Button>
        ))}
      </div>
    );
  };

  const renderYears = () => {
    if (selectedDecade === null) return null;

    const years = [];
    for (let year = selectedDecade; year < selectedDecade + 10; year++) {
      years.push(year);
    }

    return (
      <div className="grid grid-cols-5 gap-2 p-2">
        {years.map((year) => (
          <Button
            key={year}
            variant={selectedYear === year ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedYear(year);
              setCurrentLevel('months');
            }}
            className="h-10"
          >
            {year}
          </Button>
        ))}
      </div>
    );
  };

  const renderMonths = () => {
    if (selectedYear === null) return null;

    const months = Array.from({ length: 12 }, (_, i) => ({
      index: i,
      name: format(new Date(2000, i, 1), "MMM"),
      fullName: format(new Date(2000, i, 1), "MMMM"),
    }));

    return (
      <div className="grid grid-cols-4 gap-2 p-2">
        {months.map((month) => (
          <Button
            key={month.index}
            variant={selectedMonth === month.index ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedMonth(month.index);
              setCurrentLevel('days');
            }}
            className="h-10"
          >
            {month.name}
          </Button>
        ))}
      </div>
    );
  };

  const renderDays = () => {
    if (selectedYear === null || selectedMonth === null) return null;

    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-8" />);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <Button
          key={day}
          variant={selectedDay === day ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setSelectedDay(day);
          }}
          className="h-8 w-8 p-0"
        >
          {day}
        </Button>
      );
    }

    return (
      <div className="p-2">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
            <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  const getTitle = () => {
    switch (currentLevel) {
      case 'decades':
        return 'Select Decade';
      case 'years':
        return `${selectedDecade}s`;
      case 'months':
        return selectedYear?.toString() || '';
      case 'days':
        return selectedMonth !== null && selectedYear !== null
          ? format(new Date(selectedYear, selectedMonth, 1), "MMMM yyyy")
          : '';
    }
  };

  const canSelect = () => {
    switch (currentLevel) {
      case 'decades':
        return false;
      case 'years':
        return selectedYear !== null;
      case 'months':
        return selectedMonth !== null;
      case 'days':
        return selectedDay !== null;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDisplayValue()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="min-w-[300px]">
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              {currentLevel !== 'decades' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <h3 className="font-medium">{getTitle()}</h3>
            </div>
            <div className="flex gap-1">
              {canSelect() && (
                <Button size="sm" onClick={handleSelect}>
                  <Check className="mr-1 h-3 w-3" />
                  Select
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleClear}>
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
            </div>
          </div>

          <div className="min-h-[200px]">
            {currentLevel === 'decades' && renderDecades()}
            {currentLevel === 'years' && renderYears()}
            {currentLevel === 'months' && renderMonths()}
            {currentLevel === 'days' && renderDays()}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}