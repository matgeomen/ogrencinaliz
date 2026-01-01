import type { SVGProps } from 'react';

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
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
      <path d="M12 3L2 9l10 6 10-6-10-6z" />
      <path d="M2 9v6l10 6 10-6V9" />
      <path d="M12 21V15" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
};
