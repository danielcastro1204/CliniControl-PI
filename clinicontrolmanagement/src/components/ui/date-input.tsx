import React from "react";
import { Input } from "@/components/ui/input";

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Auto-formats input as YYYY-MM-DD by inserting dashes automatically.
 */
export function DateInput({ value, onChange, ...props }: DateInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9]/g, "");
    if (raw.length > 8) raw = raw.slice(0, 8);

    let formatted = "";
    if (raw.length > 4) {
      formatted = raw.slice(0, 4) + "-" + raw.slice(4);
      if (raw.length > 6) {
        formatted = raw.slice(0, 4) + "-" + raw.slice(4, 6) + "-" + raw.slice(6);
      }
    } else {
      formatted = raw;
    }

    onChange(formatted);
  };

  return (
    <Input
      {...props}
      value={value}
      onChange={handleChange}
      placeholder={props.placeholder || "AAAA-MM-DD"}
      maxLength={10}
    />
  );
}
