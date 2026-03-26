import { useEffect, useMemo, useState } from "react";

const TOTAL_SECONDS = 90;

function safeNumber(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : null;
}

function parseOrderTimeToTodayDate(orderTime) {
  if (!orderTime || typeof orderTime !== "string") return null;

  // Supported examples:
  // - "12:13 PM"
  // - "08:41:22 PM"
  // - "12:13:02 AM"
  const trimmed = orderTime.trim();
  const match = trimmed.match(
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i
  );
  if (!match) return null;

  const hoursRaw = Number(match[1]);
  const minutesRaw = Number(match[2]);
  const secondsRaw = match[3] ? Number(match[3]) : 0;
  const period = match[4].toUpperCase();

  const d = new Date();
  const hours12 = hoursRaw % 12;
  const hours24 = period === "PM" ? hours12 + 12 : hours12;

  d.setHours(hours24, minutesRaw, secondsRaw, 0);
  return d;
}

const Timer = ({ orderTime, initialSeconds }) => {
  const initialFromProp = useMemo(() => {
    const n = safeNumber(initialSeconds);
    if (n === null) return null;
    return Math.max(0, Math.min(TOTAL_SECONDS, Math.floor(n)));
  }, [initialSeconds]);

  const [seconds, setSeconds] = useState(() => {
    if (initialFromProp !== null) return initialFromProp;
    const orderDateTime = parseOrderTimeToTodayDate(orderTime);
    if (!orderDateTime) return 0;

    const diffMs = Date.now() - orderDateTime.getTime();
    const remainingMs = TOTAL_SECONDS * 1000 - diffMs;
    const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
    return remainingSeconds;
  });

  const [isCompleted, setIsCompleted] = useState(seconds === 0);

  useEffect(() => {
    // If parent switches to a new initial value, sync.
    if (initialFromProp !== null) {
      setSeconds(initialFromProp);
      setIsCompleted(initialFromProp === 0);
    }
  }, [initialFromProp]);

  useEffect(() => {
    if (seconds <= 0) {
      setIsCompleted(true);
      return;
    }

    const timer = setInterval(() => {
      setSeconds(prevSeconds => {
        const prev = safeNumber(prevSeconds);
        if (prev === null) return 0;
        const newSeconds = Math.max(0, prev - 1);
        if (newSeconds === 0) {
          setIsCompleted(true);
        }
        return newSeconds;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

  // Checkmark SVG component
  const CheckmarkIcon = () => (
    <svg
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"
        fill="#00B67A"
      />
    </svg>
  );

  // Get color based on time remaining
  const getColor = (seconds) => {
    if (seconds > 60) return '#00B67A'; // Green for > 60s
    if (seconds > 30) return '#FFA902'; // Yellow/Orange for 30-60s
    return '#E74C3C';                   // Red for < 30s
  };

  // Get Tailwind color class based on time remaining
  const getColorClass = (seconds) => {
    if (seconds > 60) return 'text-[#00B67A]'; // Green for > 60s
    if (seconds > 30) return 'text-[#FFA902]'; // Yellow/Orange for 30-60s
    return 'text-[#E74C3C]';                   // Red for < 30s
  };

  if (isCompleted) {
    return (
      <div className="relative w-12 h-12">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <CheckmarkIcon />
        </div>
      </div>
    );
  }

  // Calculate progress percentage based on 90 seconds total
  const progress = (seconds / TOTAL_SECONDS) * 100;
  const strokeDashoffset = 283 - (283 * progress) / 100;
  const currentColor = getColor(seconds);

  return (
    <div className="relative w-12 h-12">
      {/* SVG for circular progress */}
      <svg
        className="w-12 h-12 -rotate-90 absolute"
        viewBox="0 0 100 100"
      >
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#E8EEF5"
          strokeWidth="10"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={currentColor}
          strokeWidth="10"
          strokeDasharray="283"
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      {/* Timer text */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-semibold ${getColorClass(seconds)}`}>
        {seconds}s
      </div>
    </div>
  );
};

export default Timer; 