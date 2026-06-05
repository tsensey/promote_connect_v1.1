import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateShort,
  formatDateFull,
  formatTime,
  parseSpeakers,
  getEventTypeConfig,
  EVENT_TYPES,
  STATUS_STYLES,
  STATUS_DOTS,
} from '@/lib/agenda/utils';

describe('parseSpeakers', () => {
  it('returns empty array for null', () => {
    expect(parseSpeakers(null)).toEqual([]);
  });

  it('returns empty array for undefined', () => {
    expect(parseSpeakers(undefined)).toEqual([]);
  });

  it('returns array as-is when already an array', () => {
    const speakers = [{ name: 'John Doe', title: 'CEO' }];
    expect(parseSpeakers(speakers)).toEqual(speakers);
  });

  it('parses JSON string', () => {
    const json = '[{"name":"Jane","title":"CTO"}]';
    expect(parseSpeakers(json)).toEqual([{ name: 'Jane', title: 'CTO' }]);
  });

  it('returns empty array for invalid JSON string', () => {
    expect(parseSpeakers('invalid-json')).toEqual([]);
  });
});

describe('getEventTypeConfig', () => {
  const t = (key: string) => {
    const map: Record<string, string> = {
      'agenda.event_conference': 'Conférence',
      'agenda.event_atelier': 'Atelier',
      'agenda.event_networking': 'Networking',
      'agenda.event_keynote': 'Keynote',
      'agenda.event_panel': 'Panel',
    };
    return map[key] ?? key;
  };

  it('returns null for unknown type', () => {
    expect(getEventTypeConfig('unknown', t)).toBeNull();
  });

  it('returns null for null type', () => {
    expect(getEventTypeConfig(null, t)).toBeNull();
  });

  it('returns config for conference', () => {
    const config = getEventTypeConfig('conference', t);
    expect(config?.label).toBe('Conférence');
    expect(config?.icon).toBe('Mic');
    expect(config?.gradient).toContain('blue');
  });

  it('returns config for atelier', () => {
    const config = getEventTypeConfig('atelier', t);
    expect(config?.label).toBe('Atelier');
    expect(config?.icon).toBe('Wrench');
  });
});

describe('EVENT_TYPES', () => {
  it('contains all expected event types', () => {
    expect(EVENT_TYPES).toEqual(['conference', 'atelier', 'networking', 'keynote', 'panel']);
  });
});

describe('STATUS_STYLES', () => {
  it('has all required status styles', () => {
    expect(STATUS_STYLES).toHaveProperty('pending');
    expect(STATUS_STYLES).toHaveProperty('confirmed');
    expect(STATUS_STYLES).toHaveProperty('cancelled');
  });
});

describe('STATUS_DOTS', () => {
  it('has all required status dot colors', () => {
    expect(STATUS_DOTS).toHaveProperty('pending', 'bg-amber-500');
    expect(STATUS_DOTS).toHaveProperty('confirmed', 'bg-emerald-500');
    expect(STATUS_DOTS).toHaveProperty('cancelled', 'bg-red-500');
  });
});

describe('formatDate', () => {
  it('returns day, month, weekday, timeStart, timeEnd', () => {
    const result = formatDate('2026-06-15T10:00:00Z', 'fr');
    expect(result).toHaveProperty('day');
    expect(result).toHaveProperty('month');
    expect(result).toHaveProperty('weekday');
    expect(result).toHaveProperty('timeStart');
    expect(result).toHaveProperty('timeEnd');
  });

  it('formats in French locale', () => {
    const result = formatDate('2026-06-15T10:00:00Z', 'fr');
    expect(result.month).toBeDefined();
  });

  it('formats in English locale', () => {
    const result = formatDate('2026-06-15T10:00:00Z', 'en');
    expect(result.month).toBeDefined();
  });
});

describe('formatDateShort', () => {
  it('returns short date string', () => {
    const result = formatDateShort('2026-06-15T10:00:00Z', 'fr');
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
});

describe('formatDateFull', () => {
  it('returns full date string', () => {
    const result = formatDateFull('2026-06-15T10:00:00Z', 'fr');
    expect(result).toContain('2026');
  });
});

describe('formatTime', () => {
  it('returns time string with hours and minutes', () => {
    const result = formatTime('2026-06-15T10:30:00Z', 'fr');
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });
});
