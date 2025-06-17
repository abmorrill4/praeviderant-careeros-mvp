
import { useTheme } from "@/contexts/ThemeContext";

const ComparisonSection = () => {
  const { theme } = useTheme();

  return (
    <section className="py-16 md:py-24">
      <div className="text-center mb-12">
        <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
          We Don't Do Templates
        </h2>
      </div>

      <div className={`${theme === 'dark' ? 'bg-career-panel-dark' : 'bg-career-panel-light'} p-8 rounded-xl border border-opacity-20 overflow-x-auto`}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-career-accent border-opacity-30">
              <th className={`text-left py-4 text-xl font-bold text-career-accent`}>
                Praeviderant
              </th>
              <th className={`text-left py-4 text-xl font-bold ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                Traditional Tools
              </th>
            </tr>
          </thead>
          <tbody className="space-y-4">
            <tr className="border-b border-opacity-10 border-gray-500">
              <td className={`py-4 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                Learns from voice & context
              </td>
              <td className={`py-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                Fills in a form
              </td>
            </tr>
            <tr className="border-b border-opacity-10 border-gray-500">
              <td className={`py-4 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                Grows with your story
              </td>
              <td className={`py-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                Resets every time
              </td>
            </tr>
            <tr className="border-b border-opacity-10 border-gray-500">
              <td className={`py-4 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                Maintains your voice
              </td>
              <td className={`py-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                Sounds like ChatGPT
              </td>
            </tr>
            <tr className="border-b border-opacity-10 border-gray-500">
              <td className={`py-4 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                Helps overcome internal bias
              </td>
              <td className={`py-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                Leaves you guessing
              </td>
            </tr>
            <tr>
              <td className={`py-4 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                Accessible, voice-first
              </td>
              <td className={`py-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                Keyboard-heavy, form-centric
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ComparisonSection;
