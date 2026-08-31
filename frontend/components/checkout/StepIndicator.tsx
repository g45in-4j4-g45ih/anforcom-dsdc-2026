"use client";

import { Check } from "lucide-react";

interface Step {
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number; // 1-based
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center">
      {steps.map((step, idx) => {
        const stepNumber = idx + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <div key={step.label} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  isCompleted
                    ? "bg-secondary text-white"
                    : isCurrent
                      ? "bg-primary text-white"
                      : "border border-gray-300 text-gray-400"
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" aria-hidden="true" /> : stepNumber}
              </div>
              <span
                className={`text-sm font-medium ${
                  isCurrent ? "text-primary" : isCompleted ? "text-secondary" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`mx-3 h-px w-8 sm:w-16 ${isCompleted ? "bg-secondary" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}