export default function generateInstance(schema, data) {
  let profile = {}

  Object.keys(data)
    .filter(name => data[name] !== '')
    .forEach(name => {
      if (schema.properties[name]?.type === 'number') {
        profile[name] = parseFloat(data[name])
      } else if (
        schema.properties[name]?.type === 'array' &&
        schema.properties[name].items.type === 'string' &&
        !schema.properties[name].items.enum
      ) {
        profile[name] = data[name].split(',')
        profile[name] = profile[name].map(item => item.trim())
      } else if (name.includes('-')) {
        profile = parseArrayObject(name, data[name], schema, profile)
      } else {
        profile[name] = data[name]
      }
    })
  return profile
}

/*
// When the field name has "-" symbol, it has objects or arrays.
//
// For example,
// some_obj-some_arr-0-some_string
// We split into ['some_obj', 'some_arr', '0', 'some_string']
// There are two ways to determining the field is array type.
// (1) field name is number(multiple arrays)
// (2) schema type is array
//
// For other situations, the content will be parsed as an object.
*/
function parseArrayObject(fieldName, fieldData, schema, profile) {
  let arrayFields = fieldName.split('-')
  let currentProfile = profile
  let currentSchema = schema

  for (let i = 0; i < arrayFields.length; i++) {
    // The last item comes with value
    if (i === arrayFields.length - 1) {
      if (currentSchema?.type === 'array') {
        if (Array.isArray(fieldData)) {
          // eslint-disable-next-line no-loop-func
          fieldData.forEach(data => {
            currentProfile.push(data)
          })
        } else {
          currentProfile.push(fieldData)
        }
      } else if (
        currentSchema?.properties[arrayFields[i]]?.type === 'array' &&
        currentSchema.properties[arrayFields[i]].items.enum === undefined
      ) {
        let newArray = []
        newArray.push(fieldData)
        currentProfile[arrayFields[i]] = newArray
      } else if (currentSchema?.properties[arrayFields[i]]?.type === 'number') {
        currentProfile[arrayFields[i]] = parseFloat(fieldData)
      } else {
        currentProfile[arrayFields[i]] = fieldData
      }
    } else {
      // If the next item is number, we need add it as an array.
      if (
        currentProfile[arrayFields[i]] === undefined ||
        currentProfile[arrayFields[i]] === 0
      ) {
        if (!isNaN(arrayFields[i + 1])) {
          currentProfile[arrayFields[i]] = []
        } else {
          currentProfile[arrayFields[i]] = {}
        }
      }

      // Add field and get into the next level
      currentProfile = currentProfile[arrayFields[i]]

      // If it's an array, we need to retrieve the next level data by "items"
      if (!isNaN(arrayFields[i])) {
        currentSchema = currentSchema.items
      } else {
        currentSchema = currentSchema.properties[arrayFields[i]]
      }
    }
  }

  return profile
}
