import racesData from "../data/races.json";
import type { Race } from "./types";

export function getRaces(): Race[] {
  return racesData as Race[];
}