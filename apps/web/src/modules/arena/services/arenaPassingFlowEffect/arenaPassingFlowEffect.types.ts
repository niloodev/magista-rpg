import type { ArenaEnergyFlow } from "@/modules/arena/services/arenaEnergyFlow";

/** A ribbon of water and the deeper water it pours into the fluid along the same path. */
export interface IPassingWater {
  water: ArenaEnergyFlow;
  ink: ArenaEnergyFlow;
}
