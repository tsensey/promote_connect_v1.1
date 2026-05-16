import { describe, it, expect } from 'vitest';
import { getInitials, isSameDay, getMessagePreview } from '@/lib/chat/utils';

describe('getInitials', () => {
  it('returns initials from full name', () => {
    expect(getInitials('Jean Dupont')).toBe('JD');
  });

  it('returns single initial for one name', () => {
    expect(getInitials('Jean')).toBe('J');
  });

  it('returns uppercase initials', () => {
    expect(getInitials('jean dupont')).toBe('JD');
  });

  it('returns ? for null', () => {
    expect(getInitials(null)).toBe('?');
  });

  it('returns ? for undefined', () => {
    expect(getInitials(undefined)).toBe('?');
  });
});

describe('isSameDay', () => {
  it('returns true for same day', () => {
    const d1 = '2026-05-16T10:00:00Z';
    const d2 = '2026-05-16T22:00:00Z';
    expect(isSameDay(d1, d2)).toBe(true);
  });

  it('returns false for different days', () => {
    const d1 = '2026-05-16T10:00:00Z';
    const d2 = '2026-05-17T10:00:00Z';
    expect(isSameDay(d1, d2)).toBe(false);
  });
});

describe('getMessagePreview', () => {
  it('returns content for text message', () => {
    expect(getMessagePreview({ content: 'Hello', attachment_type: null, product_attachment: null })).toBe('Hello');
  });

  it('returns 📷 Photo for image attachment', () => {
    expect(getMessagePreview({ content: '', attachment_type: 'image', product_attachment: null })).toBe('📷 Photo');
  });

  it('returns 📄 Document for document attachment', () => {
    expect(getMessagePreview({ content: '', attachment_type: 'document', product_attachment: null })).toBe('📄 Document');
  });

  it('returns empty string for null message', () => {
    expect(getMessagePreview(null)).toBe('');
  });
});
