import type { SVGProps } from 'react';

export function BeaverlyLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 8.5c-2.4 0-4.7 1-6.5 2.5" />
      <path d="M12 15.5c2.4 0 4.7-1 6.5-2.5" />
      <path d="M14.5 12a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1 5 0Z" />
      <path d="M21 12c0-5-4-9-9-9s-9 4-9 9c0 4 2.5 7.5 6 8.5" />
      <path d="M12 12h.01" />
      <path d="M3.5 10a5.5 5.5 0 0 1 5.5 5.5" />
    </svg>
  );
}
