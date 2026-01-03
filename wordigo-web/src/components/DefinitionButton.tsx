import './DefinitionButton.css';

interface DefinitionButtonProps {
  definition: string;
  onClick: () => void;
  isSelected: boolean;
  isCorrect?: boolean;
  isIncorrect?: boolean;
  disabled: boolean;
  strategy?: string; // For testing purposes
  difficultyBand?: number | null; // For testing purposes
  overallDifficultyScore?: number | null; // For testing purposes
  wordInDefinition?: boolean | null; // For testing obscure words
  word?: string; // For testing purposes - the word this definition belongs to
  showMetadata?: boolean; // Control whether to show testing metadata
}

export default function DefinitionButton({
  definition,
  onClick,
  isSelected,
  isCorrect,
  isIncorrect,
  disabled,
  strategy,
  difficultyBand,
  overallDifficultyScore,
  wordInDefinition,
  word,
  showMetadata = true,
}: DefinitionButtonProps) {
  const getClassName = () => {
    let className = 'definition-button';
    if (isCorrect) className += ' correct';
    if (isIncorrect) className += ' incorrect';
    if (isSelected && !isCorrect && !isIncorrect) className += ' selected';
    if (disabled) className += ' disabled';
    return className;
  };

  const formatStrategy = (strat: string | undefined) => {
    if (!strat) return '';
    // Convert snake_case to Title Case
    return strat
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <button
      className={getClassName()}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="definition-content">
        : {definition}
        {showMetadata && (
          <div className="testing-info">
            {word && (
              <span className="word-label">
                Word: {word}
              </span>
            )}
            {strategy && (
              <span className="strategy-label">
                [{formatStrategy(strategy)}]
              </span>
            )}
            {difficultyBand !== undefined && difficultyBand !== null && (
              <span className="difficulty-label">
                Band: {difficultyBand}
              </span>
            )}
            {overallDifficultyScore !== undefined && overallDifficultyScore !== null && (
              <span className="score-label">
                Score: {overallDifficultyScore.toFixed(1)}
              </span>
            )}
            {wordInDefinition !== undefined && wordInDefinition !== null && (
              <span className="obscure-label">
                {wordInDefinition ? 'Common' : 'Obscure'}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
