import React, { forwardRef } from "react";
import "./Button.css";

const Button = forwardRef(function Button({
  children,
  variant = "primary",
  icon: Icon,
  type = "button",
  fullWidth = false,
  className = "",
  ...props
}, ref) {
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      className={`button button--${variant}${fullWidth ? " button--full" : ""} ${className}`.trim()}
    >
      {Icon && <Icon size={variant === "primary" ? 18 : 16} aria-hidden="true" focusable="false" />}
      {children}
    </button>
  );
});

export default Button;
