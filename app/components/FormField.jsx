import React from 'react'

export default function FormField({
  description,
  max,
  maxlength,
  min,
  minlength,
  name,
  pattern,
  objectDescription,
  requiredForInput,
  requiredForLabel,
  step,
  title,
  type,
  value
}) {
  if (type === 'string') {
    type = 'text'
  }
  return (
    <>
      <div className="block text-sm my-2">
        <div className="text-lg mb-4">
          {objectDescription ? (
            <div className="text-sm">{objectDescription}</div>
          ) : (
            ''
          )}
        </div>
        <label>
          <div className="font-bold mt-4">
            {title}:{' '}
            {requiredForLabel ? (
              <span className="text-red-500 dark:text-red-400">*</span>
            ) : (
              ''
            )}
          </div>
          <input
            className="form-input w-full dark:bg-gray-700 mt-2"
            type={type}
            aria-label={name}
            name={name}
            max={max}
            maxLength={maxlength}
            min={min}
            minLength={minlength}
            pattern={pattern}
            step={step}
            required={requiredForInput}
            defaultValue={value}
          />
        </label>
      </div>
      <div className="text-xs">{description}</div>
    </>
  )
}
