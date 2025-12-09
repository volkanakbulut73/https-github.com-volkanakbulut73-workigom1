import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', gradient = false, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        rounded-2xl p-5 shadow-sm border border-white/50 backdrop-blur-sm
        ${gradient ? 'bg-card-gradient' : 'bg-white'}
        ${onClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};