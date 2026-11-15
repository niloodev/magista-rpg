import type { IWindowSize } from "./FloatingWindow.types";

export const WINDOW_MIN_SIZE: IWindowSize = { width: 380, height: 420 };

/** Keyboard step (Alt+arrows move, Alt+Shift+arrows resize), in pixels. */
export const WINDOW_KEY_STEP = 24;

export const WINDOW_KEYS_HINT =
  "Arraste a barra de título para mover e o canto inferior direito para redimensionar. Pelo teclado: Alt e as setas movem, Alt, Shift e as setas redimensionam.";
