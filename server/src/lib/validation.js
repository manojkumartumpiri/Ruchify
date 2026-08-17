export class ValidationError extends Error {}

export function requireString(value, field, { min = 1, max = 500 } = {}) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) {
    throw new ValidationError(`${field} must be between ${min} and ${max} characters.`);
  }
  return value.trim();
}

export function requireEmail(value) {
  const email = requireString(value, 'Email', { min: 5, max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError('Enter a valid email address.');
  return email;
}

export function requireNumber(value, field, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new ValidationError(`${field} must be a number between ${min} and ${max}.`);
  }
  return number;
}

export function requireId(value, field = 'Id') {
  return requireString(value, field, { min: 1, max: 100 });
}
