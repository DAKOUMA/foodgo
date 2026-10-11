import { useId, type ComponentProps } from "react";

interface FormFieldProps extends Omit<ComponentProps<"input">, "id" | "className"> {
  label: string;
  error?: string;
}

export default function FormField({ label, error, ...inputProps }: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 aria-[invalid=true]:border-red-500"
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}