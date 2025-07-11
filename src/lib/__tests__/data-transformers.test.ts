/**
 * Unit tests for data transformation utilities
 */

import {
  DatabaseFormatters,
  FormNormalizers,
  ContactDataTransformer,
  DetailedError,
  DataValidators,
} from '../data-transformers';

describe('DatabaseFormatters', () => {
  describe('toLocation', () => {
    it('should convert valid string to location object', () => {
      expect(DatabaseFormatters.toLocation('New York')).toEqual({ location: 'New York' });
    });

    it('should handle empty/null values', () => {
      expect(DatabaseFormatters.toLocation('')).toBeNull();
      expect(DatabaseFormatters.toLocation(null)).toBeNull();
      expect(DatabaseFormatters.toLocation(undefined)).toBeNull();
      expect(DatabaseFormatters.toLocation('   ')).toBeNull();
    });

    it('should trim whitespace', () => {
      expect(DatabaseFormatters.toLocation('  London  ')).toEqual({ location: 'London' });
    });
  });

  describe('toArray', () => {
    it('should convert valid string to array', () => {
      expect(DatabaseFormatters.toArray('value')).toEqual(['value']);
    });

    it('should handle empty/null values', () => {
      expect(DatabaseFormatters.toArray('')).toEqual([]);
      expect(DatabaseFormatters.toArray(null)).toEqual([]);
      expect(DatabaseFormatters.toArray(undefined)).toEqual([]);
      expect(DatabaseFormatters.toArray('   ')).toEqual([]);
    });

    it('should trim whitespace', () => {
      expect(DatabaseFormatters.toArray('  test  ')).toEqual(['test']);
    });
  });

  describe('toJsonbValue', () => {
    it('should convert valid string to jsonb value object', () => {
      expect(DatabaseFormatters.toJsonbValue('remote')).toEqual({ value: 'remote' });
    });

    it('should handle empty/null values', () => {
      expect(DatabaseFormatters.toJsonbValue('')).toBeNull();
      expect(DatabaseFormatters.toJsonbValue(null)).toBeNull();
      expect(DatabaseFormatters.toJsonbValue(undefined)).toBeNull();
    });
  });

  describe('toContactType', () => {
    it('should return valid contact types', () => {
      expect(DatabaseFormatters.toContactType('candidate')).toBe('candidate');
      expect(DatabaseFormatters.toContactType('client')).toBe('client');
      expect(DatabaseFormatters.toContactType('both')).toBe('both');
    });

    it('should fallback to candidate for invalid values', () => {
      expect(DatabaseFormatters.toContactType('invalid')).toBe('candidate');
      expect(DatabaseFormatters.toContactType(null)).toBe('candidate');
      expect(DatabaseFormatters.toContactType(undefined)).toBe('candidate');
      expect(DatabaseFormatters.toContactType(123)).toBe('candidate');
    });
  });
});

describe('FormNormalizers', () => {
  describe('toString', () => {
    it('should handle primitive values', () => {
      expect(FormNormalizers.toString('test')).toBe('test');
      expect(FormNormalizers.toString(123)).toBe('123');
      expect(FormNormalizers.toString(null)).toBe('');
      expect(FormNormalizers.toString(undefined)).toBe('');
    });

    it('should handle arrays', () => {
      expect(FormNormalizers.toString(['first', 'second'])).toBe('first');
      expect(FormNormalizers.toString([])).toBe('');
    });

    it('should handle objects', () => {
      expect(FormNormalizers.toString({ value: 'test' })).toBe('test');
      expect(FormNormalizers.toString({ label: 'label' })).toBe('label');
      expect(FormNormalizers.toString({ name: 'name' })).toBe('name');
      expect(FormNormalizers.toString({ location: 'location' })).toBe('location');
      expect(FormNormalizers.toString({ other: 'prop' })).toBe('');
    });
  });

  describe('toBoolean', () => {
    it('should handle boolean values', () => {
      expect(FormNormalizers.toBoolean(true)).toBe(true);
      expect(FormNormalizers.toBoolean(false)).toBe(false);
    });

    it('should handle string values', () => {
      expect(FormNormalizers.toBoolean('true')).toBe(true);
      expect(FormNormalizers.toBoolean('True')).toBe(true);
      expect(FormNormalizers.toBoolean('TRUE')).toBe(true);
      expect(FormNormalizers.toBoolean('false')).toBe(false);
      expect(FormNormalizers.toBoolean('anything')).toBe(false);
    });

    it('should handle other values', () => {
      expect(FormNormalizers.toBoolean(1)).toBe(true);
      expect(FormNormalizers.toBoolean(0)).toBe(false);
      expect(FormNormalizers.toBoolean(null)).toBe(false);
      expect(FormNormalizers.toBoolean(undefined)).toBe(false);
    });
  });
});

