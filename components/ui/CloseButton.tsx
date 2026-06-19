import './CloseButton.css';

interface CloseButtonProps {
  onClick: () => void;
  title?: string;
}

export default function CloseButton({ onClick, title = 'Close' }: CloseButtonProps) {
  return (
    <button
      className="close-button"
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      ×
    </button>
  );
}
