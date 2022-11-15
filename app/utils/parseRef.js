import refParser from '@apidevtools/json-schema-ref-parser'

export default async function parseRef(schemaName) {
  if (schemaName.includes(',')) {
    schemaName = schemaName.split(',')
  }
  let mergedSchema
  if (Array.isArray(schemaName)) {
    let schemas = []
    // need to wait all results and then return the data
    await Promise.all(
      schemaName.map(async name => {
        let res = await retrieveSchema(name)
        schemas.push(res)
      })
    )
    // Remove duplicate properties
    // todo: we only merge properties, required and schema here. If we need the other properties here, we should add it here.
    mergedSchema = schemas[0]
    let linked_schema = schemas[0].metadata.schema.name
    mergedSchema.metadata.schema = []
    mergedSchema.metadata.schema.push(linked_schema)
    schemas
      .filter((_, index) => index !== 0)
      .forEach(val => {
        // properties
        Object.keys(val.properties).forEach(schemasName => {
          if (!(schemasName in mergedSchema.properties)) {
            mergedSchema.properties[schemasName] = val.properties[schemasName]
          }
        })

        // required
        let isDuplicated
        val.required.forEach(requiredField => {
          for (let i = 0; i < mergedSchema.required.length; i++) {
            if (mergedSchema.required[i] === requiredField) {
              isDuplicated = true
              break
            }
          }
          if (!isDuplicated) {
            mergedSchema.required.push(requiredField)
          }
        })

        // metadata-schema
        mergedSchema.metadata.schema.push(val.metadata.schema.name)
      })
  } else {
    mergedSchema = await retrieveSchema(schemaName)
    // replace schema
    let linked_schema = mergedSchema.metadata.schema.name
    mergedSchema.metadata.schema = []
    mergedSchema.metadata.schema.push(linked_schema)
  }

  return mergedSchema
}

async function retrieveSchema(schemaName) {
  let url = `${process.env.PUBLIC_CDN_URL}/schemas/${schemaName}.json`
  return await refParser.dereference(url).catch(err => {
    throw new Response(`parseRef error: ${err}`, {
      status: 500
    })
  })
}
