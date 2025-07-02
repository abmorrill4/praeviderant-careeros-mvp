import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FlexibleDatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function FlexibleDatePicker({
  value = "",
  onChange,
  placeholder = "Select date",
  className,
}: FlexibleDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [granularity, setGranularity] = React.useState<"year" | "month" | "day">("day");
  const [selectedYear, setSelectedYear] = React.useState<string>("");
  const [selectedMonth, setSelectedMonth] = React.useState<string>("");
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();

  // Parse the current value when component mounts or value changes
  React.useEffect(() => {
    if (!value) {
      setSelectedYear("");
      setSelectedMonth("");
      setSelectedDate(undefined);
      return;
    }

    // Try to parse different formats
    if (/^\d{4}$/.test(value)) {
      // Year only (e.g., "2020")
      setGranularity("year");
      setSelectedYear(value);
      setSelectedMonth("");
      setSelectedDate(undefined);
    } else if (/^\d{4}-\d{2}$/.test(value)) {
      // Year-Month (e.g., "2020-01")
      setGranularity("month");
      const [year, month] = value.split("-");
      setSelectedYear(year);
      setSelectedMonth(month);
      setSelectedDate(undefined);
    } else if (/^\w+ \d{4}$/.test(value)) {
      // Month Year (e.g., "January 2020")
      setGranularity("month");
      const date = parse(value, "MMMM yyyy", new Date());
      if (isValid(date)) {
        setSelectedYear(format(date, "yyyy"));
        setSelectedMonth(format(date, "MM"));
        setSelectedDate(undefined);
      }
    } else {
      // Try full date formats
      let parsedDate: Date | undefined;
      
      // Try ISO format first
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        parsedDate = parse(value, "yyyy-MM-dd", new Date());
      }
      
      if (parsedDate && isValid(parsedDate)) {
        setGranularity("day");
        setSelectedYear(format(parsedDate, "yyyy"));
        setSelectedMonth(format(parsedDate, "MM"));
        setSelectedDate(parsedDate);
      }
    }
  }, [value]);

  const handleApply = () => {
    let result = "";
    
    if (granularity === "year" && selectedYear) {
      result = selectedYear;
    } else if (granularity === "month" && selectedYear && selectedMonth) {
      const date = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1);
      result = format(date, "MMMM yyyy");
    } else if (granularity === "day" && selectedDate) {
      result = format(selectedDate, "yyyy-MM-dd");
    }
    
    onChange(result);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setSelectedYear("");
    setSelectedMonth("");
    setSelectedDate(undefined);
    setIsOpen(false);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, "0"),
    label: format(new Date(2000, i, 1), "MMMM"),
  }));

  const formatDisplayValue = () => {
    if (!value) return placeholder;
    return value;
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
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date precision</Label>
            <Select value={granularity} onValueChange={(value: "year" | "month" | "day") => setGranularity(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="year">Year only</SelectItem>
                <SelectItem value="month">Month and year</SelectItem>
                <SelectItem value="day">Full date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {granularity === "year" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {granularity === "month" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {years.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Month</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {granularity === "day" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className={cn("p-3 pointer-events-auto")}
                fromYear={currentYear - 50}
                toYear={currentYear + 10}
              />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={handleApply} className="flex-1">
              <Check className="mr-1 h-3 w-3" />
              Apply
            </Button>
            <Button size="sm" variant="outline" onClick={handleClear}>
              <X className="mr-1 h-3 w-3" />
              Clear
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}