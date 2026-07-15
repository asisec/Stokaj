import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: number;
  onChange: (value: number) => void;
}

export function CurrencyInput({ value, onChange, className, ...props }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    if (value === 0 && displayValue === "") {
      setDisplayValue("0");
      return;
    }
    const currentNumeric = parseFloat(displayValue.replace(/\./g, "").replace(",", ".")) || 0;
    
    if (value !== currentNumeric) {
      if (value === 0) {
        setDisplayValue("0");
      } else {
        const parts = value.toString().split(".");
        let intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        let decPart = parts[1] ? "," + parts[1] : "";
        setDisplayValue(intPart + decPart);
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value;
    
    if (rawValue === "") {
      setDisplayValue("");
      onChange(0);
      return;
    }

    // Remove anything that is not a digit or a comma
    let cleaned = rawValue.replace(/[^\d,]/g, "");

    // Allow only one comma
    const commaCount = (cleaned.match(/,/g) || []).length;
    if (commaCount > 1) {
      cleaned = cleaned.replace(/,(?=.*,)/g, "");
    }

    // Handle leading zeros: if starts with '0' but not '0,' and length > 1, strip leading zeros
    if (cleaned.length > 1 && cleaned.startsWith("0") && !cleaned.startsWith("0,")) {
      cleaned = cleaned.replace(/^0+/, "");
      if (cleaned === "") cleaned = "0"; // if user typed "00" it becomes "0"
    } else if (cleaned.startsWith(",")) {
      cleaned = "0" + cleaned; // if user types "," make it "0,"
    }

    // Split and format with thousand separators
    const parts = cleaned.split(",");
    let intPart = parts[0];
    const decPart = parts.length > 1 ? "," + parts[1] : "";

    if (intPart) {
      intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    const newDisplayValue = intPart + decPart;
    setDisplayValue(newDisplayValue);

    // Convert string back to numeric and notify parent
    const numericString = cleaned.replace(",", ".");
    const numericValue = parseFloat(numericString);
    onChange(isNaN(numericValue) ? 0 : numericValue);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (displayValue === "") {
      setDisplayValue("0");
      onChange(0);
    } else if (displayValue.endsWith(",")) {
      const fixed = displayValue.slice(0, -1);
      setDisplayValue(fixed);
    }
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (displayValue === "0") {
      setDisplayValue("");
    }
    if (props.onFocus) {
      props.onFocus(e);
    }
  };

  return (
    <Input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      className={className}
      {...props}
    />
  );
}
