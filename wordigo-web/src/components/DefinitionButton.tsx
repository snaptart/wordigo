import './DefinitionButton.css';

/**
 * Convert syllables array to dot-separated format (e.g., ["a", "ban", "don"] => "a·ban·don")
 */
function syllablesToDots(syllables: string[] | undefined): string | undefined {
  if (!syllables || syllables.length === 0) return undefined;
  return syllables.join('·');
}

interface DefinitionButtonProps {
  definition: string;
  onClick: () => void;
  isSelected: boolean;
  isCorrect?: boolean;
  isIncorrect?: boolean;
  disabled: boolean;
  strategy?: string;
  difficultyBand?: number | null;
  overallDifficultyScore?: number | null;
  wordInDefinition?: boolean | null;
  word?: string;
  syllables?: string | string[]; // Can be formatted string or array
  pos?: string;
  posName?: string;
  ipa?: string;
  showMetadata?: boolean;
  isWinnowed?: boolean;
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
  word,
  syllables,
  pos,
  posName,
  ipa,
  showMetadata = true,
  isWinnowed = false,
}: DefinitionButtonProps) {
  const getClassName = () => {
    let className = 'definition-button';
    if (isCorrect) className += ' correct';
    if (isIncorrect) className += ' incorrect';
    if (isSelected && !isCorrect && !isIncorrect) className += ' selected';
    if (disabled) className += ' disabled';
    if (isWinnowed) className += ' winnowed';
    return className;
  };

  const formatStrategy = (strat: string | undefined) => {
    if (!strat) return '';
    // Convert snake_case to Title Case
    return strat
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  // When metadata is OFF, show only the definition
  if (!showMetadata) {
    return (
      <button
        className={getClassName()}
        onClick={onClick}
        disabled={disabled}
      >
        <div className="definition-content">
          <span className="definition-text">: {definition}</span>
        </div>
      </button>
    );
  }

  // When metadata is ON, show dictionary-style format
  // Format syllables: convert array to dot-separated or use as-is
  const displaySyllables = Array.isArray(syllables)
    ? syllablesToDots(syllables)
    : syllables;

  return (
    <button
      className={getClassName()}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="definition-content dictionary-style">
        {/* Word with syllables (bold, sans-serif) - use syllables if available, otherwise word */}
        {(displaySyllables || word) && (
          <span className="dict-word">{displaySyllables || word}</span>
        )}

        {/* IPA (serif, plain text - no delimiters) */}
        {ipa && <span className="dict-ipa">{ipa}</span>}

        {/* POS (italic) - use full name if available, otherwise abbreviation */}
        {(posName || pos) && <span className="dict-pos">{posName || pos}</span>}

        {/* Metadata in brackets - compact format: [Strategy, Band X, Y.Z] */}
        <span className="dict-metadata">
          [{formatStrategy(strategy)}, Band {difficultyBand ?? 'N/A'}, {overallDifficultyScore?.toFixed(1) ?? 'N/A'}]
        </span>

        {/* Definition  */}
        <span className="definition-text">: {definition}</span>
      </div>
    </button>
  );
}
