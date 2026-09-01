"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";

import "@/app/styles/credits-scene.css";
import { SITE_PATHS } from "@/app/utils/routes";
import CreditContentOverlay from "./CreditContentOverlay";
import {
  CREDIT_FRAGMENT_POLYGONS,
  CREDIT_GEOMETRY_MAP,
  creditFragments,
  getCreditFragmentById,
  type CreditFragmentData,
  type CreditFragmentId,
  type FragmentPoint,
} from "./creditData";
import {
  getOffscreenFragmentPosition,
  getPolygonBounds,
  getPolygonCentroid,
  getSelectedFragmentPosition,
  isPointInsidePolygon,
  scoreLabelPosition,
  type CreditLabelCorner,
} from "./creditSceneMath";
import {
  createLiquidBackdropTexture,
  createLiquidSurfaceTexture,
  disposeCreditFragmentTextures,
  loadCreditFragmentTextures,
} from "./creditSceneResources";
import { createCreditFragmentGeometry } from "./creditSceneGeometry";
import { createCreditFragmentMaterial } from "./creditSceneMaterial";
import {
  createCreditSceneBase,
  disposeCreditSceneBase,
} from "./creditSceneSetup";

type ScenePhase = "IDLE" | "SELECTING" | "SELECTED" | "CLOSING";
type FragmentRuntime = ReturnType<typeof createFragment>;
type CreditSceneProps = {
  initialFragmentId?: CreditFragmentId | null;
};

const MOBILE_MEDIA_QUERY = "(max-width: 767px)";
const SCENE_TRANSITION_DURATION_MS = 920;
const ASSEMBLED_POSITION = new THREE.Vector3(0, 0, 0);
const SEAM = 0.085;
const SIDE_FRAGMENT_SEAM_OFFSET = 0.075;
const PANEL_BASE_ROTATION = new THREE.Euler(
  THREE.MathUtils.degToRad(-1.2),
  THREE.MathUtils.degToRad(0.8),
  0,
);

function findLabelPosition(
  polygon: readonly FragmentPoint[],
  width: number,
  height: number,
  fallbackX: number,
  fallbackY: number,
  corner: CreditLabelCorner,
) {
  const bounds = getPolygonBounds(polygon);
  const padding = 0.13;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const minX = bounds.minX + halfWidth + padding;
  const maxX = bounds.maxX - halfWidth - padding;
  const minY = bounds.minY + halfHeight + padding;
  const maxY = bounds.maxY - halfHeight - padding;
  const steps = 36;
  let bestPosition: THREE.Vector2 | null = null;
  let bestScore = -Infinity;

  for (let yIndex = 0; yIndex <= steps; yIndex += 1) {
    const y = THREE.MathUtils.lerp(minY, maxY, yIndex / steps);

    for (let xIndex = 0; xIndex <= steps; xIndex += 1) {
      const x = THREE.MathUtils.lerp(minX, maxX, xIndex / steps);
      const samplePoints = [
        [x - halfWidth, y - halfHeight],
        [x, y - halfHeight],
        [x + halfWidth, y - halfHeight],
        [x - halfWidth, y],
        [x, y],
        [x + halfWidth, y],
        [x - halfWidth, y + halfHeight],
        [x, y + halfHeight],
        [x + halfWidth, y + halfHeight],
      ] as const;

      if (!samplePoints.every(([sampleX, sampleY]) =>
        isPointInsidePolygon(sampleX, sampleY, polygon),
      )) {
        continue;
      }

      const score = scoreLabelPosition(x, y, corner);

      if (score > bestScore) {
        bestScore = score;
        bestPosition = new THREE.Vector2(x, y);
      }
    }
  }

  return bestPosition ?? new THREE.Vector2(fallbackX, fallbackY);
}

