import React from "react";

interface Props {
  heading: number;
  qiblaDirection: number;
}

const QiblaCompass: React.FC<Props> = ({ heading, qiblaDirection }) => {
  const needleRotation = qiblaDirection - heading;

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className="relative h-64 w-64 rounded-full border-4 border-slate-300 shadow-xl">
        <img
          src="/compass-bg.png"
          className="absolute inset-0 h-full w-full opacity-80"
          style={{ transform: `rotate(${-heading}deg)` }}
        />
        <div
          className="absolute h-28 w-1 bg-emerald-600 rounded-full shadow"
          style={{
            top: "20%",
            left: "50%",
            transform: `translateX(-50%) rotate(${needleRotation}deg)`,
            transformOrigin: "bottom center",
          }}
        ></div>
      </div>

      <p className="mt-4 text-sm">
        Kıble yönü: {Math.round(qiblaDirection)}°
      </p>
    </div>
  );
};

export default QiblaCompass;
