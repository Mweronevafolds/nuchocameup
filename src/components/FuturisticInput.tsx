import React, { useState, useId } from "react";
import { Check, AlertCircle } from "lucide-react";

interface FuturisticInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const FuturisticInput = React.forwardRef<HTMLInputElement, FuturisticInputProps>(
  ({ label, error, icon, className = "", ...props }, ref) => {
  const uid = useId();
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.defaultValue || !!props.value);

  const lifted = focused || hasValue;

  return (
    <div className={`relative ${className}`}>
      {/* Floating label */}
      <label
        htmlFor={uid}
        className={`absolute z-10 pointer-events-none transition-all duration-200 font-body ${
          lifted
            ? "top-2 left-4 text-[10px] tracking-wider " + (error ? "text-red-500" : focused ? "text-white" : "text-white/40")
            : `${icon ? "left-10" : "left-4"} top-1/2 -translate-y-1/2 text-sm text-white/35`
        }`}
      >
        {label}
      </label>

      {/* Icon */}
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 z-10">
          {icon}
        </div>
      )}

      {/* Input */}
      <input
        ref={ref}
        {...props}
        id={uid}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e)  => { setFocused(false); setHasValue(!!e.target.value); props.onBlur?.(e); }}
        onChange={(e) => { setHasValue(!!e.target.value); props.onChange?.(e); }}
        className={`w-full py-4 pt-7 rounded-xl text-sm text-white bg-white/5 border-2 transition-all duration-200 focus:outline-none placeholder-transparent ${
          icon ? "pl-10 pr-10" : "pl-4 pr-10"
        } ${
          error
            ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(255,0,0,0.1)]"
            : "border-white/10 focus:border-white focus:shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
        }`}
      />

      {/* Neon bottom line */}
      <div
        className="absolute bottom-0 left-4 right-4 h-[2px] rounded-b-xl transition-all duration-300 origin-left"
        style={{
          background: error ? "#ff0000" : "#ffffff",
          transform: focused ? "scaleX(1)" : "scaleX(0)",
          opacity: focused ? 1 : 0,
        }}
      />

      {/* Validation icon */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {error ? (
          <AlertCircle size={14} className="text-red-500 animate-scale-in" />
        ) : hasValue && !error ? (
          <Check size={14} className="text-white animate-scale-in" />
        ) : null}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1.5 flex items-center gap-1 font-mono-cyber text-[10px] text-red-500 tracking-wide animate-slide-up">
          <AlertCircle size={10} />
          {error}
        </p>
      )}
    </div>
  );
});

FuturisticInput.displayName = "FuturisticInput";
