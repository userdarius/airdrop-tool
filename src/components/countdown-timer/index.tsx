import React, { useState, useEffect } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownTimerProps {
  targetDate: number;
  refreshData: () => void;
}

const formatTime = (time: number): string => {
  return time < 10 ? `0${time}` : `${time}`;
};

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  refreshData,
}) => {
  const calculateTimeLeft = (): TimeLeft => {
    const difference = targetDate - +new Date();
    let timeLeft: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    } else {
      refreshData();
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]); //eslint-disable-line

  return (
    <div className="flex gap-[5px]">
      <div className="rounded-sm bg-[#5B5B5B80]/50 px-1 py-[3px] text-sm">
        {formatTime(timeLeft.days)}
      </div>
      <div className="rounded-sm bg-[#5B5B5B80]/50 px-1 py-[3px] text-sm">
        {formatTime(timeLeft.hours)}
      </div>
      <div className="rounded-sm bg-[#5B5B5B80]/50 px-1 py-[3px] text-sm">
        {formatTime(timeLeft.minutes)}
      </div>
      <div className="rounded-sm bg-[#5B5B5B80]/50 px-1 py-[3px] text-sm">
        {formatTime(timeLeft.seconds)}
      </div>
    </div>
  );
};

export default CountdownTimer;
