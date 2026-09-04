import { cn } from "@/lib/utils/cn";
import { Input } from "./Input";
import type { InputHTMLAttributes, ReactNode } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  /** Render a custom control (e.g. a select) instead of the default Input. */
  children?: ReactNode;
  wrapperClassName?: string;
}

/** Labelled form control matching the DS `.field` + `.input`. */
export function Field({ label, children, wrapperClassName, ...inputProps }: FieldProps) {
  return (
    <div className={cn("field", wrapperClassName)}>
      <label>{label}</label>
      {children ?? <Input {...inputProps} />}
    </div>
  );
}
