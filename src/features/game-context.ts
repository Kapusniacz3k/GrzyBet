import { createContext, useContext } from 'react';
import type { Room, Ticket, Harvest, QuestionKey } from './domain';

export type Game = {
  rooms: Room[];
  userId: string;
  displayName: string;
  mode: 'local' | 'online';
  busy: boolean;
  setDisplayName?: (name: string) => Promise<void>;
  create: (data: Pick<Room, 'name' | 'date' | 'limit'>) => Promise<string>;
  join: (code: string) => Promise<string>;
  save: (id: string, ticket: Ticket) => Promise<void>;
  answer: (id: string, key: QuestionKey, value: string | number) => Promise<void>;
  restart: (id: string) => Promise<void>;
  begin: (id: string) => Promise<void>;
  start: (id: string) => Promise<void>;
  finish: (id: string) => Promise<void>;
  addHarvest: (id: string, data: Pick<Harvest, 'species' | 'count' | 'photoUri' | 'note'>, onProgress?: (percent: number) => void) => Promise<void>;
  review: (id: string, harvestId: string, decision: 'approved' | 'rejected', reason?: string) => Promise<void>;
};
export const GameContext = createContext<Game | null>(null);
export function useGame() {
  const game = useContext(GameContext);
  if (!game) throw new Error('Brak GameProvider');
  return game;
}
