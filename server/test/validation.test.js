import test from 'node:test';
import assert from 'node:assert/strict';
import { ValidationError, requireEmail, requireNumber, requireString } from '../src/lib/validation.js';

test('normalizes valid email addresses', () => {
  assert.equal(requireEmail('  PERSON@example.com '), 'person@example.com');
});

test('rejects invalid input', () => {
  assert.throws(() => requireEmail('invalid'), ValidationError);
  assert.throws(() => requireString('', 'Name'), ValidationError);
  assert.throws(() => requireNumber(-1, 'Price', { min: 0 }), ValidationError);
});
