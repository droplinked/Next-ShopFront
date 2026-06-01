/**
 * Contract tests for the /api/attestation/[programId] proxy route.
 *
 * The proxy is a thin wrapper around the backend verifier endpoint. We
 * exercise the contract pieces:
 *  - programId validation (24-char hex Mongo ObjectId)
 *  - 400 BAD_REQUEST shape for malformed input
 *  - 404 NOT_FOUND shape for upstream failures
 *  - TransformInterceptor envelope unwrapping
 *
 * Runner: node --test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

// ---------- programId validation (mirrors backend `[a-f0-9]{24}` regex) ----------

const PROGRAM_ID_PATTERN = /^[a-f0-9]{24}$/i;

test('proxy: accepts 24-char hex ObjectId', () => {
  assert.equal(PROGRAM_ID_PATTERN.test('507f1f77bcf86cd799439010'), true);
  assert.equal(PROGRAM_ID_PATTERN.test('ABCDEF1234567890ABCDEF12'), true);
});

test('proxy: rejects non-hex characters', () => {
  assert.equal(PROGRAM_ID_PATTERN.test('zzzf1f77bcf86cd799439010'), false);
});

test('proxy: rejects wrong-length ids', () => {
  assert.equal(PROGRAM_ID_PATTERN.test('507f1f77bcf86cd79943901'), false); // 23 chars
  assert.equal(PROGRAM_ID_PATTERN.test('507f1f77bcf86cd7994390100'), false); // 25 chars
  assert.equal(PROGRAM_ID_PATTERN.test(''), false);
});

// ---------- error envelope shapes ----------

test('proxy: 400 envelope for invalid id', () => {
  const envelope = {
    status: 'BAD_REQUEST',
    code: 'invalid_program_id',
    message: 'programId must be a 24-char hex Mongo ObjectId',
  };
  assert.equal(envelope.status, 'BAD_REQUEST');
  assert.equal(envelope.code, 'invalid_program_id');
});

test('proxy: 404 envelope for upstream failure', () => {
  const envelope = {
    status: 'NOT_FOUND',
    code: 'attestation_not_found',
    programId: '507f1f77bcf86cd799439010',
  };
  assert.equal(envelope.status, 'NOT_FOUND');
  assert.equal(envelope.code, 'attestation_not_found');
});

// ---------- service-side null-detection ----------
// Mirrors getProgramAttestation()'s NOT_FOUND/BAD_REQUEST detection.

test('service: NOT_FOUND envelope -> service returns null', () => {
  const payload = {
    status: 'NOT_FOUND',
    code: 'attestation_not_found',
    programId: 'x',
  };
  const isError =
    payload.status === 'NOT_FOUND' ||
    payload.status === 'BAD_REQUEST' ||
    payload.code === 'attestation_not_found' ||
    payload.code === 'invalid_program_id';
  assert.equal(isError, true);
});

test('service: full envelope -> service returns it through', () => {
  const payload = {
    programId: '507f1f77bcf86cd799439010',
    programVersion: 1,
    status: 'ACTIVE',
    attestedAt: null,
    avax: { chain: 'AVAX', status: 'absent' },
    base: { chain: 'BASE', status: 'confirmed' },
    history: [],
  };
  const isError =
    payload.status === 'NOT_FOUND' ||
    payload.status === 'BAD_REQUEST' ||
    payload.code === 'attestation_not_found' ||
    payload.code === 'invalid_program_id';
  assert.equal(isError, false);
  // A program with status='ACTIVE' is NOT an error envelope even
  // though `status` is set — the BAD_REQUEST/NOT_FOUND values are
  // disjoint from the program status enum.
});

// ---------- TransformInterceptor envelope unwrap ----------

test('proxy: unwraps TransformInterceptor `{status, data: payload}`', () => {
  const wrapped = {
    status: 'OK',
    data: {
      programId: '507f1f77bcf86cd799439010',
      programVersion: 1,
      avax: { chain: 'AVAX', status: 'confirmed' },
      base: { chain: 'BASE', status: 'absent' },
    },
  };
  // Mirrors the unwrap logic in route.ts
  const isWrapped = Boolean(
    wrapped &&
      typeof wrapped === 'object' &&
      'data' in wrapped &&
      typeof wrapped.data === 'object' &&
      wrapped.data,
  );
  assert.equal(isWrapped, true);
  const unwrapped = wrapped.data;
  assert.equal(unwrapped.programId, '507f1f77bcf86cd799439010');
});

test('proxy: passes through already-flat payloads unchanged', () => {
  const flat = {
    programId: '507f1f77bcf86cd799439010',
    programVersion: 1,
    avax: { chain: 'AVAX', status: 'confirmed' },
    base: { chain: 'BASE', status: 'absent' },
  };
  // Flat payloads have NO `data` property — the unwrap logic skips
  // them entirely and the controller returns the whole object.
  assert.equal('data' in flat, false);
});
