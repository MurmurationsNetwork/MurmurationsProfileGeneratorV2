import generateInstance from './generateInstance'
import {
  test_schema_1,
  test_schema_2,
  test_schema_3,
  test_schema_4
} from './test_schemas'

describe('generateInstance tests', () => {
  it('Should extract nested fields in an object', () => {
    let formData = {
      linked_schemas: 'test_schema',
      name: 'The Dude',
      'geolocation-lat': '34.05',
      'geolocation-lon': '-118.24'
    }
    let expected = {
      linked_schemas: ['test_schema'],
      name: 'The Dude',
      geolocation: { lat: 34.05, lon: -118.24 }
    }
    let received = generateInstance(test_schema_1, formData)
    expect(received).toEqual(expected)
  })

  it('Should handle an array of objects', () => {
    let formData = {
      linked_schemas: 'test_schema',
      name: 'Popular Languages',
      'urls-0-name': 'JavaScript',
      'urls-0-url': 'https://javascript.com',
      'urls-1-name': 'Golang',
      'urls-1-url': 'https://go.dev',
      country: 'AF'
    }
    let expected = {
      linked_schemas: ['test_schema'],
      name: 'Popular Languages',
      urls: [
        { name: 'JavaScript', url: 'https://javascript.com' },
        { name: 'Golang', url: 'https://go.dev' }
      ],
      country: 'AF'
    }
    let received = generateInstance(test_schema_2, formData)
    expect(received).toEqual(expected)
  })

  it('Should handle multiple nested objects', () => {
    let formData = {
      linked_schemas: 'test_schema',
      'person-name': 'The Dude',
      'person-address-street': '609 Venezia Avenue',
      'person-address-location-locality': 'Venice',
      'person-address-location-region': 'California',
      'person-address-location-country': 'USA'
    }
    let expected = {
      linked_schemas: ['test_schema'],
      person: {
        name: 'The Dude',
        address: {
          street: '609 Venezia Avenue',
          location: {
            locality: 'Venice',
            region: 'California',
            country: 'USA'
          }
        }
      }
    }
    let received = generateInstance(test_schema_3, formData)
    expect(received).toEqual(expected)
  })

  it('Should handle single and multiple input enumerated input lists', () => {
    let formData = {
      linked_schemas: 'test_schema',
      single_choice: 'zero',
      multi_choice: ['zero', 'one']
    }
    let expected = {
      linked_schemas: ['test_schema'],
      single_choice: 'zero',
      multi_choice: ['zero', 'one']
    }
    let received = generateInstance(test_schema_4, formData)
    expect(received).toEqual(expected)
  })

  it('Should handle single and multiple input enumerated input lists embedded in an object', () => {
    let formData = {
      linked_schemas: 'test_schema',
      'wrapping_object-single_choice': 'zero',
      'wrapping_object-multi_choice': ['zero', 'one']
    }
    let expected = {
      linked_schemas: ['test_schema'],
      wrapping_object: {
        single_choice: 'zero',
        multi_choice: ['zero', 'one']
      }
    }
    let received = generateInstance(test_schema_4, formData)
    expect(received).toEqual(expected)
  })
})
