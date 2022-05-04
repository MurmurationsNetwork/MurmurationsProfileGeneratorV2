import React from 'react'

import EnumField from '../components/EnumField'
import FormField from '../components/FormField'
import MultipleFormField from '../components/MultipleFormField'

export default function generateForm(schema, objName) {
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
    let title = schema.properties[name].title
    let description = schema.properties[name].description
    let type = schema.properties[name].type
    let strName = name
    if (objName) strName = objName + '-' + name

    let objectTitle
    let objectDescription
    if (index === 0) {
      objectTitle = schema.title
      objectDescription = schema.description
    }

    let required = false
    if (schema.required.includes(name)) {
      required = true
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
            required={required}
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
          required={required}
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
          required={required}
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
            required={required}
          />
        )
      }

      let objProperties = {
        ARRAY_TYPE: schema.properties[name].items.type
      }
      let maxItems = schema.properties[name].maxItems
      let objTitle = schema.properties[name].items.title
      let objDescription = schema.properties[name].items.description
      let objRequired = schema.properties[name].items.required

      if (schema.properties[name].items?.type === 'object') {
        objProperties = replaceObjNames(
          schema.properties[name].items.properties,
          {}
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
          objRequired={objRequired}
          required={required}
        />
      )
    }

    if (type === 'object') {
      if (objName) {
        objName += '-' + name
        return generateForm(schema.properties[name], objName)
      }
      return generateForm(schema.properties[name], name)
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
function replaceObjNames(objProperties, newObjProperties, parentName) {
  if (objProperties === undefined) {
    return newObjProperties
  }

  Object.keys(objProperties).forEach(name => {
    let type = objProperties[name].type
    let newObjName = name
    if (parentName) newObjName = parentName + '-' + name
    if (type === 'object') {
      newObjProperties = replaceObjNames(
        objProperties[name].properties,
        newObjProperties,
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
