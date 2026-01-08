import './WordDisplay.css';

interface WordDisplayProps {
  word: string;
  simpleCategory?: string | null;
  pos?: string;
  pronunciation?: {
    ipa: string;
    formattedSyllables: string;
  };
}

// Map POS codes to full names
const getPosName = (pos?: string): string => {
  if (!pos) return '';
  const posMap: Record<string, string> = {
    'n': 'noun',
    'v': 'verb',
    'a': 'adjective',
    'r': 'adverb',
    's': 'adjective'
  };
  return posMap[pos] || pos;
};

export default function WordDisplay({ word, simpleCategory, pos, pronunciation }: WordDisplayProps) {
  return (
    <div className="word-display">
      <div className="word-headword-line">
        <span className="word-text">{word}</span>
        {pronunciation?.ipa && (
          <span className="word-pronunciation">{pronunciation.ipa}</span>
        )}
        {pronunciation?.formattedSyllables && (
          <span className="word-syllables">{pronunciation.formattedSyllables}</span>
        )}
        {pos && (
          <span className="word-pos">{getPosName(pos)}</span>
        )}
      </div>
    </div>
  );
}
