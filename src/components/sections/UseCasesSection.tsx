
const UseCasesSection = () => {
  const useCases = [
    {
      icon: "🎯",
      title: "The Builder",
      description: "Product manager shaping systems behind the scenes"
    },
    {
      icon: "🧠",
      title: "The Rebooter", 
      description: "Academic pivoting into industry"
    },
    {
      icon: "🪖",
      title: "The Veteran",
      description: "Translating service into strategy"
    },
    {
      icon: "👩‍👧",
      title: "The Returner",
      description: "Re-entering the workforce with even more to offer"
    },
    {
      icon: "🧑‍💻",
      title: "The Self-Taught",
      description: "No credentials. No apologies. Just real work."
    }
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-career-text">
          Made for Real People With Real Stories
        </h2>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {useCases.map((useCase, index) => (
          <div
            key={index}
            className="p-6 rounded-xl bg-career-panel border border-opacity-20 hover:border-career-accent transition-all duration-300 text-center"
          >
            <div className="text-4xl mb-4">{useCase.icon}</div>
            <h3 className="text-xl font-bold mb-2 text-career-text">
              {useCase.title}
            </h3>
            <p className="text-career-text-muted">
              {useCase.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default UseCasesSection;
