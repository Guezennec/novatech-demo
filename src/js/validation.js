/**
 * Validation Module
 * Reusable form validation utilities
 */

const CLASSES = {
  invalid: 'is-invalid',
};

const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // Digits, spaces, dashes and parentheses, with an optional leading "+"
  phoneChars: /^\+?[\d\s\-()]+$/,
};

const PHONE_MIN_DIGITS = 10;

const MESSAGES = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  pattern: 'Please match the requested format',
  minLength: (min) => `Please enter at least ${min} characters`,
  maxLength: (max) => `Please enter no more than ${max} characters`,
};

/**
 * Get validation rules for a field
 * @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} field - Form field
 * @returns {{required: boolean, type: string, minLength: ?number, maxLength: ?number, pattern: ?string}}
 */
function getValidationRules(field) {
  return {
    required: Boolean(field.required),
    type: field.type,
    minLength: field.minLength > 0 ? field.minLength : null,
    maxLength: field.maxLength > 0 ? field.maxLength : null,
    pattern: field.pattern || null,
  };
}

/**
 * Check whether a checkbox or radio field has a selection
 * @param {HTMLInputElement} field - Checkbox or radio input
 * @returns {boolean}
 */
function isChecked(field) {
  if (field.type === 'radio' && field.form && field.name) {
    return Array.from(field.form.elements).some(
      (el) => el.type === 'radio' && el.name === field.name && el.checked
    );
  }
  return Boolean(field.checked);
}

/**
 * Test a value against an HTML `pattern` attribute (whole-value match)
 * @param {string} value - Value to test
 * @param {string} pattern - Pattern attribute source
 * @returns {boolean} True if the value matches, or if the pattern is invalid
 */
function matchesPattern(value, pattern) {
  try {
    return new RegExp(`^(?:${pattern})$`, 'u').test(value);
  } catch {
    return true;
  }
}

/**
 * Get the validation error message for a field, without touching the UI.
 * Rules are checked in order and the first failure wins.
 * @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} field - Form field
 * @returns {string} Error message, or an empty string if the field is valid
 */
export function getErrorMessage(field) {
  const rules = getValidationRules(field);

  if (rules.type === 'checkbox' || rules.type === 'radio') {
    return rules.required && !isChecked(field) ? MESSAGES.required : '';
  }

  const value = field.value.trim();

  if (!value) {
    return rules.required ? MESSAGES.required : '';
  }
  if (rules.type === 'email' && !isValidEmail(value)) {
    return MESSAGES.email;
  }
  if (rules.type === 'tel' && !isValidPhone(value)) {
    return MESSAGES.phone;
  }
  if (rules.pattern && !matchesPattern(value, rules.pattern)) {
    return field.title || MESSAGES.pattern;
  }
  if (rules.minLength && value.length < rules.minLength) {
    return MESSAGES.minLength(rules.minLength);
  }
  if (rules.maxLength && value.length > rules.maxLength) {
    return MESSAGES.maxLength(rules.maxLength);
  }
  return '';
}

/**
 * Validate a single field and update its error UI
 * @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} field - Form field to validate
 * @returns {{isValid: boolean, message: string}}
 */
export function validateField(field) {
  const message = getErrorMessage(field);
  const isValid = message === '';
  const errorEl = field.id ? document.getElementById(`${field.id}-error`) : null;

  // Update UI
  if (isValid) {
    field.classList.remove(CLASSES.invalid);
    if (errorEl) {
      errorEl.textContent = '';
    }
  } else {
    field.classList.add(CLASSES.invalid);
    if (errorEl) {
      errorEl.textContent = message;
    }
  }

  return { isValid, message };
}

/**
 * Validate entire form
 * @param {HTMLFormElement} form - Form to validate
 * @returns {{isValid: boolean, errors: Array<{field: string, element: HTMLElement, message: string}>}}
 *   Errors are in document order, so `errors[0].element` is the first invalid field.
 */
export function validateForm(form) {
  const fields = form.querySelectorAll('input, textarea, select');
  const errors = [];

  fields.forEach((field) => {
    if (field.required || field.value) {
      const result = validateField(field);
      if (!result.isValid) {
        errors.push({
          field: field.name || field.id,
          element: field,
          message: result.message,
        });
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if email is valid
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return PATTERNS.email.test(email.trim());
}

/**
 * Check if phone is valid: allowed characters only, optional leading "+",
 * and at least 10 digits
 * @param {string} phone - Phone to validate
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  const value = phone.trim();
  const digitCount = value.replace(/\D/g, '').length;
  return PATTERNS.phoneChars.test(value) && digitCount >= PHONE_MIN_DIGITS;
}
