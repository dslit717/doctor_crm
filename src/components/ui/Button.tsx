'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.scss'

type Variant = 'primary' | 'secondary' | 'danger' | 'info' | 'black' | 'ghost'
type Size = 'sm' | 'md'

export type UIButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  children: ReactNode
}

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ')
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: UIButtonProps) {
  return (
    <button
      {...props}
      className={cx(styles.button, styles[variant], styles[size], className)}
    >
      {children}
    </button>
  )
}