function createFragmentLabel(
  title: string,
  polygon: readonly FragmentPoint[],
  centroidX: number,
  centroidY: number,
  corner: "top-left" | "top-right" | "bottom-right",
) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const fontSize = 36;
  const horizontalPadding = 20;
  const verticalPadding = 12;

  if (!context) {
    return null;
  }

  context.font = `600 ${fontSize}px Pretendard, sans-serif`;
  const textWidth = Math.ceil(context.measureText(title).width);
  canvas.width = textWidth + horizontalPadding * 2;
  canvas.height = fontSize + verticalPadding * 2;
  context.font = `600 ${fontSize}px Pretendard, sans-serif`;
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillStyle = "rgba(32, 60, 96, 0.92)";
  context.fillText(title, horizontalPadding, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const labelHeight = 0.25;
  const labelWidth = labelHeight * (canvas.width / canvas.height);
  const labelPosition = findLabelPosition(
    polygon,
    labelWidth,
    labelHeight,
    centroidX,
    centroidY,
    corner,
  );
  const geometry = new THREE.PlaneGeometry(labelWidth, labelHeight);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(
    labelPosition.x - centroidX,
    labelPosition.y - centroidY,
    0.1,
  );
  mesh.renderOrder = 3;

  return { mesh, material, geometry, texture };
}

