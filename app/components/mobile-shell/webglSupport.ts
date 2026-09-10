export type WebGLSupport = "ok" | "fallback";

type CanvasFactory = () => HTMLCanvasElement | null;

export function detectWebGLSupport(
  createCanvas: CanvasFactory = () =>
    typeof document === "undefined" ? null : document.createElement("canvas"),
): WebGLSupport {
  try {
    const canvas = createCanvas();

    if (!canvas || typeof canvas.getContext !== "function") {
      return "fallback";
    }

    const context =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");

    return context ? "ok" : "fallback";
  } catch {
    return "fallback";
  }
}
