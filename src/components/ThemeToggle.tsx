
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="fixed top-6 right-6 z-50 flex items-center space-x-3">
      <Sun className={`h-4 w-4 transition-opacity ${theme === 'light' ? 'opacity-100' : 'opacity-50'}`} />
      <Switch
        checked={theme === 'dark'}
        onCheckedChange={toggleTheme}
        className="data-[state=checked]:bg-career-accent data-[state=unchecked]:bg-career-gray-light"
      />
      <Moon className={`h-4 w-4 transition-opacity ${theme === 'dark' ? 'opacity-100' : 'opacity-50'}`} />
    </div>
  );
};

export default ThemeToggle;
