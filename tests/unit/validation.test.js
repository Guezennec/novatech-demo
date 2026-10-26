/**
 * Validation Module Unit Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getErrorMessage,
  validateForm,
  isValidEmail,
  isValidPhone,
} from '../../src/js/validation.js';

/**
 * Build a minimal stand-in for a form field (no DOM needed)
 * @param {Object} props - Field properties to override
 * @returns {Object} Fake field
 */
function fakeField(props = {}) {
  const classes = new Set();
  return {
    id: '',
    name: '',
    type: 'text',
    value: '',
    required: false,
    minLength: -1,
    maxLength: -1,
    pattern: '',
    title: '',
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
    },
    ...props,
  };
}

describe('isValidEmail', () => {
  it('should accept valid email addresses', () => {
    ['test@example.com', 'user.name@domain.org', 'user+tag@example.co.uk', ' a@b.io '].forEach(
      (email) => assert.strictEqual(isValidEmail(email), true, `Expected ${email} to be valid`)
    );
  });

  it('should reject invalid email addresses', () => {
    ['invalid', 'invalid@', '@example.com', 'user @example.com', 'user@example'].forEach(
      (email) => assert.strictEqual(isValidEmail(email), false, `Expected ${email} to be invalid`)
    );
  });
});

describe('isValidPhone', () => {
  it('should accept valid phone numbers', () => {
    ['1234567890', '+1 (555) 123-4567', '555-123-4567', '+44 20 7946 0958'].forEach((phone) =>
      assert.strictEqual(isValidPhone(phone), true, `Expected ${phone} to be valid`)
    );
  });

  it('should reject numbers that are too short or contain letters', () => {
    ['123', 'abc', '12345', '555-CALL-NOW'].forEach((phone) =>
      assert.strictEqual(isValidPhone(phone), false, `Expected ${phone} to be invalid`)
    );
  });

  it('should reject values made only of separators', () => {
    ['----------', '          ', '((((()))))', '+++++++++++'].forEach((phone) =>
      assert.strictEqual(isValidPhone(phone), false, `Expected "${phone}" to be invalid`)
    );
  });

  it('should only allow "+" at the start', () => {
    assert.strictEqual(isValidPhone('555+123+4567'), false);
  });
});

describe('getErrorMessage', () => {
  it('should require a non-blank value for required fields', () => {
    ['', '   ', '\t', '\n'].forEach((value) =>
      assert.strictEqual(
        getErrorMessage(fakeField({ required: true, value })),
        'This field is required'
      )
    );
  });

  it('should accept an empty optional field', () => {
    assert.strictEqual(getErrorMessage(fakeField({ type: 'email' })), '');
  });

  it('should validate email and tel types', () => {
    assert.strictEqual(
      getErrorMessage(fakeField({ type: 'email', value: 'nope' })),
      'Please enter a valid email address'
    );
    assert.strictEqual(
      getErrorMessage(fakeField({ type: 'tel', value: '----------' })),
      'Please enter a valid phone number'
    );
  });

  it('should apply minLength and maxLength to every type, including email', () => {
    assert.strictEqual(
      getErrorMessage(fakeField({ value: 'abc', minLength: 5 })),
      'Please enter at least 5 characters'
    );
    assert.strictEqual(
      getErrorMessage(fakeField({ type: 'email', value: 'a@b.io', minLength: 10 })),
      'Please enter at least 10 characters'
    );
    assert.strictEqual(
      getErrorMessage(fakeField({ value: 'abcdef', maxLength: 3 })),
      'Please enter no more than 3 characters'
    );
  });

  it('should enforce the pattern attribute as a whole-value match', () => {
    const field = { pattern: '[A-Z]{3}' };
    assert.strictEqual(getErrorMessage(fakeField({ ...field, value: 'ABC' })), '');
    assert.strictEqual(
      getErrorMessage(fakeField({ ...field, value: 'ABCD' })),
      'Please match the requested format'
    );
    assert.strictEqual(
      getErrorMessage(fakeField({ ...field, value: 'abc', title: 'Three capital letters' })),
      'Three capital letters'
    );
  });

  it('should use the checked state for required checkboxes', () => {
    const checkbox = { type: 'checkbox', value: 'on', required: true };
    assert.strictEqual(
      getErrorMessage(fakeField({ ...checkbox, checked: false })),
      'This field is required'
    );
    assert.strictEqual(getErrorMessage(fakeField({ ...checkbox, checked: true })), '');
  });
});

describe('validateForm', () => {
  it('should return errors in order with the invalid elements', () => {
    const name = fakeField({ name: 'name', required: true, value: '' });
    const email = fakeField({ name: 'email', type: 'email', value: 'ok@example.com' });
    const phone = fakeField({ name: 'phone', type: 'tel', value: '123' });
    const form = { querySelectorAll: () => [name, email, phone] };

    const result = validateForm(form);

    assert.strictEqual(result.isValid, false);
    assert.deepStrictEqual(
      result.errors.map((e) => e.field),
      ['name', 'phone']
    );
    assert.strictEqual(result.errors[0].element, name);
    assert.strictEqual(name.classList.contains('is-invalid'), true);
    assert.strictEqual(email.classList.contains('is-invalid'), false);
  });

  it('should be valid when every field passes', () => {
    const form = {
      querySelectorAll: () => [fakeField({ name: 'name', required: true, value: 'Ada' })],
    };
    assert.deepStrictEqual(validateForm(form), { isValid: true, errors: [] });
  });
});
