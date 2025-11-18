import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PrayerReminderDropdownProps {
  enabled: boolean;
  currentValue: number;
  onValueChange: (value: number) => void;
}

const reminderOptions = [
  { value: 5, label: '5 dk önce' },
  { value: 10, label: '10 dk önce' },
  { value: 15, label: '15 dk önce' },
  { value: 20, label: '20 dk önce' },
  { value: 25, label: '25 dk önce' },
  { value: 30, label: '30 dk önce' },
  { value: 35, label: '35 dk önce' },
  { value: 40, label: '40 dk önce' },
  { value: 45, label: '45 dk önce' },
];

export const PrayerReminderDropdown: React.FC<PrayerReminderDropdownProps> = ({
  enabled,
  currentValue,
  onValueChange,
}) => {
  // Ensure currentValue is a valid number
  const safeCurrentValue = typeof currentValue === 'number' && !isNaN(currentValue) ? currentValue : 15;
  
  return (
    <Select
      disabled={!enabled}
      value={safeCurrentValue.toString()}
      onValueChange={(value) => {
        const numValue = parseInt(value);
        if (!isNaN(numValue)) {
          onValueChange(numValue);
        }
      }}
    >
      <SelectTrigger className={`w-32 h-12 text-base ${
        !enabled 
          ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' 
          : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
      }`}>
        <SelectValue placeholder="Süre seç" />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {reminderOptions.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value.toString()}
            className="h-12 text-base cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};