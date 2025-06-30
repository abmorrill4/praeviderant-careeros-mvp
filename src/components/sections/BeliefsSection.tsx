
const BeliefsSection = () => {
  const beliefStatements = [
    "Resumes are built for machines. You are not.",
    "No one should have to flatten themselves to apply.",
    "Confidence shouldn't depend on formatting.",
    "Voice matters. Yours stays yours.",
    "Bias—yours or theirs—shouldn't dictate your options.",
    "Your resume should reflect you. Not just what you've done—but who you are becoming."
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-career-text">
          What We Believe
        </h2>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {beliefStatements.map((statement, index) => (
          <div
            key={index}
            className="p-6 rounded-xl bg-career-panel border border-opacity-20 hover:border-career-accent transition-all duration-300"
          >
            <p className="text-lg font-semibold leading-relaxed text-career-text">
              {statement}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BeliefsSection;
