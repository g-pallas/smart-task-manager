export default function FaqButton({ onClick, active = false }) {
  return (
    <button
      className={`icon-button faq-button ${active ? "faq-button-active" : ""}`}
      type="button"
      aria-label="Frequently Asked Questions"
      title="Frequently Asked Questions"
      onClick={onClick}
    >
      <svg
        className="ui-icon"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M9.1 9a3 3 0 1 1 4.9 2.3c-.9.6-1.5 1.1-1.5 2.2" />
        <path d="M12 17h.01" />
      </svg>
    </button>
  );
}
