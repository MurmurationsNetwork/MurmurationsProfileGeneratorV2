import React from 'react'

import EnumField from '../components/EnumField'
import FormField from '../components/FormField'
import MultipleFormField from '../components/MultipleFormField'

export default function generateForm(
  schema,
  profileData,
  objName,
  requiredField = schema.required,
  parentObjRequired = true
) {
  if (!schema.properties) return null
  // eslint-disable-next-line array-callback-return
  return Object.keys(schema.properties).map((name, index) => {
    if (name === 'linked_schemas') {
      return (
        <input
          type="hidden"
          name="linked_schemas"
          key="linked_schemas"
          value={schema.metadata.schema}
        />
      )
    }

    if (schema.properties[name].default) {
      return (
        <input
          type="hidden"
          name={name}
          key={name}
          value={schema.properties[name].default}
        />
      )
    }

    // Define data for root schema
    let title = schema.properties[name].title
    let description = schema.properties[name].description
    let type = schema.properties[name].type
    let strName = name
    let value = profileData ? profileData[name] : undefined
    if (objName) strName = objName + '-' + name

    let objectDescription
    if (index === 0) {
      objectDescription = schema.description
    }

    let requiredForLabel = false
    if (requiredField && requiredField.includes(name)) {
      requiredForLabel = true
    }

    let requiredForInput = requiredForLabel
    // if the parent is not required, set input required to false
    if (!parentObjRequired) {
      requiredForInput = false
    }

    if (type === 'boolean' || type === 'null') return null

    if (type === 'string') {
      if (schema.properties[name].enum) {
        let enumList = schema.properties[name].enum
        let enumNamesList = schema.properties[name].enumNames
        return (
          <EnumField
            description={description}
            name={strName}
            title={title}
            enumList={enumList}
            enumNamesList={enumNamesList}
            key={strName + value}
            objectDescription={objectDescription}
            requiredForLabel={requiredForLabel}
            requiredForInput={requiredForInput}
            value={value}
          />
        )
      }

      let maxLength = schema.properties[name].maxLength
      let minLength = schema.properties[name].minLength
      let pattern = schema.properties[name].pattern

      return (
        <FormField
          name={strName}
          description={description}
          type="text"
          title={title}
          maxlength={maxLength}
          minlength={minLength}
          pattern={pattern}
          key={strName + value}
          objectDescription={objectDescription}
          requiredForLabel={requiredForLabel}
          requiredForInput={requiredForInput}
          value={value}
        />
      )
    }

    if (type === 'number') {
      let max = schema.properties[name].maximum
      let min = schema.properties[name].minimum

      return (
        <FormField
          name={strName}
          description={description}
          type={type}
          title={title}
          max={max}
          min={min}
          key={strName + value}
          objectDescription={objectDescription}
          step="any"
          requiredForLabel={requiredForLabel}
          requiredForInput={requiredForInput}
          value={value}
        />
      )
    }

    if (type === 'array') {
      if (schema.properties[name].items.enum) {
        let enumList = schema.properties[name].items.enum
        let enumNamesList = schema.properties[name].items.enumNames
        return (
          <EnumField
            name={strName}
            description={description}
            title={title}
            enumList={enumList}
            enumNamesList={enumNamesList}
            key={strName + value}
            multi={true}
            requiredForLabel={requiredForLabel}
            requiredForInput={requiredForInput}
            value={value}
          />
        )
      }

      let objProperties = {
        ARRAY_TYPE: schema.properties[name].items.type
      }
      let maxItems = schema.properties[name].maxItems
      let objTitle = schema.properties[name].items.title
      let objDescription = schema.properties[name].items.description

      if (schema.properties[name].items?.type === 'object') {
        objProperties = replaceObjNames(
          schema.properties[name].items.properties,
          {},
          schema.properties[name].items.required,
          requiredForInput
        )
      }

      return (
        <MultipleFormField
          name={strName}
          description={description}
          title={title}
          key={strName + value}
          objects={objProperties}
          objTitle={objTitle}
          objDescription={objDescription}
          maxItems={maxItems}
          requiredForLabel={requiredForLabel}
          value={value}
        />
      )
    }

    if (type === 'object') {
      let profileObjectData = profileData ? profileData[name] : undefined
      if (objName) {
        objName += '-' + name
        return (
          <fieldset
            key={index}
            className="border-dotted border-4 border-slate-300 p-4 my-4"
          >
            <legend className="block text-md font-bold mt-2">
              {schema.properties[name].title}
              {requiredForLabel ? (
                <span className="text-red-500 dark:text-red-400">*</span>
              ) : (
                ''
              )}
            </legend>
            {generateForm(
              schema.properties[name],
              profileObjectData,
              objName,
              schema.properties.required,
              requiredForInput
            )}
          </fieldset>
        )
      }
      return (
        <fieldset
          key={index}
          className="border-dotted border-4 border-slate-300 p-4 my-4"
        >
          <legend className="block text-md font-bold mt-2">
            {schema.properties[name].title}
            {requiredForLabel ? (
              <span className="text-red-500 dark:text-red-400">*</span>
            ) : (
              ''
            )}
          </legend>
          {generateForm(
            schema.properties[name],
            profileObjectData,
            name,
            schema.properties.required,
            requiredForInput
          )}
        </fieldset>
      )
    }

    console.error('Undefined type in generateForm')
  })
}

/*
// This function is only used for MultipleFormField
// It replaces all objects with their parent name.
//
// For example:
// obj_a: { obj_b : {xxx}} will be replaced with the following format
// obj_a: { obj_a-obj_b : {xxx}}
*/
function replaceObjNames(
  objProperties,
  newObjProperties,
  requiredFields,
  requiredForInput,
  parentName
) {
  if (objProperties === undefined) {
    return newObjProperties
  }

  Object.keys(objProperties).forEach(name => {
    let type = objProperties[name].type
    let newObjName = name
    if (parentName) newObjName = parentName + '-' + name

    // requiredFields is an array, if it's true, show * in the front-end
    let requiredForLabel = false
    if (requiredFields && requiredFields.includes(name)) {
      requiredForLabel = true
    }

    // requiredForInput inherent from root. There are four situations for requiredForInput.
    // 1. requiredForInput root is true, current label is false => set current requiredForInput to false.
    // 2. requiredForInput root is true, current label is true => Don't do anything, requiredForInput is true.
    // 3. requiredForInput root is false, current label is true => Don't do anything, requiredForInput is false.
    // 4. requiredForInput root is false, current label is false => Don't do anything, requiredForInput is false.
    if (!requiredForLabel) {
      requiredForInput = false
    }

    objProperties[name]['requiredForLabel'] = requiredForLabel
    objProperties[name]['requiredForInput'] = requiredForInput

    if (type === 'object') {
      newObjProperties = replaceObjNames(
        objProperties[name].properties,
        newObjProperties,
        objProperties[name].required,
        requiredForInput,
        newObjName
      )
    } else if (type === 'array') {
      newObjProperties[newObjName + '-0'] = objProperties[name]
    } else {
      newObjProperties[newObjName] = objProperties[name]
    }
  })

  return newObjProperties
}
