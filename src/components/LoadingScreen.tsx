import React from 'react';
import COLORS from '../constants/colors';

const LoadingScreen: React.FC = () => {
  return (
    <div
      style={{
        backgroundColor: COLORS.background,
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: '60px',
          height: '60px',
          border: `6px solid ${COLORS.primary}`,
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      ></div>
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: COLORS.primary,
              borderRadius: '50%',
              animation: `pulse 1.2s ease-in-out infinite ${i * 0.2}s`,
            }}
          ></div>
        ))}
      </div>
      <p
        style={{
          color: COLORS.textPrimary,
          fontSize: '1.2rem',
          fontWeight: '500',
        }}
      >
        Loading your dashboard...
      </p>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.5); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingScreen;