
import { useTheme } from "@/contexts/ThemeContext";

const FooterSection = () => {
  const { theme } = useTheme();

  return (
    <footer className={`${theme === 'dark' ? 'bg-career-panel-dark' : 'bg-career-panel-light'} py-8 px-6 rounded-lg mt-8`}>
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        <div>
          <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} text-sm`}>
            © 2024 Praeviderant. Built for humans, not templates.
          </p>
        </div>
        
        <div className="flex gap-6">
          <a href="#" className={`${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-accent' : 'text-career-text-muted-light hover:text-career-accent'} text-sm transition-colors duration-200`}>
            Privacy
          </a>
          <a href="#" className={`${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-accent' : 'text-career-text-muted-light hover:text-career-accent'} text-sm transition-colors duration-200`}>
            Terms
          </a>
          <a href="#" className={`${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-accent' : 'text-career-text-muted-light hover:text-career-accent'} text-sm transition-colors duration-200`}>
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
