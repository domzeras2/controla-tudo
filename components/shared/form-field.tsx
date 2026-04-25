import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

type Option = {
  label: string;
  value: string;
};

type BaseFieldProps = {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
};

export function TextField({
  label,
  name,
  placeholder,
  required = false,
  defaultValue,
  type = "text",
  step,
  inputMode,
  autoComplete,
  pattern
}: BaseFieldProps & {
  defaultValue?: string | number;
  type?: string;
  step?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  pattern?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        step={step}
        inputMode={inputMode}
        autoComplete={autoComplete}
        pattern={pattern}
        placeholder={placeholder}
        required={required}
        className="min-h-12 rounded-2xl border border-slate-700 bg-[#172033] px-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-brand-500 focus:bg-slate-900"
      />
    </label>
  );
}

export function SelectField({
  label,
  name,
  options,
  defaultValue,
  required = false,
  onChange
}: BaseFieldProps & {
  defaultValue?: string;
  options: Option[];
  onChange?: SelectHTMLAttributes<HTMLSelectElement>["onChange"];
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        onChange={onChange}
        className="min-h-12 rounded-2xl border border-slate-700 bg-[#172033] px-4 text-slate-100 outline-none transition focus:border-brand-500 focus:bg-slate-900"
      >
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TextareaField({
  label,
  name,
  placeholder,
  defaultValue
}: BaseFieldProps & { defaultValue?: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <textarea
        name={name}
        rows={4}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="rounded-2xl border border-slate-700 bg-[#172033] px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-brand-500 focus:bg-slate-900"
      />
    </label>
  );
}

export function CheckboxField({
  label,
  name,
  defaultChecked = false,
  helper
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  helper?: string;
}) {
  return (
    <label className="flex min-h-12 items-start gap-3 rounded-2xl border border-slate-700 bg-[#172033] px-4 py-3">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 rounded border-slate-500 bg-slate-900 text-brand-600 focus:ring-brand-500"
      />
      <span className="grid gap-1">
        <span className="text-sm font-medium text-slate-200">{label}</span>
        {helper ? <span className="text-xs leading-5 text-slate-400">{helper}</span> : null}
      </span>
    </label>
  );
}
