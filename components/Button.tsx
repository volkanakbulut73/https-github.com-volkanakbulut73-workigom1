import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  children, 
  ...props 
}) => {
  const baseStyles = "py-2.5 px-4 rounded-xl font-bold text-xs tracking-wide transition-all duration-200 active:scale-95 shadow-sm flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200",
    secondary: "bg-white text-slate-800 border border-gray-200 hover:bg-gray-50",
    outline: "border border-slate-900 text-slate-900 bg-transparent hover:bg-slate-50",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-red-200",
    success: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200"
  };

  const safeClassName = typeof className === 'string' ? className : '';

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${safeClassName}`}
      {...props}
    >
      {children}
    </button>
  );
};