import React from 'react';

interface BrandLogoProps {
  className?: string;
  variant?: 'dark' | 'light' | 'auto';
  showSubtitle?: boolean;
}

// Aproxima el logo oficial: "ALOHA" en sans condensada bold y "Indumentaria" en sans liviana, centrados.
// TODO(pedir a la dueña): el logo original en SVG/PNG grande para reemplazar esta versión tipográfica.
export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = 'h-10',
  variant = 'auto',
  showSubtitle = true
}) => {
  const isLight = variant === 'light';
  const isDark = variant === 'dark';

  const textColor = isLight ? '#ffffff' : isDark ? '#0a0a0a' : 'currentColor';
  const subColor = isLight ? '#d4d4d4' : isDark ? '#525252' : 'currentColor';

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 320 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain"
        role="img"
        aria-label="Aloha Indumentaria"
      >
        <text
          x="160"
          y={showSubtitle ? 40 : 50}
          textAnchor="middle"
          fill={textColor}
          style={{
            fontFamily: "'Bebas Neue', 'Oswald', 'Arial Narrow', Impact, sans-serif",
            fontSize: '50px',
            fontWeight: 400,
            letterSpacing: '0.06em',
          }}
        >
          ALOHA
        </text>

        {showSubtitle && (
          <text
            x="160"
            y="58"
            textAnchor="middle"
            fill={subColor}
            style={{
              fontFamily: "'Montserrat', 'Plus Jakarta Sans', sans-serif",
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.3em',
            }}
          >
            Indumentaria
          </text>
        )}
      </svg>
    </div>
  );
};
