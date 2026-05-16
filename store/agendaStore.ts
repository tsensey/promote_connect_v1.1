import { create } from "zustand";

interface AgendaState {
  eventFilter: string;
  rdvFilter: string;
  eventSearch: string;
  showNewRdv: boolean;
  upcomingRdvCount: number;
  setEventFilter: (filter: string) => void;
  setRdvFilter: (filter: string) => void;
  setEventSearch: (search: string) => void;
  setShowNewRdv: (show: boolean) => void;
  setUpcomingRdvCount: (count: number) => void;
}

export const useAgendaStore = create<AgendaState>((set) => ({
  eventFilter: "all",
  rdvFilter: "all",
  eventSearch: "",
  showNewRdv: false,
  upcomingRdvCount: 0,
  setEventFilter: (filter) => set({ eventFilter: filter }),
  setRdvFilter: (filter) => set({ rdvFilter: filter }),
  setEventSearch: (search) => set({ eventSearch: search }),
  setShowNewRdv: (show) => set({ showNewRdv: show }),
  setUpcomingRdvCount: (count) => set({ upcomingRdvCount: count }),
}));
