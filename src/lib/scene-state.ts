/**
 * Mutable state shared between the DOM and the WebGL scenes.
 * Read inside useFrame — deliberately not React state, so scrolling and
 * pointer movement never trigger re-renders.
 */
export const sceneState = {
  /** hero scroll progress, 0 → 1 */
  scroll: 0,
  /** where the day/night switch is heading (0 = sunset, 1 = night) */
  nightTarget: 0,
  /** eased value that follows nightTarget */
  night: 0,
  /** pointer, normalised to −1 … 1 (y is up) */
  px: 0,
  py: 0,
};
