export interface AssetLoadingScreenProps {
  /** 0 to 1. */
  progress: number;
  /** Short title over the bar ("Preparando a mesa"). */
  title: string;
  /** What is loading and how much ("Mapa Mundi · 1,2 MB de 2,9 MB"). */
  detail: string;
  /** Accessible name of the progress bar. */
  label: string;
  /** Version of the app, small under the detail ("v0.1.0"). */
  version?: string;
  /** Fading out (the assets are in). */
  closing: boolean;
  className?: string;
}
