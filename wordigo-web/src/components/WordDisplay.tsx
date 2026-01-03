import './WordDisplay.css';

interface WordDisplayProps {
  word: string;
}

export default function WordDisplay({ word }: WordDisplayProps) {
  return (
    <div className="word-display">
      <h1 className="word-text">{word}</h1>
    </div>
  );
}
