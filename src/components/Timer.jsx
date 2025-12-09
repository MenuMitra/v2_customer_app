import { useState, useEffect } from 'react';

const Timer = ({ orderTime }) => {
  console.log('Timer component received orderTime:', orderTime);

  const [seconds, setSeconds] = useState(() => {
    try {
      // Add error handling for time parsing
      if (!orderTime) {
        console.error('No orderTime provided to Timer component');
        return 0;
      }

      // Calculate initial seconds remaining when component mounts
      const [timeStr, period] = orderTime.split(" ");
      const [hours, minutes, seconds] = timeStr.split(":");
      const orderDateTime = new Date();
      
      console.log('Parsing time:', { hours, minutes, seconds, period });
      
      // Set the order time
      if (period === "PM" && hours !== "12") {
        orderDateTime.setHours(parseInt(hours) + 12);
      } else if (period === "AM" && hours === "12") {
        orderDateTime.setHours(0);
      } else {
        orderDateTime.setHours(parseInt(hours));
      }
      orderDateTime.setMinutes(parseInt(minutes));
      orderDateTime.setSeconds(parseInt(seconds));

      const currentTime = new Date();
      const timeDifferenceInSeconds = Math.floor(
        (currentTime - orderDateTime) / 1000
      );
      
      const remainingSeconds = Math.max(90 - timeDifferenceInSeconds, 0);
      console.log('Calculated remaining seconds:', remainingSeconds);
      
      return remainingSeconds;
    } catch (error) {
      console.error('Error in Timer initialization:', error);
      return 0;
    }
  });
  const [isCompleted, setIsCompleted] = useState(seconds === 0);
  const TOTAL_SECONDS = 90;

  useEffect(() => {
    if (seconds <= 0) {
      setIsCompleted(true);
      return;
    }

    const timer = setInterval(() => {
      setSeconds(prevSeconds => {
        const newSeconds = Math.max(0, prevSeconds - 1);
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