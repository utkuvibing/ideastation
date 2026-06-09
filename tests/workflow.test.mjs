import assert from 'node:assert/strict';
import test from 'node:test';

const transitions = {
  draft: ['needs_feedback', 'archived'],
  needs_feedback: ['approved', 'rejected', 'draft'],
  approved: ['needs_script', 'ready_to_shoot', 'needs_feedback'],
  editing: ['published', 'shot'],
};

function similarity(left, right) {
  const tokens = (value) => value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((token) => token.length > 2);
  const a = new Set(tokens(left)); const b = new Set(tokens(right));
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / new Set([...a, ...b]).size;
}

test('approval workflow allows review decisions but blocks skipping production', () => {
  assert.equal(transitions.needs_feedback.includes('approved'), true);
  assert.equal(transitions.needs_feedback.includes('rejected'), true);
  assert.equal(transitions.draft.includes('published'), false);
  assert.equal(transitions.editing.includes('published'), true);
});

test('similarity ranks repeated creative concepts higher', () => {
  const close = similarity('Fast morning routine app demo hook', 'Morning routine app demo with a fast hook');
  const distant = similarity('Fast morning routine app demo hook', 'Finance calculator testimonial');
  assert.ok(close > 0.5);
  assert.ok(close > distant);
});
