// Vibración háptica corta para acciones clave (toque premium). No falla nunca.
export function haptic(patron = 15) {
  try { navigator.vibrate?.(patron); } catch { /* sin soporte */ }
}
export const tapLigero = () => haptic(12);
export const tapFuerte = () => haptic([20, 30, 20]);
export const tapExito = () => haptic([10, 40, 10]);
