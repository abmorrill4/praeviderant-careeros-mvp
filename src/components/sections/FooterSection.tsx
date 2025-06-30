
const FooterSection = () => {
  return (
    <footer className="bg-career-panel py-8 px-6 rounded-lg mt-8">
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        <div>
          <p className="text-career-text-muted text-sm">
            © 2024 Praeviderant. Built for humans, not templates.
          </p>
        </div>
        
        <div className="flex gap-6">
          <a href="#" className="text-career-text-muted hover:text-career-accent text-sm transition-colors duration-200">
            Privacy
          </a>
          <a href="#" className="text-career-text-muted hover:text-career-accent text-sm transition-colors duration-200">
            Terms
          </a>
          <a href="#" className="text-career-text-muted hover:text-career-accent text-sm transition-colors duration-200">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
