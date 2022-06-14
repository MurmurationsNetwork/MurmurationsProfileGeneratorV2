import React, { useState } from 'react'

export default function MultipleFormField({
  name,
  description,
  max,
  maxItems,
  maxlength,
  min,
  minlength,
  objDescription,
  objects,
  objTitle,
  pattern,
  requiredForLabel,
  title,
  value
}) {
  return (
    <fieldset className="border-dotted border-4 border-slate-300 p-4 my-4">
      <legend className="block text-md font-bold mt-2">
        {title}
        {requiredForLabel ? (
          <span className="text-red-500 dark:text-red-400">&nbsp;*</span>
        ) : (
          ''
        )}
      </legend>
      <span className="block text-sm mb-4">{description}</span>
      <MultipleFormFieldItems
        name={name}
        description={description}
        max={max}
        maxlength={maxlength}
        min={min}
        minlength={minlength}
        pattern={pattern}
        title={title}
        objects={objects}
        objTitle={objTitle}
        objDescription={objDescription}
        maxItems={maxItems}
        requiredForLabel={requiredForLabel}
        defaultValue={value}
      />
    </fieldset>
  )
}

function MultipleFormFieldItems({
  name,
  max,
  maxlength,
  min,
  minlength,
  pattern,
  objects,
  objTitle,
  objDescription,
  maxItems,
  requiredForLabel,
  defaultValue
}) {
  // Initialize an empty object
  // Format is fieldName-id-objectName
  let objName,
    fields = {},
    defaultFields = {},
    initialStateArray = []
  Object.keys(objects).forEach(obj => {
    if (defaultValue !== undefined) {
      for (let i = 0; i < defaultValue.length; i++) {
        if (obj === 'ARRAY_TYPE') {
          objName = name + '-' + i
          defaultFields[objName] = defaultValue[i]
        } else {
          // get object values inside objects
          let objName = name + '-' + i + '-' + obj
          let objValue = defaultValue[i][obj]
          if (obj.includes('-0')) {
            let objKey = obj.replace('-0', '')
            objValue = defaultValue[i][objKey]
          } else if (obj.includes('-')) {
            let strArray = obj.split('-')
            let objInsideValue = defaultValue[i]
            for (let j = 0; j < strArray.length; j++) {
              objInsideValue = objInsideValue[strArray[j]]
            }
            objValue = objInsideValue
          }
          defaultFields[objName] = objValue
        }
      }
    } else {
      objName = name + '-0-' + obj
      if (obj === 'ARRAY_TYPE') {
        objName = name + '-0'
      }
      fields[objName] = ''
    }
  })

  if (defaultValue !== undefined) {
    for (let i = 0; i < defaultValue.length; i++) {
      let filtered = Object.fromEntries(
        Object.entries(defaultFields).filter(([key]) => key.includes('-' + i))
      )
      initialStateArray.push(filtered)
    }
  } else {
    initialStateArray.push(fields)
  }

  const [inputList, setInputList] = useState(initialStateArray)

  const handleChange = (e, index) => {
    const { name, value } = e.target
    const list = [...inputList]
    list[index][name] = value
    setInputList(list)
  }

  const handleAddInput = index => {
    let addFields = {}
    Object.keys(objects).forEach(obj => {
      let objName = name + '-' + (index + 1) + '-' + obj
      if (obj === 'ARRAY_TYPE') {
        objName = name + '-' + (index + 1)
      }
      addFields[objName] = ''
    })
    setInputList([...inputList, addFields])
  }

  const handleRemoveInput = index => {
    const list = [...inputList]
    list.splice(index, 1)

    // reorder the list after delete
    list.forEach((l, lIndex) => {
      for (const object in l) {
        let oldIndex = object.replace(/[^0-9]/g, '')
        let newFieldName = object.replace(oldIndex, lIndex.toString())
        if (object !== newFieldName) {
          l[newFieldName] = l[object]
          delete l[object]
        }
      }
    })
    setInputList(list)
  }

  return inputList.map((item, i) => {
    return (
      <span key={i}>
        {objTitle !== undefined && (
          <>
            <span className="block text-md font-bold mt-2">
              {objTitle}
              {requiredForLabel ? (
                <span className="text-red-500 dark:text-red-400">&nbsp;*</span>
              ) : (
                ''
              )}
            </span>
            <span className="block text-md mb-4">{objDescription}</span>
          </>
        )}
        {Object.keys(objects).map((obj, objIndex) => {
          let value = item[name + '-' + i + '-' + obj]
          let fieldName = name + '-' + i + '-' + obj
          if (obj === 'ARRAY_TYPE') {
            value = item[name + '-' + i]
            fieldName = name + '-' + i
          }

          let objProperties = objects[obj]
          let title = objProperties.title
          let description = objProperties.description
          let objType = objProperties.type
          let enumList = objProperties.enum
          let enumNamesList = objProperties?.enumNames
          let multi = false
          if (objType === 'array') {
            objType = objProperties.items.type
            enumList = objProperties.items.enum
            enumNamesList = objProperties.items?.enumNames
            multi = true
          }

          let fieldRequired
          if (objProperties.requiredForLabel) {
            fieldRequired = true
          }

          if (enumList) {
            return (
              <div key={objIndex}>
                <label className="block text-sm font-bold my-2" key={objIndex}>
                  {title}:{' '}
                  {fieldRequired && (
                    <span className="text-red-500 dark:text-red-400">*</span>
                  )}
                </label>
                <select
                  className="form-select w-full dark:bg-slate-700 text-ellipsis"
                  aria-label={fieldName}
                  name={fieldName}
                  id={fieldName}
                  multiple={multi}
                  defaultValue={value}
                  required={objProperties.requiredForInput}
                >
                  {multi ? null : (
                    <option value="" key="0">
                      Select
                    </option>
                  )}
                  {enumList.map((enumV, enumI) => (
                    <option value={enumV} key={enumV}>
                      {enumNamesList ? enumNamesList[enumI] : enumV}
                    </option>
                  ))}
                </select>
                <br />
                <span className="text-xs">
                  {description ? description : ''}
                </span>
              </div>
            )
          }

          return (
            <div key={objIndex}>
              <label className="block text-sm font-bold my-2">
                {title && <span>{title}: </span>}
                {fieldRequired && (
                  <span className="text-red-500 dark:text-red-400">*</span>
                )}
              </label>
              <input
                className="form-input w-full dark:bg-slate-700"
                key={objIndex}
                type={objType}
                aria-label={fieldName}
                name={fieldName}
                max={max}
                maxLength={maxlength}
                min={min}
                minLength={minlength}
                pattern={pattern}
                value={value}
                required={objProperties.requiredForInput}
                onChange={e => handleChange(e, i)}
              />
              <br />
              <span className="text-xs">{description ? description : ''}</span>
            </div>
          )
        })}
        <div className="flex justify-around items-center">
          {inputList.length - 1 === i &&
            (maxItems === undefined || inputList.length < maxItems) && (
              <input
                className="rounded-full bg-red-500 dark:bg-purple-200 hover:bg-red-400 dark:hover:bg-purple-100 text-white dark:text-gray-800 hover:scale-110 font-bold py-2 px-4 my-4"
                type="button"
                value="Add"
                onClick={() => handleAddInput(i)}
              />
            )}
          {inputList.length !== 1 && (
            <input
              className="rounded-full bg-yellow-500 dark:bg-green-200 hover:bg-yellow-400 dark:hover:bg-green-100 text-white dark:text-gray-800 font-bold py-2 px-4 my-4"
              type="button"
              value="Remove"
              onClick={() => handleRemoveInput(i)}
            />
          )}
        </div>
        {/* </fieldset> */}
      </span>
    )
  })
}
