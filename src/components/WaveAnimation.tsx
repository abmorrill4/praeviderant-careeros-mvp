
const WaveAnimation = () => {
  return (
    <div className="flex items-end justify-center h-full w-full overflow-hidden">
      <div className="flex space-x-1 items-end h-32">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className="bg-gradient-to-t from-career-mint to-career-mint-dark rounded-t-sm"
            style={{
              width: '4px',
              height: `${Math.random() * 60 + 20}px`,
              animationDelay: `${i * 0.1}s`,
            }}
            className="bg-career-mint animate-wave"
          />
        ))}
      </div>
    </div>
  );
};

export default WaveAnimation;
