type Props = {
  steps: string[];
  currentStep: number;
};

export const Stepper = ({ steps, currentStep }: Props) => {
  return (
    <div className="mx-auto w-full max-w-[220px] px-2" aria-label="Progress" role="group">
      <div className="relative flex items-center justify-between">
        <div aria-hidden className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />

        {steps.map((step, index) => {
          const isActive = currentStep === index;
          const isCompleted = currentStep > index;

          return (
            <div
              key={step}
              aria-label={`Step ${index + 1}: ${step}`}
              aria-current={isActive ? 'step' : undefined}
              className={`relative h-3.5 w-3.5 rounded-full border-2 transition-colors ${
                isCompleted ? 'border-brand-600 bg-brand-600' : isActive ? 'border-brand-500 bg-dark-card' : 'border-white/20 bg-dark-card'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
