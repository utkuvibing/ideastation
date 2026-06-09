import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lib/brainstorm-prompt.ts', import.meta.url), 'utf8');

test('defines a dedicated template for every brainstorm action', () => {
  const actions = [
    'Generate 10 Short-Form Ideas',
    'Generate UGC Ad Ideas',
    'Generate Viral Hooks',
    'Generate Problem/Solution Ads',
    'Generate App Demo Ideas',
    'Generate Meme Concepts',
    'Generate Trend Adaptations',
    'Generate Competitor-Inspired Concepts',
    'Generate Low-Budget Video Ideas',
    'Improve App Brief',
    'Custom Brainstorm',
  ];
  for (const action of actions) assert.match(source, new RegExp(`'${action.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`));
});

test('brief improvement does not request video ideas', () => {
  assert.match(source, /Improve App Brief[\s\S]*Video fikri uretme/);
});

test('prompt contains output and hallucination guardrails', () => {
  assert.match(source, /Dusunme sureci, plan, tool kullanimi/);
  assert.match(source, /olmayan ozellik, entegrasyon, fiyat/);
  assert.match(source, /JSON, YAML/);
});
