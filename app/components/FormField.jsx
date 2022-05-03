import React from 'react'

export default function FormField({
  description,
  max,
  maxlength,
  min,
  minlength,
  name,
  pattern,
  title,
  type,
  objectTitle,
  objectDescription,
  step
}) {
  if (type === 'string') {
    type = 'text'
  }
  return (
    <>
      <div className="block text-sm my-2">
        <div className="text-lg my-4">
          {objectTitle ? objectTitle : ''}
          {objectDescription ? ` - ${objectDescription}` : ''}
        </div>
        <label>
          <div className="font-bold mt-4">{title}:</div>
          <input
            className="form-input dark:bg-slate-700 mt-2"
            type={type}
            aria-label={name}
            name={name}
            max={max}
            maxLength={maxlength}
            min={min}
            minLength={minlength}
            pattern={pattern}
            step={step}
          />
        </label>
      </div>
      <div className="text-xs">{description}</div>
    </>
  )
}
