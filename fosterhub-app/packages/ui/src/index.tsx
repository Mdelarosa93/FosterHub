import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

export function Button({ children, ...props }: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button
      {...props}
      style={{
        background: '#046307',
        color: 'white',
        border: 'none',
        borderRadius: 10,
        padding: '10px 14px',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
