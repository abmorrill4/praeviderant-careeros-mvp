
const ComparisonSection = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-career-text">
          We Don't Do Templates
        </h2>
      </div>

      <div className="bg-career-panel p-8 rounded-xl border border-opacity-20 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-career-accent border-opacity-30">
              <th className="text-left py-4 text-xl font-bold text-career-accent">
                Praeviderant
              </th>
              <th className="text-left py-4 text-xl font-bold text-career-text-muted">
                Traditional Tools
              </th>
            </tr>
          </thead>
          <tbody className="space-y-4">
            <tr className="border-b border-opacity-10 border-gray-500">
              <td className="py-4 text-career-text">
                Learns from voice & context
              </td>
              <td className="py-4 text-career-text-muted">
                Fills in a form
              </td>
            </tr>
            <tr className="border-b border-opacity-10 border-gray-500">
              <td className="py-4 text-career-text">
                Grows with your story
              </td>
              <td className="py-4 text-career-text-muted">
                Resets every time
              </td>
            </tr>
            <tr className="border-b border-opacity-10 border-gray-500">
              <td className="py-4 text-career-text">
                Maintains your voice
              </td>
              <td className="py-4 text-career-text-muted">
                Sounds like ChatGPT
              </td>
            </tr>
            <tr className="border-b border-opacity-10 border-gray-500">
              <td className="py-4 text-career-text">
                Helps overcome internal bias
              </td>
              <td className="py-4 text-career-text-muted">
                Leaves you guessing
              </td>
            </tr>
            <tr>
              <td className="py-4 text-career-text">
                Accessible, voice-first
              </td>
              <td className="py-4 text-career-text-muted">
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
