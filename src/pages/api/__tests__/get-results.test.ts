import { createMocks } from 'node-mocks-http';
import handler from '../get-results';
import type { NextApiRequest, NextApiResponse } from 'next';
import { CvEvaluationResponse } from '@/types';

declare global {
  var evaluationStore:  Record<string, CvEvaluationResponse> | undefined;
}

describe('GET /api/get-results', () => {
  beforeEach(() => {
    global.evaluationStore = {};
    globalThis.evaluationStore = global.evaluationStore;
  });

  it('returns 400 if id is missing', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: {},
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Evaluation ID is required');
  });

  it('returns 404 if evaluation not found', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { id: 'notfound' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(404);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Evaluation not found.');
  });

  it('returns processing status', async () => {
    globalThis.evaluationStore!['abc'] = {
      evaluationId: 'abc',
      status: 'processing',
      result: undefined
    };
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { id: 'abc' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.status).toBe('processing');
  });

  it('returns completed evaluation', async () => {
    global.evaluationStore!['xyz'] = { evaluationId: 'xyz', status: 'completed', result: { matchRate: 0.9, evaluationId: "222", cv_feedback: "Great", project_score: 0.8, project_feedback: "Great", overall_summary: "match with job", status: "completed" } };
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { id: 'xyz' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.status).toBe('completed');
    expect(data.result.matchRate).toBe(0.9);
  });

  it('returns 405 for non-GET method', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      query: { id: 'abc' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Method not allowed');
  });
});