"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type InputPhoneProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
  required?: boolean;
};

function formatPhone(value: string) {
  const digits = value
    .replace(/\D/g, "")
    .slice(0, 11);

  if (digits.length <= 2) {
    return digits
      ? `(${digits}`
      : "";
  }

  const areaCode = digits.slice(0, 2);
  const first = digits.slice(2, 3);
  const middle = digits.slice(3, 7);
  const end = digits.slice(7, 11);

  let formatted = `(${areaCode})`;

  if (first) {
    formatted += ` ${first}`;
  }

  if (middle) {
    formatted += ` ${middle}`;
  }

  if (end) {
    formatted += `-${end}`;
  }

  return formatted;
}

export function InputPhone({
  id,
  value,
  onChange,
  placeholder = "(85) 9 9888-9756",
  autoComplete = "tel",
  className,
  required,
}: InputPhoneProps) {
  return (
    <Input
      id={id}
      type="tel"
      autoComplete={autoComplete}
      placeholder={placeholder}
      inputMode="numeric"
      value={value}
      onChange={(event) =>
        onChange(
          formatPhone(event.target.value)
        )
      }
      className={cn(className)}
      required={required}
    />
  );
}
