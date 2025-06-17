
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

interface FinalCTASectionProps {
  onRegisterInterest: () => void;
}

const FinalCTASection = ({ onRegisterInterest }: FinalCTASectionProps) => {
  const { theme } = useTheme();

  return (
    <section className="py-16 md:py-24">
      <div className="text-center space-y-8">
        <h2 className={`text-4xl md:text-5xl font-bold leading-tight ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
          It's time your story got the tools it deserves.
        </h2>
        <p className={`text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
          Join us in building a career platform that respects who you are—and who you're becoming.
        </p>
        <Button
          onClick={onRegisterInterest}
          className={`h-14 px-12 bg-career-accent hover:bg-career-accent-dark text-white font-semibold neumorphic-button ${theme} border-0 text-lg transition-all duration-300 hover:shadow-lg relative overflow-hidden group`}
        >
          <span className="relative z-10">Register Your Interest</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000 ease-out"></div>
        </Button>
      </div>
    </section>
  );
};

export default FinalCTASection;
