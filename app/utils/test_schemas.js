export const schemaHeader = {
  $schema: 'https://json-schema.org/draft-07/schema#',
  $id: 'https://ic3.dev/test_schema.json',
  title: 'Test Schema',
  description: 'Just for testing',
  type: 'object'
}

const linked_schemas = {
  type: 'array',
  items: { type: 'string', pattern: '[A-Za-z0-9-._]{4,100}$' },
  minItems: 1,
  maxItems: 10,
  uniqueItems: true
}

const metadata = {
  schema: {
    name: 'test_schema'
  }
}

export const test_schema_1 = {
  ...schemaHeader,
  properties: {
    linked_schemas: linked_schemas,
    name: {
      type: 'string'
    },
    geolocation: {
      type: 'object',
      properties: {
        lat: {
          type: 'number'
        },
        lon: {
          type: 'number'
        }
      },
      required: ['lat', 'lon']
    }
  },
  required: ['linked_schemas', 'name', 'geolocation'],
  metadata: metadata
}

export const test_schema_2 = {
  ...schemaHeader,
  properties: {
    linked_schemas: linked_schemas,
    name: {
      type: 'string'
    },
    urls: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string'
          },
          url: {
            type: 'string',
            pattern: '^https?://.*'
          }
        },
        required: ['name', 'url']
      }
    }
  },
  required: ['linked_schemas', 'name', 'urls'],
  metadata: metadata
}

export const test_schema_3 = {
  ...schemaHeader,
  properties: {
    linked_schemas: linked_schemas,
    person: {
      type: 'object',
      properties: {
        name: {
          type: 'string'
        },
        address: {
          type: 'object',
          properties: {
            street: {
              type: 'string'
            },
            location: {
              type: 'object',
              properties: {
                locality: {
                  type: 'string'
                },
                region: {
                  type: 'string'
                },
                country: {
                  type: 'string'
                }
              },
              required: ['country', 'locality']
            }
          },
          required: ['location']
        }
      },
      required: ['name']
    }
  },
  required: ['linked_schemas', 'person'],
  metadata: metadata
}

export const test_schema_4 = {
  ...schemaHeader,
  properties: {
    linked_schemas: linked_schemas,
    single_choice: {
      type: 'string',
      enum: ['zero', 'one', 'two', 'three', 'four'],
      enumNames: ['None', 'First', 'Second', 'Third', 'Fourth']
    },
    multiple_choice: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['one', 'two', 'three', 'four', 'five'],
        enumNames: ['First', 'Second', 'Third', 'Fourth', 'Fifth']
      }
    }
  },
  required: ['linked_schemas', 'single_choice', 'multiple_choice'],
  metadata: metadata
}

export const test_schema_5 = {
  ...schemaHeader,
  properties: {
    linked_schemas: linked_schemas,
    wrapping_object: {
      type: 'object',
      properties: {
        single_choice: {
          type: 'string',
          enum: ['zero', 'one', 'two', 'three', 'four'],
          enumNames: ['None', 'First', 'Second', 'Third', 'Fourth']
        },
        multiple_choice: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['one', 'two', 'three', 'four', 'five'],
            enumNames: ['First', 'Second', 'Third', 'Fourth', 'Fifth']
          }
        }
      }
    }
  },
  required: ['linked_schemas', 'wrapping_object'],
  metadata: metadata
}
