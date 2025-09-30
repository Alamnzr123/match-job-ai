import { createMocks } from 'node-mocks-http';
import handler from '../upload-cv';
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';

jest.mock('fs');
jest.mock('formidable', () => {
  const actual = jest.requireActual('formidable');
  return {
    ...actual,
    default: jest.fn().mockImplementation(() => ({
      parse: jest.fn((req, cb) => {
        cb(null, {}, { cv: { filepath: 'test.pdf', mimetype: 'application/pdf' } });
      }),
    })),
  };
});
jest.mock('pdf-parse', () => jest.fn().mockResolvedValue({ text: 'Sample PDF text' }));
jest.mock('uuid', () => ({ v4: () => 'test-vector-id' }));
jest.mock('child_process', () => ({
  execSync: jest.fn(() => JSON.stringify([0.1, 0.2, 0.3])),
}));
jest.mock('@pinecone-database/pinecone', () => ({
  Pinecone: jest.fn().mockImplementation(() => ({
    Index: jest.fn().mockReturnValue({
      upsert: jest.fn().mockResolvedValue(undefined),
    }),
  })),
}));

describe('POST /api/upload-cv', () => {
  beforeEach(() => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('PDF file content'));
    process.env.PINECONE_API_KEY = 'fake-key';
    process.env.PINECONE_INDEX = 'fake-index';
  });

  it('returns 405 for non-POST method', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(res._getData()).toContain('Method GET Not Allowed');
  });

  it('returns 400 if no CV file uploaded', async () => {
    // Mock formidable to return no file
    jest.requireMock('formidable').default.mockImplementation(() => ({
      parse: jest.fn((req, cb) => cb(null, {}, {})),
    }));

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('No CV file uploaded.');
  });

  it('returns 400 if extracted text is empty', async () => {
    jest.requireMock('pdf-parse').mockResolvedValue({ text: '' });

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Extracted text is empty.');
  });

  it('returns 500 if embedding format invalid', async () => {
    jest.requireMock('child_process').execSync.mockImplementation(() => JSON.stringify(['not', 'numbers']));

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Embedding format invalid.');
  });

  it('returns 500 if error generating embedding', async () => {
    jest.requireMock('child_process').execSync.mockImplementation(() => { throw new Error('Embed error'); });

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Error generating embedding.');
  });

  it('returns 500 if error saving to Pinecone', async () => {
    jest.requireMock('@pinecone-database/pinecone').Pinecone.prototype.Index.mockReturnValue({
      upsert: jest.fn().mockRejectedValue(new Error('Pinecone error')),
    });

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Error saving to Pinecone.');
  });

  it('returns 200 and vectorId for successful upload', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.message).toBe('CV uploaded and indexed.');
    expect(data.vectorId).toBe('test-vector-id');
  });
});