function createFragment(
  data: CreditFragmentData,
  liquidSurfaceTexture: THREE.Texture,
  backgroundTexture: THREE.Texture,
  liquidResolution: THREE.Vector2,
  liquidCoverTransform: THREE.Vector4,
  fragmentTexture: THREE.Texture,
) {
  const polygon = CREDIT_FRAGMENT_POLYGONS[CREDIT_GEOMETRY_MAP[data.id]];
  const geometry = createCreditFragmentGeometry(polygon);
  const [centroidX, centroidY] = getPolygonCentroid(polygon);
  const polygonBounds = getPolygonBounds(polygon);
  const seamDirection = new THREE.Vector2(centroidX, centroidY);

  if (seamDirection.lengthSq() > 0) {
    seamDirection.normalize().multiplyScalar(SEAM);
  }

  if (data.id === "01") {
    seamDirection.x -= SIDE_FRAGMENT_SEAM_OFFSET;
  } else if (data.id === "04") {
    seamDirection.x += SIDE_FRAGMENT_SEAM_OFFSET;
  }

  const material = createCreditFragmentMaterial(
    fragmentTexture,
    liquidSurfaceTexture,
    data.seed,
  );
  const liquidUniforms = {
    backdrop: { value: backgroundTexture },
    resolution: { value: liquidResolution },
    coverTransform: { value: liquidCoverTransform },
    time: { value: 0 },
    hover: { value: 0 },
    colorAmount: { value: 0 },
    seed: { value: data.seed },
  };

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uLiquidBackdrop = liquidUniforms.backdrop;
    shader.uniforms.uLiquidResolution = liquidUniforms.resolution;
    shader.uniforms.uLiquidCoverTransform = liquidUniforms.coverTransform;
    shader.uniforms.uLiquidTime = liquidUniforms.time;
    shader.uniforms.uLiquidHover = liquidUniforms.hover;
    shader.uniforms.uLiquidColorAmount = liquidUniforms.colorAmount;
    shader.uniforms.uLiquidSeed = liquidUniforms.seed;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "void main() {",
        `uniform sampler2D uLiquidBackdrop;
uniform vec2 uLiquidResolution;
uniform vec4 uLiquidCoverTransform;
uniform float uLiquidTime;
uniform float uLiquidHover;
uniform float uLiquidColorAmount;
uniform float uLiquidSeed;

vec3 sampleLiquidBackdrop(vec2 screenUv, vec2 offset) {
  vec2 uv = (screenUv + offset) * uLiquidCoverTransform.xy +
    uLiquidCoverTransform.zw;
  return texture2D(uLiquidBackdrop, clamp(uv, vec2(0.001), vec2(0.999))).rgb;
}

void main() {`,
      )
      .replace(
        "#include <opaque_fragment>",
        `#include <opaque_fragment>

vec2 liquidScreenUv = gl_FragCoord.xy / max(uLiquidResolution, vec2(1.0));
float liquidPhase = uLiquidTime * 0.28 + uLiquidSeed * 2.4;
vec2 liquidFlow = vec2(
  sin(liquidScreenUv.y * 21.0 + liquidPhase) +
    sin((liquidScreenUv.x + liquidScreenUv.y) * 15.0 - liquidPhase * 0.72),
  cos(liquidScreenUv.x * 19.0 - liquidPhase * 0.84) +
    cos((liquidScreenUv.x - liquidScreenUv.y) * 17.0 + liquidPhase * 0.58)
) * 0.5;
float liquidEdge = pow(1.0 - clamp(abs(normal.z), 0.0, 1.0), 1.35);
vec2 liquidDistortion = (
  liquidFlow * (0.005 + uLiquidHover * 0.0025) +
  normal.xy * (0.016 + uLiquidHover * 0.007)
) * liquidEdge;
vec2 liquidChromaAxis = length(normal.xy) > 0.001
  ? normalize(normal.xy)
  : vec2(1.0, 0.0);
float liquidChromaSpread = liquidEdge * (0.0035 + uLiquidHover * 0.0025);
vec3 liquidRefracted = vec3(
  sampleLiquidBackdrop(
    liquidScreenUv,
    liquidDistortion + liquidChromaAxis * liquidChromaSpread
  ).r,
  sampleLiquidBackdrop(liquidScreenUv, liquidDistortion).g,
  sampleLiquidBackdrop(
    liquidScreenUv,
    liquidDistortion - liquidChromaAxis * liquidChromaSpread
  ).b
);
liquidRefracted = mix(
  liquidRefracted,
  vec3(0.125, 0.235, 0.376),
  0.07
);
float liquidMix = clamp(
  liquidEdge * (0.46 + uLiquidHover * 0.16),
  0.0,
  0.68
);
#ifdef USE_MAP
  vec2 liquidImageUv = clamp(
    vMapUv + liquidDistortion * 0.32,
    vec2(0.001),
    vec2(0.999)
  );
  vec2 liquidImageChroma = liquidChromaAxis * liquidChromaSpread * 0.72;
  vec3 liquidImageRefracted = vec3(
    texture2D(map, clamp(liquidImageUv + liquidImageChroma, vec2(0.001), vec2(0.999))).r,
    texture2D(map, liquidImageUv).g,
    texture2D(map, clamp(liquidImageUv - liquidImageChroma, vec2(0.001), vec2(0.999))).b
  );
  float liquidImageMix = clamp(
    liquidEdge * (0.42 + uLiquidHover * 0.14),
    0.0,
    0.58
  );
  gl_FragColor.rgb = mix(gl_FragColor.rgb, liquidImageRefracted, liquidImageMix);
#endif
gl_FragColor.rgb = mix(gl_FragColor.rgb, liquidRefracted, liquidMix);
float liquidLuminance = dot(
  gl_FragColor.rgb,
  vec3(0.2126, 0.7152, 0.0722)
);
gl_FragColor.rgb = mix(
  vec3(liquidLuminance),
  gl_FragColor.rgb,
  uLiquidColorAmount
);`,
      );
  };
  material.customProgramCacheKey = () => "credits-liquid-glass-v3";
  const mesh = new THREE.Mesh(geometry, material);
  const group = new THREE.Group();
  const hoverPivot = new THREE.Group();
  const baseRotation = new THREE.Euler(
    data.rotation[0],
    data.rotation[1],
    data.rotation[2],
  );
  const label = createFragmentLabel(
    data.title,
    polygon,
    centroidX,
    centroidY,
    data.id === "02"
      ? "top-left"
      : data.id === "03"
        ? "top-right"
        : "bottom-right",
  );

  mesh.renderOrder = 2;
  hoverPivot.position.set(centroidX, centroidY, 0);
  mesh.position.set(-centroidX, -centroidY, 0);
  mesh.userData.fragmentId = data.id;
  hoverPivot.add(mesh);

  if (label) {
    hoverPivot.add(label.mesh);
  }

  group.add(hoverPivot);
  group.scale.setScalar(data.scale);
  group.rotation.copy(baseRotation);

  return {
    data,
    group,
    hoverPivot,
    mesh,
    material,
    label,
    liquidUniforms,
    baseRotation,
    centroid: new THREE.Vector3(centroidX, centroidY, 0),
    polygonBounds,
    seamOffset: new THREE.Vector3(seamDirection.x, seamDirection.y, 0),
    basePosition: new THREE.Vector3(),
    targetPosition: new THREE.Vector3(),
    targetRotation: new THREE.Euler(),
    targetScaleVector: new THREE.Vector3(),
  };
}

function setSelectedTarget(
  target: THREE.Vector3,
  fragment: FragmentRuntime,
  isMobile: boolean,
) {
  const selectedScale =
    fragment.data.selectedScale * (isMobile ? 0.58 : 0.72);
  target.fromArray(
    getSelectedFragmentPosition(
      fragment.centroid.x,
      fragment.polygonBounds,
      selectedScale,
      isMobile,
    ),
  );
}

function setOffscreenTarget(target: THREE.Vector3, fragment: FragmentRuntime) {
  target.fromArray(
    getOffscreenFragmentPosition(fragment.centroid.x, fragment.centroid.y),
  );
}

