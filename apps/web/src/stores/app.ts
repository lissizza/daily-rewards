import { create } from 'zustand';
import { formatDateShort } from '@/lib/utils';

interface AppState {
  selectedDate: string;
  selectedChildId: string | null;
  setSelectedDate: (date: string) => void;
  setSelectedChildId: (id: string | null) => void;
  goToNextDay: () => void;
  goToPrevDay: () => void;
  goToToday: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedDate: formatDateShort(new Date()),
  selectedChildId: null,

  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedChildId: (id) => set({ selectedChildId: id }),

  goToNextDay: () => {
    const current = new Date(get().selectedDate);
    current.setDate(current.getDate() + 1);
    set({ selectedDate: formatDateShort(current) });
  },

  goToPrevDay: () => {
    const current = new Date(get().selectedDate);
    current.setDate(current.getDate() - 1);
    set({ selectedDate: formatDateShort(current) });
  },

  goToToday: () => {
    set({ selectedDate: formatDateShort(new Date()) });
  },
}));
