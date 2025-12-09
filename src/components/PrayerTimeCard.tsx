// src/components/PrayerTimeCard.tsx
import React from "react";

interface PrayerTimeCardProps {
  name: string;
  time: string;
  isNext?: boolean;
  enabled: boolean;
  onToggle: () => void;
  reminderTime: string;
  onReminderChange: (value: string) => void;
}

export function PrayerTimeCard({
  name,
  time,
  isNext = false,
  enabled,
  onToggle,
  reminderTime,
  onReminderChange,
}: PrayerTimeCardProps) {

  return (
    <div
      className={`w-full rounded-xl p-4 mb-3 shadow-sm border transition-all duration-300
        ${
          isNext
            ? "bg-gradient-to-r from-pink-500 via-orange-500 to-blue-500 border-blue-400 shadow-lg transform scale-105"
            : "bg-gradient-to-r from-pink-50 via-orange-50 to-blue-50 dark:from-purple-900/40 dark:via-blue-900/40 dark:to-cyan-900/40 border-pink-200/50 dark:border-purple-500/30 hover:shadow-md backdrop-blur-sm"
        }`}
    >
      {/* ÜST SATIR */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <p
            className={`text-lg font-semibold ${
              isNext ? "text-white" : "text-pink-800 dark:text-purple-200"
            }`}
          >
            {name}
          </p>
          <p
            className={`text-xl font-bold font-mono ${
              isNext ? "text-white/90" : "text-orange-600 dark:text-cyan-300"
            }`}
          >
            {time}
          </p>
        </div>

        {/* SWITCH */}
        <div className="flex items-center gap-2">
          <span
            className={`text-sm ${
              isNext ? "text-white/70" : "text-blue-600 dark:text-blue-300"
            }`}
          >
            Hatırlatma
          </span>

          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={enabled}
              onChange={onToggle}
            />

            <div
              className={`w-11 h-6 rounded-full peer transition-all
                ${
                  enabled
                    ? "bg-gradient-to-r from-green-400 to-emerald-500"
                    : isNext
                    ? "bg-white/30"
                    : "bg-gradient-to-r from-pink-300 to-blue-300 dark:from-purple-600 dark:to-blue-600"
                }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform
                ${enabled ? "translate-x-5" : "translate-x-0.5"} mt-0.5`}
              ></div>
            </div>
          </label>
        </div>
      </div>

      {/* HATIRLATMA SÜRESİ */}
      {enabled && (
        <div className="mt-3">
          <select
            className={`text-sm px-3 py-2 rounded-lg w-full border transition-colors backdrop-blur-sm
              ${
                isNext
                  ? "bg-black/20 text-white border-white/30 placeholder-white/60"
                  : "bg-white/80 dark:bg-purple-800/50 text-pink-800 dark:text-purple-200 border-pink-300/50 dark:border-purple-500/50"
              }`}
            value={reminderTime}
            onChange={(e) => onReminderChange(e.target.value)}
          >
            <option value="0">Vaktinde</option>
            <option value="5">5 dk önce</option>
            <option value="10">10 dk önce</option>
            <option value="15">15 dk önce</option>
            <option value="20">20 dk önce</option>
            <option value="25">25 dk önce</option>
            <option value="30">30 dk önce</option>
            <option value="40">40 dk önce</option>
            <option value="45">45 dk önce</option>
          </select>
        </div>
      )}

      {/* NEXT BADGE */}
      {isNext && (
        <div className="mt-3 bg-black/20 text-white text-sm py-2 px-3 rounded-lg text-center font-medium backdrop-blur-sm border border-white/20">
          🕌 Sıradaki Namaz Vakti
        </div>
      )}
    </div>
  );
}
