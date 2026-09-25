import { describe, it, expect } from 'vitest';
import { validateSuggestion } from '../app/suggestions';

describe('validateSuggestion', () => {
  it('should accept valid inputs with email', () => {
    const input = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'This is a great suggestion that meets length requirements.',
    };
    const result = validateSuggestion(input);
    expect(result.error).toBeUndefined();
    expect(result.name).toBe('John Doe');
    expect(result.email).toBe('john@example.com');
    expect(result.message).toBe('This is a great suggestion that meets length requirements.');
  });

  it('should accept valid inputs without email', () => {
    const input = {
      name: 'Jane Doe',
      email: '',
      message: 'This is another great suggestion that meets length requirements.',
    };
    const result = validateSuggestion(input);
    expect(result.error).toBeUndefined();
    expect(result.name).toBe('Jane Doe');
    expect(result.email).toBeNull(); // Empty string gets converted to null or skipped
    expect(result.message).toBe('This is another great suggestion that meets length requirements.');
  });

  it('should accept valid inputs without name', () => {
    const input = {
      name: '',
      email: 'anonymous@example.com',
      message: 'This is another great suggestion that meets length requirements.',
    };
    const result = validateSuggestion(input);
    expect(result.error).toBeUndefined();
    expect(result.name).toBeNull();
    expect(result.email).toBe('anonymous@example.com');
    expect(result.message).toBe('This is another great suggestion that meets length requirements.');
  });

  it('should reject if message is missing', () => {
    const input = {
      name: 'John',
      email: 'john@example.com',
      message: '',
    };
    const result = validateSuggestion(input);
    expect(result.error).toBe('Suggestion is required.');
  });

  it('should reject if message is too short', () => {
    const input = {
      name: 'John',
      email: 'john@example.com',
      message: 'Too short',
    };
    const result = validateSuggestion(input);
    expect(result.error).toBe('Suggestion must be at least 10 characters.');
  });

  it('should reject if name contains a URL', () => {
    const input = {
      name: 'John https://example.com',
      email: 'john@example.com',
      message: 'This is a great suggestion that meets length requirements.',
    };
    const result = validateSuggestion(input);
    expect(result.error).toBe('Name cannot include links.');
  });

  it('should reject if message contains a URL', () => {
    const input = {
      name: 'John',
      email: 'john@example.com',
      message: 'This is a great suggestion that meets length requirements. Visit https://example.com',
    };
    const result = validateSuggestion(input);
    expect(result.error).toBe('Suggestion cannot include links.');
  });

  it('should reject if email is invalid format', () => {
    const input = {
      name: 'John',
      email: 'not-an-email',
      message: 'This is a great suggestion that meets length requirements.',
    };
    const result = validateSuggestion(input);
    expect(result.error).toBe('Enter a valid email address or leave it blank.');
  });

  it('should reject if email has header injection', () => {
    const input = {
      name: 'John',
      email: 'john@example.com\r\nBcc: evil@example.com',
      message: 'This is a great suggestion that meets length requirements.',
    };
    const result = validateSuggestion(input);
    expect(result.error).toBe('Enter a valid email address or leave it blank.');
  });
});
