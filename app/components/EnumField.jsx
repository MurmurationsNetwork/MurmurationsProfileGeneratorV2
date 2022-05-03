import React from 'react'

export default function EnumField({
  description,
  enumList,
  enumNamesList,
  multi,
  name,
  title,
  objectTitle,
  objectDescription
}) {
  return (
    <span className="block text-sm font-bold my-2">
      {objectTitle ? <>{objectTitle} --</> : ''}
      {objectDescription ? objectDescription : ''}
      <label>
        <span className="key block text-sm font-bold my-2">{title}:</span>
        <select
          className="form-select"
          aria-label={name}
          name={name}
          id={name}
          multiple={multi}
        >
          {multi ? null : <option value="" key="0"></option>}
          {enumList.map((item, index) => (
            <option value={item} key={item}>
              {enumNamesList ? enumNamesList[index] : item}
            </option>
          ))}
        </select>
      </label>
      <br />
      <span>{description}</span>
    </span>
  )
}
