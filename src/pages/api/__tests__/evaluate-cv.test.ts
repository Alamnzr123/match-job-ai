import { createMocks } from 'node-mocks-http';
import handler from '../evaluate-cv';
import type { NextApiRequest, NextApiResponse } from 'next';
import { CvEvaluationRequest } from '@/types';

jest.mock('@pinecone-database/pinecone', () => ({
  Pinecone: jest.fn().mockImplementation(() => ({
    Index: jest.fn().mockReturnValue({
      fetch: jest.fn().mockImplementation(async (ids: string[]) => ({
        records: {
          [ids[0]]: { metadata: { text: 'Sample CV text' } }
        }
      }))
    })
  }))
}));

jest.mock('@/utils/aiEvaluator', () => ({
  evaluateCV: jest.fn().mockResolvedValue({
    matchRate: 0.9,
    cv_feedback: 'Great fit',
    overall_summary: 'Excellent candidate'
  })
}));

describe('POST /api/evaluate-cv', () => {
  beforeEach(() => {
    global.evaluationStore = {};
    globalThis.evaluationStore = global.evaluationStore;
  });

  it('returns 405 for non-POST method', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET'
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Method not allowed');
  });

  it('returns 400 if vectorId or jobDescription missing', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {}
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('vectorId and jobDescription are required');
  });

  it('returns 404 if CV text not found in Pinecone', async () => {
    // Mock Pinecone to return no text
    jest.spyOn(require('@pinecone-database/pinecone').Pinecone.prototype, 'Index').mockReturnValue({
      fetch: async () => ({ records: { 'no-text-id': { metadata: {} } } })
    });

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        vectorId: 'no-text-id',
        jobDescription: { title: 'Backend', requirements: [], description: '' }
      } as CvEvaluationRequest
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(404);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('CV text not found in Pinecone.');
  });

  it('returns 500 if Pinecone fetch throws error', async () => {
    jest.spyOn(require('@pinecone-database/pinecone').Pinecone.prototype, 'Index').mockReturnValue({
      fetch: async () => { throw new Error('Fetch error'); }
    });

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        vectorId: 'error-id',
        jobDescription: { title: 'Backend', requirements: [], description: '' }
      } as CvEvaluationRequest
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Error fetching CV from Pinecone.');
  });

  it('returns processing status immediately for valid request', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        vectorId: 'valid-id',
        jobDescription: { title: 'Backend', requirements: [], description: '' }
      } as CvEvaluationRequest
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.evaluationId).toBe('valid-id');
    expect(data.status).toBe('processing');
  });
});