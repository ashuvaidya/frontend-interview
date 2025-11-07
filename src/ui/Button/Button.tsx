import React from "react";
import cn from "classnames";
import styles from "./Button.module.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

export const Button = ({ className, ...buttonProps }: ButtonProps) => {
  return <button className={cn(styles.button, className)} {...buttonProps} />;
};
