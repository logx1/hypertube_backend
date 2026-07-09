import * as React from "react";
import styles from "./GradientButton.module.css";

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export default function GradientButton({ 
  children, 
  className = "", 
  ...props 
}: GradientButtonProps) {
  return (
    <button 
      className={`${styles.gradientButton} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
