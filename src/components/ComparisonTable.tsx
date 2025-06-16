
import { useTheme } from "@/contexts/ThemeContext";

const ComparisonTable = () => {
  const { theme } = useTheme();

  const comparisons = [
    {
      careerOS: "Learns from your full story",
      traditional: "Static form input"
    },
    {
      careerOS: "Resume updates in real time",
      traditional: "No visibility until export"
    },
    {
      careerOS: "Interview-style experience",
      traditional: "Bland templates with filler text"
    }
  ];

  return (
    <div className={`neumorphic-panel ${theme} p-8 overflow-hidden`}>
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className={`text-xl font-semibold mb-6 text-career-accent`}>
            CareerOS
          </h3>
          <div className="space-y-4">
            {comparisons.map((item, index) => (
              <div key={index} className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-career-gray-dark' : 'bg-career-gray-light'}`}>
                <p className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                  {item.careerOS}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
            Traditional Builders
          </h3>
          <div className="space-y-4">
            {comparisons.map((item, index) => (
              <div key={index} className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-career-gray-dark/50' : 'bg-career-gray-light/50'} opacity-60`}>
                <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                  {item.traditional}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonTable;
