import test from 'node:test';
import assert from 'node:assert/strict';
import { isSameOriginRequest } from '../security/sameOrigin.js';

test('the site may always load its own files, whatever CORS_ALLOWED_ORIGINS says', () => {
  assert.equal(isSameOriginRequest('https://scamhisn-ai.onrender.com', 'scamhisn-ai.onrender.com'), true);
  assert.equal(isSameOriginRequest('http://localhost:3002', 'localhost:3002'), true);
});

test('host names are compared without regard to case', () => {
  assert.equal(isSameOriginRequest('https://ScamHisn-AI.onrender.com', 'scamhisn-ai.onrender.COM'), true);
});

test('behind a proxy the forwarded host counts as the site host', () => {
  assert.equal(isSameOriginRequest('https://app.example.com', 'srv-internal:10000', 'app.example.com'), true);
});

test('another site is not the same origin', () => {
  assert.equal(isSameOriginRequest('https://evil.example', 'scamhisn-ai.onrender.com'), false);
  assert.equal(isSameOriginRequest('http://localhost:5173', 'localhost:3002'), false);
});

test('a missing or malformed origin is never treated as same origin', () => {
  assert.equal(isSameOriginRequest(undefined, 'scamhisn-ai.onrender.com'), false);
  assert.equal(isSameOriginRequest('null', 'scamhisn-ai.onrender.com'), false);
  assert.equal(isSameOriginRequest('https://scamhisn-ai.onrender.com', undefined), false);
});
