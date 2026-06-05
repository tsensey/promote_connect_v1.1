import { describe, it, expect, beforeEach } from 'vitest';
import { useAgendaStore } from '@/store/agendaStore';

describe('useAgendaStore', () => {
  beforeEach(() => {
    const store = useAgendaStore.getState();
    store.setEventFilter('all');
    store.setRdvFilter('all');
    store.setEventSearch('');
    store.setShowNewRdv(false);
    store.setUpcomingRdvCount(0);
  });

  it('initializes with default values', () => {
    const state = useAgendaStore.getState();
    expect(state.eventFilter).toBe('all');
    expect(state.rdvFilter).toBe('all');
    expect(state.eventSearch).toBe('');
    expect(state.showNewRdv).toBe(false);
    expect(state.upcomingRdvCount).toBe(0);
  });

  it('sets event filter', () => {
    useAgendaStore.getState().setEventFilter('conference');
    expect(useAgendaStore.getState().eventFilter).toBe('conference');
  });

  it('sets rdv filter', () => {
    useAgendaStore.getState().setRdvFilter('confirmed');
    expect(useAgendaStore.getState().rdvFilter).toBe('confirmed');
  });

  it('sets event search', () => {
    useAgendaStore.getState().setEventSearch('test search');
    expect(useAgendaStore.getState().eventSearch).toBe('test search');
  });

  it('sets showNewRdv', () => {
    useAgendaStore.getState().setShowNewRdv(true);
    expect(useAgendaStore.getState().showNewRdv).toBe(true);
  });

  it('sets upcoming rdv count', () => {
    useAgendaStore.getState().setUpcomingRdvCount(5);
    expect(useAgendaStore.getState().upcomingRdvCount).toBe(5);
  });

  it('resets event filter to all', () => {
    useAgendaStore.getState().setEventFilter('networking');
    useAgendaStore.getState().setEventFilter('all');
    expect(useAgendaStore.getState().eventFilter).toBe('all');
  });
});
