import React from 'react'

export default function EnumField({
  description,
  enumList,
  enumNamesList,
  multi,
  name,
  objectDescription,
  requiredForInput,
  requiredForLabel,
  title,
  value
}) {
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
          <select
            className="form-select w-full dark:bg-gray-700 mt-2 text-ellipsis"
            aria-label={name}
            name={name}
            id={name}
            multiple={multi}
            required={requiredForInput}
            defaultValue={value}
          >
            {multi ? null : <option value="" key="0"></option>}
            {enumList.map((item, index) => (
              <option value={item} key={item}>
                {enumNamesList ? enumNamesList[index] : item}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="text-xs">{description}</div>
    </>
  )
}
