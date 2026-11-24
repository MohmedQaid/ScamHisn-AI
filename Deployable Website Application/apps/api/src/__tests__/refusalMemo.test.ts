import test from 'node:test';
import assert from 'node:assert/strict';
import { RefusalMemo } from '../ai/refusalMemo.js';

test('a refused option is skipped until its cool-down ends', () => {
  let now = 1_000;
  const memo = new RefusalMemo(60_000, () => now);

  assert.equal(memo.isRefused('key1:model', 'googleSearch'), false);
  memo.remember('key1:model', 'googleSearch');
  assert.equal(memo.isRefused('key1:model', 'googleSearch'), true);

  now += 59_000;
  assert.equal(memo.isRefused('key1:model', 'googleSearch'), true);
  now += 2_000;
  assert.equal(memo.isRefused('key1:model', 'googleSearch'), false);
});

test('a refusal is remembered per provider and per option', () => {
  const memo = new RefusalMemo(60_000, () => 0);
  memo.remember('key1:model', 'googleSearch');
  assert.equal(memo.isRefused('key2:model', 'googleSearch'), false);
  assert.equal(memo.isRefused('key1:model', 'googleSearch+googleMaps'), false);
});