export default function CreditScene({
  initialFragmentId = null,
}: CreditSceneProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<ScenePhase>(
    initialFragmentId ? "SELECTED" : "IDLE",
  );
  const selectedIdRef = useRef<CreditFragmentId | null>(initialFragmentId);
  const hoveredIdRef = useRef<CreditFragmentId | null>(null);
  const pointerRef = useRef(new THREE.Vector2(0, 0));
  const pointerTargetRef = useRef(new THREE.Vector2(0, 0));
  const isMobileRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const transitionStartedAtRef = useRef<number | null>(null);
  const routeFragmentIdRef = useRef<CreditFragmentId | null>(initialFragmentId);
  const mountedFragmentIdRef = useRef(initialFragmentId);
  const selectFragmentRef = useRef<(id: CreditFragmentId) => void>(() => {});
  const closeFragmentRef = useRef<() => void>(() => {});
  const [selectedId, setSelectedId] = useState<CreditFragmentId | null>(
    initialFragmentId,
  );
  const [contentVisible, setContentVisible] = useState(Boolean(initialFragmentId));

  const selectFragment = useCallback((id: CreditFragmentId) => {
    if (phaseRef.current !== "IDLE") {
      return;
    }

    selectedIdRef.current = id;
    phaseRef.current = "SELECTING";
    transitionStartedAtRef.current = performance.now();
    setSelectedId(id);
    setContentVisible(false);

    const fragment = getCreditFragmentById(id);

    if (!fragment) {
      return;
    }

    router.push(`${SITE_PATHS.credits}/${fragment.slug}`, { scroll: false });
  }, [router]);

  const closeFragment = useCallback(() => {
    if (!selectedIdRef.current || phaseRef.current === "CLOSING") {
      return;
    }

    phaseRef.current = "CLOSING";
    transitionStartedAtRef.current = performance.now();
    setContentVisible(false);
    router.push(SITE_PATHS.credits, { scroll: false });
  }, [router]);

  useEffect(() => {
    selectFragmentRef.current = selectFragment;
    closeFragmentRef.current = closeFragment;
  }, [selectFragment, closeFragment]);

  useEffect(() => {
    routeFragmentIdRef.current = initialFragmentId;
    hoveredIdRef.current = null;

    const isActiveSelectionRoute =
      initialFragmentId !== null &&
      selectedIdRef.current === initialFragmentId &&
      phaseRef.current === "SELECTING";
    const isActiveClosingRoute =
      initialFragmentId === null && phaseRef.current === "CLOSING";

    if (isActiveSelectionRoute || isActiveClosingRoute) {
      return;
    }

    selectedIdRef.current = initialFragmentId;
    phaseRef.current = initialFragmentId ? "SELECTED" : "IDLE";
    transitionStartedAtRef.current = null;

    const contentFrame = window.requestAnimationFrame(() => {
      setSelectedId(initialFragmentId);
      setContentVisible(Boolean(initialFragmentId));
    });

    return () => {
      window.cancelAnimationFrame(contentFrame);
    };
  }, [initialFragmentId]);

  useEffect(() => {
    creditFragments.forEach((fragment) => {
      router.prefetch(`${SITE_PATHS.credits}/${fragment.slug}`);
    });
  }, [router]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeFragmentRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const sceneBase = createCreditSceneBase(container);
    const { renderer, scene, camera, sceneRoot } = sceneBase;
    const liquidSurfaceTexture = createLiquidSurfaceTexture();
    const backgroundTexture = createLiquidBackdropTexture();
    const fragmentTextures = loadCreditFragmentTextures(
      renderer,
      creditFragments.map((fragment) => fragment.id),
    );
    const liquidResolution = new THREE.Vector2(1, 1);
    const liquidCoverTransform = new THREE.Vector4(1, 1, 0, 0);
    backgroundTexture.colorSpace = THREE.SRGBColorSpace;
    sceneRoot.rotation.copy(PANEL_BASE_ROTATION);
    const raycaster = new THREE.Raycaster();
    const rayPointer = new THREE.Vector2(10, 10);
    const mobileQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const fragments = creditFragments.map((fragment) =>
      createFragment(
        fragment,
        liquidSurfaceTexture,
        backgroundTexture,
        liquidResolution,
        liquidCoverTransform,
        fragmentTextures[fragment.id],
      ),
    );
    let animationFrame = 0;

    const updateEnvironmentFlags = () => {
      isMobileRef.current = mobileQuery.matches;
      reducedMotionRef.current = reducedMotionQuery.matches;
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();

      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      camera.aspect = width / height;
      camera.position.set(0, 0, isMobileRef.current ? 17.4 : 11.8);
      camera.updateProjectionMatrix();
      renderer.transmissionResolutionScale = isMobileRef.current ? 0.5 : 0.75;
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.getDrawingBufferSize(liquidResolution);
    };

    const updateHoverFromPointer = () => {
      if (phaseRef.current !== "IDLE") {
        hoveredIdRef.current = null;
        renderer.domElement.style.cursor = "";
        return;
      }

      raycaster.setFromCamera(rayPointer, camera);

      const intersects = raycaster.intersectObjects(
        fragments.map((fragment) => fragment.mesh),
        false,
      );
      const hoveredId = intersects[0]?.object.userData.fragmentId as
        | CreditFragmentId
        | undefined;

      hoveredIdRef.current = hoveredId ?? null;
      renderer.domElement.style.cursor = hoveredId ? "pointer" : "";
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);

      pointerTargetRef.current.set(x, y);
      rayPointer.set(x, y);
      updateHoverFromPointer();
    };

    const handlePointerLeave = () => {
      pointerTargetRef.current.set(0, 0);
      rayPointer.set(10, 10);
      hoveredIdRef.current = null;
      renderer.domElement.style.cursor = "";
    };

    const handleClick = () => {
      if (phaseRef.current === "IDLE" && hoveredIdRef.current) {
        pointerTargetRef.current.set(0, 0);
        rayPointer.set(10, 10);
        selectFragmentRef.current(hoveredIdRef.current);
      }
    };
    const handleMobileQueryChange = () => {
      updateEnvironmentFlags();
      resize();
    };

    updateEnvironmentFlags();

    const mountedFragmentId = mountedFragmentIdRef.current;

    fragments.forEach((fragment) => {
      if (mountedFragmentId) {
        if (fragment.data.id === mountedFragmentId) {
          setSelectedTarget(fragment.group.position, fragment, isMobileRef.current);
          fragment.group.scale.setScalar(
            fragment.data.selectedScale * (isMobileRef.current ? 0.58 : 0.72),
          );
          fragment.group.rotation.set(0.025, -0.025, 0.008);
          fragment.material.opacity = 0.8;
          if (fragment.label) fragment.label.material.opacity = 0.88;
        } else {
          setOffscreenTarget(fragment.group.position, fragment);
          fragment.group.scale.setScalar(fragment.data.scale * 0.68);
          fragment.material.opacity = 0;
          if (fragment.label) fragment.label.material.opacity = 0;
        }
      } else {
        setOffscreenTarget(fragment.group.position, fragment);
        fragment.group.scale.setScalar(
          fragment.data.scale * (reducedMotionRef.current ? 0.9 : 0.78),
        );
        fragment.material.opacity = reducedMotionRef.current ? 0.3 : 0.05;
        if (fragment.label) {
          fragment.label.material.opacity = reducedMotionRef.current ? 0.3 : 0.05;
        }
      }
    });

    sceneRoot.add(...fragments.map((fragment) => fragment.group));

    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    mobileQuery.addEventListener("change", handleMobileQueryChange);
    reducedMotionQuery.addEventListener("change", updateEnvironmentFlags);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerleave", handlePointerLeave);
    renderer.domElement.addEventListener("click", handleClick);

    let previousFrameTime: number | null = null;
    let elapsed = 0;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        previousFrameTime = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const animate = (timestamp: number) => {
      const rawDelta =
        previousFrameTime === null ? 0 : (timestamp - previousFrameTime) / 1000;
      previousFrameTime = timestamp;
      const delta = Math.min(Math.max(rawDelta, 0), 0.05);
      elapsed += delta;
      const reducedMotion = reducedMotionRef.current;
      const motionScale = reducedMotion ? 0.4 : 1;
      const isMobile = isMobileRef.current;
      const selectedIdValue = selectedIdRef.current;
      const isSelectedMode =
        phaseRef.current === "SELECTING" || phaseRef.current === "SELECTED";
      const transitionDuration = reducedMotion
        ? Math.max(420, SCENE_TRANSITION_DURATION_MS * 0.55)
        : SCENE_TRANSITION_DURATION_MS;
      const transitionComplete =
        transitionStartedAtRef.current !== null &&
        performance.now() - transitionStartedAtRef.current >= transitionDuration;
      const transitionDampRate =
        phaseRef.current === "SELECTING" || phaseRef.current === "CLOSING"
          ? 6.4
          : 3.8;
      const damp = transitionComplete
        ? 1
        : 1 - Math.exp(-delta * transitionDampRate);
      const pointerDamp = 1 - Math.exp(-delta * (reducedMotion ? 5.4 : 4.2));
      const clusterFloatX = Math.cos(elapsed * 0.16) * 0.018 * motionScale;
      const clusterFloatY = Math.sin(elapsed * 0.19) * 0.026 * motionScale;
      const scenePointerX = isSelectedMode ? 0 : pointerRef.current.x;
      const scenePointerY = isSelectedMode ? 0 : pointerRef.current.y;
      const clusterTiltZ = isSelectedMode
        ? 0
        : Math.sin(elapsed * 0.14) * 0.012 * motionScale;

      liquidSurfaceTexture.offset.x = (elapsed * 0.008 * motionScale) % 1;
      liquidSurfaceTexture.offset.y =
        (1 + Math.sin(elapsed * 0.09) * 0.025 * motionScale) % 1;

      pointerRef.current.lerp(pointerTargetRef.current, pointerDamp);
      sceneRoot.rotation.y = THREE.MathUtils.lerp(
        sceneRoot.rotation.y,
        PANEL_BASE_ROTATION.y + scenePointerX * 0.018 * motionScale,
        damp,
      );
      sceneRoot.rotation.x = THREE.MathUtils.lerp(
        sceneRoot.rotation.x,
        PANEL_BASE_ROTATION.x - scenePointerY * 0.012 * motionScale,
        damp,
      );
      sceneRoot.rotation.z = THREE.MathUtils.lerp(
        sceneRoot.rotation.z,
        PANEL_BASE_ROTATION.z + clusterTiltZ,
        damp,
      );
      camera.position.x = THREE.MathUtils.lerp(
        camera.position.x,
        scenePointerX * 0.08 * motionScale,
        damp,
      );
      camera.position.y = THREE.MathUtils.lerp(
        camera.position.y,
        scenePointerY * 0.06 * motionScale,
        damp,
      );
      camera.lookAt(0, 0, 0);

      fragments.forEach((fragment: FragmentRuntime, index) => {
        const isSelected = selectedIdValue === fragment.data.id;
        const isHovered = hoveredIdRef.current === fragment.data.id;
        const basePosition = fragment.basePosition
          .copy(ASSEMBLED_POSITION)
          .add(fragment.seamOffset);
        const targetPosition = fragment.targetPosition;
        const targetRotation = fragment.targetRotation;
        let targetScale = fragment.data.scale;
        let targetOpacity = 0.76;
        let targetLabelOpacity = 0.82;

        if (isSelectedMode && isSelected) {
          setSelectedTarget(targetPosition, fragment, isMobile);
          targetScale =
            fragment.data.selectedScale * (isMobile ? 0.58 : 0.72);
          targetOpacity = 0.82;
          targetLabelOpacity = 0.88;
          targetRotation.set(0.025, -0.025, 0.008);
        } else if (isSelectedMode) {
          setOffscreenTarget(targetPosition, fragment);
          targetScale = fragment.data.scale * 0.68;
          targetOpacity = 0;
          targetLabelOpacity = 0;
          targetRotation.set(
            fragment.baseRotation.x + (index < 2 ? 0.08 : -0.08),
            fragment.baseRotation.y + (index % 2 === 0 ? 0.12 : -0.12),
            fragment.baseRotation.z + (index < 2 ? 0.04 : -0.04),
          );
        } else {
          const floatA = Math.sin(elapsed * (0.22 + index * 0.01) + fragment.data.seed);
          const floatB = Math.cos(elapsed * (0.18 + index * 0.008) - fragment.data.seed);
          const floatC = Math.sin(elapsed * 0.12 + fragment.data.seed * 1.7);
          const depthFactor = 1 + Math.abs(basePosition.z) * 0.16;

          targetPosition.copy(basePosition);
          targetPosition.x += clusterFloatX + floatB * 0.008 * motionScale;
          targetPosition.y += clusterFloatY + floatA * 0.01 * motionScale;
          targetPosition.z += floatC * 0.006 * motionScale;
          targetPosition.x += pointerRef.current.x * 0.028 * depthFactor * motionScale;
          targetPosition.y += pointerRef.current.y * 0.018 * depthFactor * motionScale;
          targetPosition.z += isHovered ? 0.075 : 0;
          targetScale = fragment.data.scale * (isHovered ? 1.045 : 1);
          targetRotation.set(
            fragment.baseRotation.x + floatA * 0.008 * motionScale,
            fragment.baseRotation.y + floatB * 0.01 * motionScale,
            fragment.baseRotation.z + floatC * 0.006 * motionScale,
          );
        }

        fragment.group.position.lerp(targetPosition, damp);
        fragment.group.scale.lerp(
          fragment.targetScaleVector.set(targetScale, targetScale, targetScale),
          damp,
        );
        fragment.group.rotation.x = THREE.MathUtils.lerp(
          fragment.group.rotation.x,
          targetRotation.x,
          damp,
        );
        fragment.group.rotation.y = THREE.MathUtils.lerp(
          fragment.group.rotation.y,
          targetRotation.y,
          damp,
        );
        fragment.group.rotation.z = THREE.MathUtils.lerp(
          fragment.group.rotation.z,
          targetRotation.z,
          damp,
        );
        const hoverTiltX =
          isHovered && !isSelectedMode
            ? -pointerRef.current.y * 0.38 * motionScale
            : 0;
        const hoverTiltY =
          isHovered && !isSelectedMode
            ? pointerRef.current.x * 0.46 * motionScale
            : 0;
        fragment.hoverPivot.rotation.x = THREE.MathUtils.lerp(
          fragment.hoverPivot.rotation.x,
          hoverTiltX,
          damp,
        );
        fragment.hoverPivot.rotation.y = THREE.MathUtils.lerp(
          fragment.hoverPivot.rotation.y,
          hoverTiltY,
          damp,
        );
        fragment.material.opacity = THREE.MathUtils.lerp(
          fragment.material.opacity,
          targetOpacity,
          damp,
        );
        if (fragment.label) {
          fragment.label.material.opacity = THREE.MathUtils.lerp(
            fragment.label.material.opacity,
            targetLabelOpacity,
            damp,
          );
        }
        fragment.liquidUniforms.time.value = elapsed * motionScale;
        fragment.liquidUniforms.hover.value = THREE.MathUtils.lerp(
          fragment.liquidUniforms.hover.value,
          isHovered && !isSelectedMode ? 1 : 0,
          damp,
        );
        const targetColorAmount = isMobile
          ? 1
          : isSelectedMode
            ? isSelected
              ? 1
              : 0
            : isHovered
              ? 1
              : 0;
        fragment.liquidUniforms.colorAmount.value = THREE.MathUtils.lerp(
          fragment.liquidUniforms.colorAmount.value,
          targetColorAmount,
          damp,
        );
      });

      if (transitionComplete) {
        transitionStartedAtRef.current = null;

        if (phaseRef.current === "SELECTING") {
          phaseRef.current = "SELECTED";

          if (routeFragmentIdRef.current === selectedIdRef.current) {
            setContentVisible(true);
          }
        } else if (phaseRef.current === "CLOSING") {
          phaseRef.current = "IDLE";
          selectedIdRef.current = null;
          setSelectedId(null);
        }
      }

      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    };

    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);
      renderer.domElement.removeEventListener("click", handleClick);
      mobileQuery.removeEventListener("change", handleMobileQueryChange);
      reducedMotionQuery.removeEventListener("change", updateEnvironmentFlags);
      renderer.domElement.remove();
      fragments.forEach((fragment) => {
        fragment.mesh.geometry.dispose();
        fragment.material.dispose();
        fragment.label?.geometry.dispose();
        fragment.label?.material.dispose();
        fragment.label?.texture.dispose();
      });
      liquidSurfaceTexture.dispose();
      backgroundTexture.dispose();
      disposeCreditFragmentTextures(fragmentTextures);
      disposeCreditSceneBase(sceneBase);
    };
  }, []);

  return (
    <section
      className={[
        "credits-scene",
        initialFragmentId ? "credits-scene--detail" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Credits"
    >
      <div ref={containerRef} className="credits-scene__canvas-wrap" />
      <CreditContentOverlay
        selectedId={selectedId}
        isVisible={contentVisible}
        onClose={closeFragment}
      />
    </section>
  );
}
