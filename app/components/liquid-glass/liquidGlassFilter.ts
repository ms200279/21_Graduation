type DisplacementOptions = {
  height: number;
  width: number;
  radius: number;
  depth: number;
  strength?: number;
  chromaticAberration?: number;
};

type DisplacementMapOptions = Omit<
  DisplacementOptions,
  "chromaticAberration" | "strength"
>;

const displacementMapCache = new Map<string, string>();
const displacementFilterCache = new Map<string, string>();

function displacementMapCacheKey({
  height,
  width,
  radius,
  depth,
}: DisplacementMapOptions) {
  return `${width}x${height}r${radius}d${depth}`;
}

function displacementFilterCacheKey(options: DisplacementOptions) {
  const { strength = 100, chromaticAberration = 0, ...mapOptions } = options;
  return `${displacementMapCacheKey(mapOptions)}s${strength}c${chromaticAberration}`;
}

export const getDisplacementMap = (options: DisplacementMapOptions) => {
  const key = displacementMapCacheKey(options);
  const cached = displacementMapCache.get(key);

  if (cached) {
    return cached;
  }

  const { height, width, radius, depth } = options;
  const map =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <style>
        .mix { mix-blend-mode: screen; }
    </style>
    <defs>
        <linearGradient
          id="Y"
          x1="0"
          x2="0"
          y1="${Math.ceil((radius / height) * 15)}%"
          y2="${Math.floor(100 - (radius / height) * 15)}%">
            <stop offset="0%" stop-color="#0F0" />
            <stop offset="100%" stop-color="#000" />
        </linearGradient>
        <linearGradient
          id="X"
          x1="${Math.ceil((radius / width) * 15)}%"
          x2="${Math.floor(100 - (radius / width) * 15)}%"
          y1="0"
          y2="0">
            <stop offset="0%" stop-color="#F00" />
            <stop offset="100%" stop-color="#000" />
        </linearGradient>
    </defs>

    <rect x="0" y="0" height="${height}" width="${width}" fill="#808080" />
    <g filter="blur(2px)">
      <rect x="0" y="0" height="${height}" width="${width}" fill="#000080" />
      <rect
          x="0"
          y="0"
          height="${height}"
          width="${width}"
          fill="url(#Y)"
          class="mix"
      />
      <rect
          x="0"
          y="0"
          height="${height}"
          width="${width}"
          fill="url(#X)"
          class="mix"
      />
      <rect
          x="${depth}"
          y="${depth}"
          height="${height - 2 * depth}"
          width="${width - 2 * depth}"
          fill="#808080"
          rx="${radius}"
          ry="${radius}"
          filter="blur(${depth}px)"
      />
    </g>
</svg>`);

  displacementMapCache.set(key, map);
  return map;
};

export const getDisplacementFilter = (options: DisplacementOptions) => {
  const key = displacementFilterCacheKey(options);
  const cached = displacementFilterCache.get(key);

  if (cached) {
    return cached;
  }

  const {
    height,
    width,
    radius,
    depth,
    strength = 100,
    chromaticAberration = 0,
  } = options;

  if (strength <= 0 && chromaticAberration <= 0) {
    const filter =
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <filter id="displace" color-interpolation-filters="sRGB">
            <feComponentTransfer in="SourceGraphic" />
        </filter>
    </defs>
</svg>`) +
      "#displace";

    displacementFilterCache.set(key, filter);
    return filter;
  }

  const filter =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <filter id="displace" color-interpolation-filters="sRGB">
            <feImage x="0" y="0" height="${height}" width="${width}" href="${getDisplacementMap(
              {
                height,
                width,
                radius,
                depth,
              },
            )}" result="displacementMap" />
            <feDisplacementMap
                transform-origin="center"
                in="SourceGraphic"
                in2="displacementMap"
                scale="${strength + chromaticAberration * 2}"
                xChannelSelector="R"
                yChannelSelector="G"
            />
            <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
            result="displacedR"
                    />
            <feDisplacementMap
                in="SourceGraphic"
                in2="displacementMap"
                scale="${strength + chromaticAberration}"
                xChannelSelector="R"
                yChannelSelector="G"
            />
            <feColorMatrix
            type="matrix"
            values="0 0 0 0 0
                    0 1 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
            result="displacedG"
                    />
            <feDisplacementMap
                    in="SourceGraphic"
                    in2="displacementMap"
                    scale="${strength}"
                    xChannelSelector="R"
                    yChannelSelector="G"
                />
                <feColorMatrix
                type="matrix"
                values="0 0 0 0 0
                        0 0 0 0 0
                        0 0 1 0 0
                        0 0 0 1 0"
                result="displacedB"
                        />
              <feBlend in="displacedR" in2="displacedG" mode="screen"/>
              <feBlend in2="displacedB" mode="screen"/>
        </filter>
    </defs>
</svg>`) +
    "#displace";

  displacementFilterCache.set(key, filter);
  return filter;
};
