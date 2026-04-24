/**
 * Risk Gauge — circular SVG gauge showing 0-100 risk score.
 */
import { motion } from 'framer-motion';

export default function RiskGauge({ score = 0, size = 160 }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const offset = circumference - progress;

  // Color based on score
  const getColor = (s) => {
    if (s < 40) return '#22C55E';  // Green
    if (s < 70) return '#F59E0B';  // Amber
    return '#EF4444';              // Red
  };

  const color = getColor(score);
  const label = score < 40 ? 'Low' : score < 70 ? 'Medium' : score < 85 ? 'High' : 'Critical';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 140 140">
        {/* Background circle */}
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke="rgba(30, 41, 59, 0.5)"
          strokeWidth="10"
        />

        {/* Glow filter */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Progress circle */}
        <motion.circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          transform="rotate(-90 70 70)"
          filter="url(#glow)"
        />

        {/* Score text */}
        <text
          x="70" y="65"
          textAnchor="middle"
          fill={color}
          fontSize="28"
          fontWeight="bold"
          fontFamily="Inter, sans-serif"
        >
          {score}
        </text>
        <text
          x="70" y="85"
          textAnchor="middle"
          fill="#94A3B8"
          fontSize="11"
          fontFamily="Inter, sans-serif"
        >
          {label} Risk
        </text>
      </svg>
    </div>
  );
}
