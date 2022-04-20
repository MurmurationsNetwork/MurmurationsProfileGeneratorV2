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
  return (
    <span>
      {objectTitle ? (
        <>
          <br />
          {objectTitle}
        </>
      ) : (
        ''
      )}
      {objectDescription ? ` -- ${objectDescription}` : ''}
      <label>
        <span className="key">{title}:</span>
        <input
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
      <br />
      <span>{description}</span>
      <br />
    </span>
  )
}
