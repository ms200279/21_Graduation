import * as THREE from "three";

import type { CreditFragmentId } from "./creditData";

const CREDIT_FRAGMENT_TEXTURE_PATHS: Record<CreditFragmentId, string> = {
  "01": "/images/cti1.png",
  "02": "/images/cti2.png",
  "03": "/images/cti3.png",
  "04": "/images/cti4.png",
  "05": "/images/cti5.png",
};

export function createLiquidSurfaceTexture() {
  const size = 64;
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = x / size;
      const ny = y / size;
      const wave =
        Math.sin(nx * Math.PI * 4 + Math.sin(ny * Math.PI * 2) * 0.8) * 30 +
        Math.cos(ny * Math.PI * 6 - nx * Math.PI * 2) * 20 +
        Math.sin((nx + ny) * Math.PI * 4) * 10;
      const value = THREE.MathUtils.clamp(Math.round(128 + wave), 0, 255);
      const offset = (y * size + x) * 4;

      data[offset] = value;
      data[offset + 1] = value;
      data[offset + 2] = value;
      data[offset + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.35, 0.85);
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;

  return texture;
}

export function createLiquidBackdropTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");

  if (!context) {
    return new THREE.Texture();
  }

  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#f7fafc");
  gradient.addColorStop(0.48, "#e7eef5");
  gradient.addColorStop(1, "#f3f7fa");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const glow = context.createRadialGradient(168, 156, 0, 168, 156, 280);
  glow.addColorStop(0, "rgba(32, 60, 96, 0.18)");
  glow.addColorStop(1, "rgba(32, 60, 96, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
}

export function loadCreditFragmentTextures(
  renderer: THREE.WebGLRenderer,
  fragmentIds: readonly CreditFragmentId[],
) {
  const loader = new THREE.TextureLoader();
  const textures = {} as Record<CreditFragmentId, THREE.Texture>;

  fragmentIds.forEach((id) => {
    const texture = loader.load(CREDIT_FRAGMENT_TEXTURE_PATHS[id]);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    textures[id] = texture;
  });

  return textures;
}

export function disposeCreditFragmentTextures(
  textures: Record<CreditFragmentId, THREE.Texture>,
) {
  Object.values(textures).forEach((texture) => texture.dispose());
}
