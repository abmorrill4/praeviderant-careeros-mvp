
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/contexts/ThemeContext";

interface FormFieldProps {
  id: string;
  label: string;
  type?: "text" | "email" | "textarea" | "select";
  value: string | boolean;
  onChange: (value: string | boolean) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  options?: Array<{ value: string; label: string }>;
  className?: string;
}

const FormField = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  error,
  options = [],
  className = "",
}: FormFieldProps) => {
  const { theme } = useTheme();

  const inputClassName = `neumorphic-input ${theme} ${
    theme === 'dark' 
      ? 'text-career-text-dark placeholder:text-career-text-muted-dark' 
      : 'text-career-text-light placeholder:text-career-text-muted-light'
  } ${error ? 'border-red-500' : ''} ${className}`;

  const labelClassName = `${
    theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'
  } text-sm font-medium mb-1 block`;

  return (
    <div>
      <Label htmlFor={id} className={labelClassName}>
        {label} {required && "*"}
      </Label>
      
      {type === "select" ? (
        <Select value={value as string} onValueChange={(val) => onChange(val)}>
          <SelectTrigger className={inputClassName}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className={`${
            theme === 'dark' 
              ? 'bg-career-panel-dark border-career-gray-dark' 
              : 'bg-career-panel-light border-career-gray-light'
          } z-50`}>
            {options.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className={`${
                  theme === 'dark' 
                    ? 'text-career-text-dark hover:bg-career-gray-dark' 
                    : 'text-career-text-light hover:bg-career-gray-light'
                }`}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : type === "textarea" ? (
        <Textarea
          id={id}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`${inputClassName} min-h-[80px]`}
        />
      ) : (
        <Input
          id={id}
          type={type}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={inputClassName}
          required={required}
        />
      )}
      
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};

export default FormField;
