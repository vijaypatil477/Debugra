const { sanitizeApiKey, validateApiKey } = require('../services/groqService');

describe('groqService Security Audit', () => {
  describe('sanitizeApiKey', () => {
    it('should remove leading and trailing whitespace', () => {
      expect(sanitizeApiKey('  gsk_abc123  ')).toBe('gsk_abc123');
      expect(sanitizeApiKey('\tgsk_abc123\n')).toBe('gsk_abc123');
    });

    it('should remove invisible control characters', () => {
      expect(sanitizeApiKey('gsk_ab\x00c123')).toBe('gsk_abc123');
      expect(sanitizeApiKey('gsk_abc\x1F123')).toBe('gsk_abc123');
    });

    it('should return non-strings as is (to be caught by validation)', () => {
      expect(sanitizeApiKey(null)).toBe(null);
      expect(sanitizeApiKey(undefined)).toBe(undefined);
      expect(sanitizeApiKey(123)).toBe(123);
    });
    
    it('should successfully sanitize a valid key wrapped in whitespace', () => {
      const validKey = 'gsk_abc123DEF456ghi789jkl012mno345pqr678stu901vwx234yz';
      expect(sanitizeApiKey(`  \n\t${validKey}\r\n  `)).toBe(validKey);
    });
  });

  describe('validateApiKey', () => {
    const validKey = 'gsk_abc123DEF456ghi789jkl012mno345pqr678stu901vwx234yz';

    it('should pass for a valid API key', () => {
      expect(() => validateApiKey(validKey)).not.toThrow();
    });

    it('should throw an error for an empty API key', () => {
      expect(() => validateApiKey('')).toThrow('API key is required');
    });

    it('should throw an error for a null API key', () => {
      expect(() => validateApiKey(null)).toThrow('API key is required');
    });

    it('should throw an error for an undefined API key', () => {
      expect(() => validateApiKey(undefined)).toThrow('API key is required');
    });

    it('should throw an error for a whitespace-only API key', () => {
      expect(() => validateApiKey('   ')).toThrow('API key is required');
    });

    it('should throw an error for non-string types', () => {
      expect(() => validateApiKey(12345)).toThrow('Invalid API key format');
      expect(() => validateApiKey({})).toThrow('Invalid API key format');
    });

    it('should throw an error for overly long key', () => {
      const longKey = 'gsk_' + 'a'.repeat(100);
      expect(() => validateApiKey(longKey)).toThrow('Invalid API key format');
    });

    it('should throw an error for an overly short key', () => {
      const shortKey = 'gsk_a';
      expect(() => validateApiKey(shortKey)).toThrow('Invalid API key format');
    });

    it('should throw an error for invalid characters', () => {
      const invalidCharsKey = 'gsk_abc123!@#$DEF456ghi789';
      expect(() => validateApiKey(invalidCharsKey)).toThrow('API key contains unsupported characters');
      const spaceKey = 'gsk_abc 123DEF456ghi789jkl';
      expect(() => validateApiKey(spaceKey)).toThrow('API key contains unsupported characters');
    });
  });

  describe('getGroqClient', () => {
    const { getGroqClient } = require('../services/groqService');
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should throw 400 if client key is provided but invalid', () => {
      expect(() => getGroqClient('invalid_key')).toThrow('Invalid API key format');
      try {
        getGroqClient('invalid_key');
      } catch (err) {
        expect(err.status).toBe(400);
      }
    });

    it('should throw 500 with custom message if no client key is provided and server key is missing', () => {
      delete process.env.GROQ_API_KEY;
      expect(() => getGroqClient('')).toThrow('Server misconfiguration: Groq API key is missing or invalid in environment variables.');
      try {
        getGroqClient('');
      } catch (err) {
        expect(err.status).toBe(500);
      }
    });
  });
});