describe('ContactDataTransformer', () => {
  const mockFormData = {
    first_name: 'John',
    last_name: 'Doe',
    personal_email: 'john@example.com',
    current_location: 'New York',
    contact_type: 'candidate',
    past_company_sizes: '50-100',
    other_social_urls: 'https://twitter.com/johndoe',
    workplace_preferences: 'remote',
    compensation_expectations: '100000',
    visa_requirements: false,
  };

  describe('forCreate', () => {
    it('should transform form data for database creation', () => {
      const result = ContactDataTransformer.forCreate(mockFormData);
      
      expect(result.current_location).toEqual({ location: 'New York' });
      expect(result.past_company_sizes).toEqual(['50-100']);
      expect(result.other_social_urls).toEqual({ value: 'https://twitter.com/johndoe' });
      expect(result.workplace_preferences).toEqual({ value: 'remote' });
      expect(result.contact_type).toBe('candidate');
      expect(result.visa_requirements).toBe(false);
    });

    it('should handle empty values', () => {
      const emptyData = {
        current_location: '',
        past_company_sizes: '',
        other_social_urls: '',
        workplace_preferences: '',
        contact_type: 'invalid',
      };
      
      const result = ContactDataTransformer.forCreate(emptyData);
      
      expect(result.current_location).toBeNull();
      expect(result.past_company_sizes).toEqual([]);
      expect(result.other_social_urls).toBeNull();
      expect(result.workplace_preferences).toBeNull();
      expect(result.contact_type).toBe('candidate'); // fallback
    });
  });

  describe('forUpdate', () => {
    it('should include updated_by field', () => {
      const userId = 'user-123';
      const result = ContactDataTransformer.forUpdate(mockFormData, userId);
      
      expect(result.updated_by).toBe(userId);
      expect(result.current_location).toEqual({ location: 'New York' });
    });
  });

  describe('forForm', () => {
    const mockDbData = {
      first_name: 'John',
      last_name: 'Doe',
      current_location: { location: 'New York' },
      contact_type: 'client',
      past_company_sizes: ['50-100'],
      other_social_urls: { value: 'https://twitter.com/johndoe' },
      visa_requirements: true,
    };

    it('should transform database data for form display', () => {
      const result = ContactDataTransformer.forForm(mockDbData);
      
      expect(result.first_name).toBe('John');
      expect(result.current_location).toBe('New York');
      expect(result.contact_type).toBe('client');
      expect(result.past_company_sizes).toBe('50-100');
      expect(result.other_social_urls).toBe('https://twitter.com/johndoe');
      expect(result.visa_requirements).toBe(true);
    });

    it('should handle missing fields gracefully', () => {
      const result = ContactDataTransformer.forForm({});
      
      expect(result.first_name).toBe('');
      expect(result.current_location).toBe('');
      expect(result.contact_type).toBe('candidate'); // fallback
      expect(result.visa_requirements).toBe(false);
    });
  });
});

describe('DetailedError', () => {
  it('should create error with context', () => {
    const context = { contactId: '123', operation: 'update' };
    const error = new DetailedError('Test error', context);
    
    expect(error.message).toBe('Test error');
    expect(error.context).toEqual(context);
    expect(error.name).toBe('DetailedError');
    expect(error instanceof Error).toBe(true);
  });

  it('should work without context', () => {
    const error = new DetailedError('Test error');
    
    expect(error.message).toBe('Test error');
    expect(error.context).toEqual({});
  });
});

describe('DataValidators', () => {
  describe('isValidContactType', () => {
    it('should validate correct contact types', () => {
      expect(DataValidators.isValidContactType('candidate')).toBe(true);
      expect(DataValidators.isValidContactType('client')).toBe(true);
      expect(DataValidators.isValidContactType('both')).toBe(true);
    });

    it('should reject invalid contact types', () => {
      expect(DataValidators.isValidContactType('invalid')).toBe(false);
      expect(DataValidators.isValidContactType(null)).toBe(false);
      expect(DataValidators.isValidContactType(undefined)).toBe(false);
      expect(DataValidators.isValidContactType(123)).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(DataValidators.isValidEmail('test@example.com')).toBe(true);
      expect(DataValidators.isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(DataValidators.isValidEmail('invalid')).toBe(false);
      expect(DataValidators.isValidEmail('test@')).toBe(false);
      expect(DataValidators.isValidEmail('@example.com')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(DataValidators.isValidUrl('https://example.com')).toBe(true);
      expect(DataValidators.isValidUrl('http://test.org/path')).toBe(true);
    });

    it('should allow empty URLs (optional)', () => {
      expect(DataValidators.isValidUrl('')).toBe(true);
      expect(DataValidators.isValidUrl('   ')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(DataValidators.isValidUrl('not-a-url')).toBe(false);
      expect(DataValidators.isValidUrl('just-text')).toBe(false);
      expect(DataValidators.isValidUrl('http://')).toBe(false);
    });
  });
});