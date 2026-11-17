import type { ArenaEnergyFlow } from "@/modules/arena/services/arenaEnergyFlow";
import type { ArenaEnergyFluid } from "@/modules/arena/services/arenaEnergyFluid";

/** The weapon the attacker carries in its lunge. */
export type ArenaWeapon = "shovel" | "axe";

/** The fire of the voodoo axe: the fluid its edge pours into, its burning edge and the ribbon of its swing. */
export interface IWeaponFire {
  fluid: ArenaEnergyFluid;
  edge: ArenaEnergyFlow;
  /** Red fire burning on the head of the axe, mixing with the green of its edge. */
  embers: ArenaEnergyFlow;
  swing: ArenaEnergyFlow;
}
