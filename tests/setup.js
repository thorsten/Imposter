import "@testing-library/jest-dom/vitest";

// jsdom kennt PointerEvent nicht. Der Halten-Screen haengt genau daran, also
// wird hier das Minimum nachgereicht, das user-event braucht.
if (typeof window.PointerEvent === "undefined") {
  class PointerEvent extends MouseEvent {
    constructor(type, props = {}) {
      super(type, props);
      this.pointerId = props.pointerId ?? 1;
      this.pointerType = props.pointerType ?? "mouse";
      this.isPrimary = props.isPrimary ?? true;
    }
  }
  window.PointerEvent = PointerEvent;
}

for (const fn of ["setPointerCapture", "releasePointerCapture", "hasPointerCapture"]) {
  if (!Element.prototype[fn]) Element.prototype[fn] = () => {};
}
