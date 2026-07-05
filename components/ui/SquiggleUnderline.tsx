interface SquiggleUnderlineProps {
  className?: string;
}

export default function SquiggleUnderline({ className = '' }: SquiggleUnderlineProps) {
  return (
    <svg
      width="44"
      height="8"
      viewBox="0 0 44 8"
      fill="none"
      aria-hidden="true"
      className="mt-1 block text-brand-terracotta"
    >
      <path
        d="M1 4.2C4.4 1.4 7.8 1.4 11.2 4.2C14.6 7 18 7 21.4 4.2C24.8 1.4 28.2 1.4 31.6 4.2C35 7 39 6.8 43 3.8"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
    </svg>
  );
}
