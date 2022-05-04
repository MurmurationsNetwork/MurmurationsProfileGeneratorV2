import React from 'react'

export default function EnumField({
  description,
  enumList,
  enumNamesList,
  multi,
  name,
  title,
  objectTitle,
  objectDescription,
  required
}) {
  return (
    <>
      <div className="block text-sm my-2">
        <div className="text-lg my-4">
          {objectTitle ? objectTitle : ''}
          {objectDescription ? ` - ${objectDescription}` : ''}
        </div>
        <label>
          <div className="font-bold mt-4">
            {title}
            {required ? '*' : ''}:
          </div>
          <select
            className="form-select dark:bg-slate-700 mt-2"
            aria-label={name}
            name={name}
            id={name}
            multiple={multi}
            required={required}
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
