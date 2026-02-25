interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 28, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="16" cy="16" r="15" fill="var(--accent-solid)" />
      <path
        d="M16 6L16 26M6 16L26 16"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9.5 9.5L22.5 22.5M22.5 9.5L9.5 22.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="16" cy="16" r="3.5" fill="white" />
    </svg>
  );
}
