import assert from 'node:assert/strict';
import test from 'node:test';

const emailPattern = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g;
const sensitivePattern = /(?:\b\d{3}-?\d{2}-?\d{4}\b)|(?:\b(?:\d[ -]*?){13,16}\b)|(?:api[_-]?key|secret|password)\s*[:=]/i;

test('extracts unique normalized mentions', () => {
  const text = 'Ask USER@Example.com and user@example.com, then editor@example.com';
  const mentions = Array.from(new Set(text.match(emailPattern)?.map((email) => email.toLowerCase()) || []));
  assert.deepEqual(mentions, ['user@example.com', 'editor@example.com']);
});

test('detects secrets and card-like values', () => {
  assert.equal(sensitivePattern.test('api_key=abc123'), true);
  assert.equal(sensitivePattern.test('4111 1111 1111 1111'), true);
  assert.equal(sensitivePattern.test('ordinary creative brief'), false);
});
