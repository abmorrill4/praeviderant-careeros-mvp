
import { useTheme } from "@/contexts/ThemeContext";

interface ValueCardProps {
  title: string;
  description: string;
}

const ValueCard = ({ title, description }: ValueCardProps) => {
  const { theme } = useTheme();

  return (
    <div className={`neumorphic-panel ${theme} p-8 hover:scale-105 transition-transform duration-300 cursor-pointer`}>
      <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
        {title}
      </h3>
      <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} leading-relaxed`}>
        {description}
      </p>
    </div>
  );
};

export default ValueCard;
