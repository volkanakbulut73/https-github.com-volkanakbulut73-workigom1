
import React from 'react';
import { Check, Circle, Loader2 } from 'lucide-react';
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
    // Defines the logical progression of steps
    const statusOrder = [
      TrackerStep.WAITING_SUPPORTER,      // 'waiting-supporter'
      TrackerStep.WAITING_CASH_PAYMENT,   // 'waiting-cash-payment'
      TrackerStep.CASH_PAID,              // 'cash-paid'
      TrackerStep.QR_UPLOADED,            // 'qr-uploaded'
      TrackerStep.COMPLETED               // 'completed'
    ];
    
    // Normalization for visual representation if needed
    let normalizedCurrent = currentStep;
    
    // Determine Index
    const currentIndex = statusOrder.indexOf(normalizedCurrent);
    const stepIndex = statusOrder.indexOf(stepId);
    
    // Handle edge cases where current status might not be in the simple visual flow
    if (currentIndex === -1) {
       // If canceled or failed, we might show everything as pending or specific error state
       // For now, let's treat them as incomplete
       return 'pending'; 
    }

    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="relative py-2 pl-4 border-l-2 border-gray-100 ml-2 space-y-8">
      {steps.map((step) => {
        const state = getStepState(step.id);
        
        return (
          <div key={step.id} className="relative pl-6">
            <div className={`absolute -left-[21px] top-0 rounded-full p-1 border-2 transition-all duration-300 z-10
              ${state === 'completed' ? 'bg-green-500 border-green-500' : 
                state === 'active' ? 'bg-white border-slate-900 animate-pulse ring-4 ring-slate-200' : 'bg-white border-gray-200'}
            `}>
              {state === 'completed' ? (
                <Check size={12} className="text-white" />
              ) : state === 'active' ? (
                <Loader2 size={12} className="text-slate-900 animate-spin" />
              ) : (
                <Circle size={12} className="text-gray-300 fill-gray-50" />
              )}
            </div>

            <div className={`transition-all duration-300 ${state === 'pending' ? 'opacity-50 blur-[0.5px]' : 'opacity-100'}`}>
              <div className="flex justify-between items-start">
                <h4 className={`font-bold text-sm ${state === 'active' ? 'text-slate-900' : 'text-gray-800'}`}>
                  {step.label}
                </h4>
                {step.timestamp && state !== 'pending' && (
                  <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                    {step.timestamp}
                  </span>
                )}
              </div>
              
              {step.description && (
                <div className={`text-xs mt-1 ${state === 'active' ? 'text-gray-600' : 'text-gray-400'}`}>
                  {step.description}
                </div>
              )}
              
              {state === 'active' && (
                <div className="mt-2 inline-block bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-1 rounded animate-bounce">
                  Şu an buradasınız
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
