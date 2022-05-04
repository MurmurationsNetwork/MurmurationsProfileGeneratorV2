import React from 'react'

import EnumField from '../components/EnumField'
import FormField from '../components/FormField'
import MultipleFormField from '../components/MultipleFormField'

export default function generateForm(
  schema,
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
    // Define data for root schema
    let requiredForLabel = false
    if (requiredField && requiredField.includes(name)) {
      requiredForLabel = true
    }

    let requiredForInput = requiredForLabel
    // if the parent is not required, set input required to false
    if (!parentObjRequired) {
      requiredForInput = false
    }

    let title = schema.properties[name].title
    let description = schema.properties[name].description
    let type = schema.properties[name].type
    let strName = name
    if (objName) strName = objName + '-' + name

    let objectTitle
    let objectDescription
    if (index === 0) {
      objectTitle = schema.title
      if (requiredForLabel) {
        objectTitle += '*'
      }
      objectDescription = schema.description
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
            key={strName}
            objectTitle={objectTitle}
            objectDescription={objectDescription}
            requiredForLabel={requiredForLabel}
            requiredForInput={requiredForInput}
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
          key={strName}
          objectTitle={objectTitle}
          objectDescription={objectDescription}
          requiredForLabel={requiredForLabel}
          requiredForInput={requiredForInput}
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
          key={strName}
          objectTitle={objectTitle}
          objectDescription={objectDescription}
          step="any"
          requiredForLabel={requiredForLabel}
          requiredForInput={requiredForInput}
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
            key={strName}
            multi={true}
            requiredForLabel={requiredForLabel}
            requiredForInput={requiredForInput}
          />
        )
      }

      let objProperties = {
        ARRAY_TYPE: schema.properties[name].items.type,
        requiredForLabel: requiredForLabel,
        requiredForInput: requiredForInput
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
          key={strName}
          objects={objProperties}
          objTitle={objTitle}
          objDescription={objDescription}
          maxItems={maxItems}
          requiredForLabel={requiredForLabel}
        />
      )
    }

    if (type === 'object') {
      if (objName) {
        objName += '-' + name
        return generateForm(
          schema.properties[name],
          objName,
          schema.properties.required,
          requiredForInput
        )
      }
      return generateForm(
        schema.properties[name],
        name,
        schema.properties.required,
        requiredForInput
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
  required,
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

    let isRequired = false
    if (required && required.includes(name)) {
      isRequired = true
    }

    if (!isRequired) {
      requiredForInput = false
    }

    objProperties[name]['requiredForLabel'] = isRequired
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
