// src/components/CustomSwitch.tsx
import React from "react";

interface Props {
  checked: boolean;
  onChange: (val: boolean) => void;
}

export const CustomSwitch: React.FC<Props> = ({ checked, onChange }) => {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />

      <div
        className={`w-11 h-6 rounded-full transition-all duration-300
        ${checked 
          ? "bg-gradient-to-r from-green-400 to-emerald-500" 
          : "bg-gradient-to-r from-pink-300 to-blue-300 dark:from-purple-600 dark:to-blue-600"
        }
      `}
      ></div>

      <div
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-all duration-300
        ${checked ? "translate-x-5" : ""}
      `}
      ></div>
    </label>
  );
};
