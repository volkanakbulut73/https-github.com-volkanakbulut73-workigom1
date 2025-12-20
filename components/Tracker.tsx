
import React from 'react';
import { Check, Circle, Loader2, AlertCircle } from 'lucide-react';
import { TrackerStep } from '../types';

export interface StepDefinition {
  id: TrackerStep;
  label: string;
  description?: string | React.ReactNode;
  timestamp?: string;
}

interface TrackerProps {
  currentStep: TrackerStep;
  steps: StepDefinition[];
}

export const Tracker: React.FC<TrackerProps> = ({ currentStep, steps }) => {
  const getStepState = (stepId: TrackerStep) => {
    // İşlem akış sırası (Realtime veritabanı ile uyumlu)
    const statusOrder = [
      TrackerStep.WAITING_SUPPORTER,
      TrackerStep.WAITING_CASH_PAYMENT,
      TrackerStep.CASH_PAID,
      TrackerStep.QR_UPLOADED,
      TrackerStep.COMPLETED
    ];
    
    // Hata veya İptal durumları kontrolü
    if (currentStep === TrackerStep.FAILED || currentStep === TrackerStep.CANCELLED) {
      return stepId === currentStep ? 'error' : 'pending';
    }

    const currentIndex = statusOrder.indexOf(currentStep);
    const stepIndex = statusOrder.indexOf(stepId);
    
    if (currentIndex === -1) return 'pending';
    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="relative py-2 pl-4 border-l-2 border-gray-100 ml-2 space-y-10">
      {steps.map((step) => {
        const state = getStepState(step.id);
        
        return (
          <div key={step.id} className="relative pl-8 group">
            {/* Adım Göstergesi (Dot) */}
            <div className={`absolute -left-[23px] top-0 rounded-full p-1.5 border-2 transition-all duration-500 z-10
              ${state === 'completed' ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20' : 
                state === 'active' ? 'bg-white border-slate-900 ring-4 ring-slate-900/10' : 
                state === 'error' ? 'bg-red-500 border-red-500 shadow-lg shadow-red-500/20' : 'bg-white border-gray-200'}
            `}>
              {state === 'completed' ? (
                <Check size={12} className="text-white" strokeWidth={3} />
              ) : state === 'active' ? (
                <Loader2 size={12} className="text-slate-900 animate-spin" strokeWidth={3} />
              ) : state === 'error' ? (
                <AlertCircle size={12} className="text-white" />
              ) : (
                <Circle size={12} className="text-gray-300 fill-gray-50" />
              )}
            </div>

            {/* İçerik Kartı */}
            <div className={`transition-all duration-500 ${state === 'pending' ? 'opacity-40 blur-[0.3px]' : 'opacity-100'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className={`font-black text-sm tracking-tight ${state === 'active' ? 'text-slate-900 scale-105 origin-left' : state === 'error' ? 'text-red-600' : 'text-gray-800'} transition-transform`}>
                    {step.label}
                  </h4>
                  {step.description && (
                    <div className={`text-[11px] mt-1.5 font-medium leading-relaxed ${state === 'active' ? 'text-slate-600' : 'text-gray-400'}`}>
                      {step.description}
                    </div>
                  )}
                </div>
                
                {step.timestamp && state !== 'pending' && (
                  <span className="text-[9px] text-gray-400 font-bold bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                    {step.timestamp}
                  </span>
                )}
              </div>
              
              {state === 'active' && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-slate-900 text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-lg shadow-slate-900/20 animate-bounce uppercase tracking-widest">
                  <div className="w-1 h-1 bg-emerald-400 rounded-full animate-ping"></div>
                  İşlem Sırası
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
