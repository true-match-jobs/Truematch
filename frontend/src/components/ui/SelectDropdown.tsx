import { CaretDown } from '@phosphor-icons/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

type SelectDropdownOption = {
  label: string;
  value: string;
};

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectDropdownOption[];
  placeholder?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
  leadingIcon?: ReactNode;
};

export const SelectDropdown = ({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  error,
  className = '',
  disabled = false,
  leadingIcon
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, []);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div ref={rootRef} className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-zinc-300">
        {label}
      </label>

      <div className="relative">
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`glass-border flex w-full items-center justify-between rounded-xl border-white/10 bg-transparent px-4 py-3 text-left text-sm text-white outline-none transition-all duration-200 focus:border-white/20 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        >
          <span className="flex min-w-0 items-center gap-2">
            {leadingIcon ? <span className="text-zinc-500">{leadingIcon}</span> : null}
            <span className={selectedOption ? 'text-white' : 'text-zinc-500'}>{selectedOption?.label ?? placeholder}</span>
          </span>
          <CaretDown size={16} className={`text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen ? (
          <ul
            role="listbox"
            className="glass-border absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border-white/10 bg-dark-surface py-1"
          >
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-white/5 ${
                    option.value === value ? 'text-white' : 'text-zinc-200'
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {error ? <p className="mt-1 text-xs text-rose-400">{error}</p> : null}
    </div>
  );
};
