// Minimal type declarations for Naver Maps JavaScript SDK v3.
// Loaded via <Script src="https://oapi.map.naver.com/openapi/v3/maps.js?...">.
// Extend as needed when using more features.

declare namespace naver.maps {
  class Map {
    constructor(el: HTMLElement, opts?: MapOptions);
    setCenter(latlng: LatLng): void;
    setZoom(level: number): void;
    fitBounds(bounds: LatLngBounds, margin?: number): void;
    panTo(latlng: LatLng, opts?: unknown): void;
  }

  interface MapOptions {
    center?: LatLng;
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    zoomControl?: boolean;
    mapTypeControl?: boolean;
    scaleControl?: boolean;
    mapDataControl?: boolean;
    logoControl?: boolean;
    logoControlOptions?: { position: number };
  }

  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }

  class LatLngBounds {
    constructor(sw: LatLng, ne: LatLng);
    extend(latlng: LatLng): LatLngBounds;
    static bounds(latlng1: LatLng, latlng2: LatLng): LatLngBounds;
  }

  class Marker {
    constructor(opts?: MarkerOptions);
    setMap(map: Map | null): void;
    setPosition(latlng: LatLng): void;
  }

  interface MarkerOptions {
    position: LatLng;
    map?: Map;
    icon?: MarkerIcon | string;
    title?: string;
    zIndex?: number;
  }

  interface MarkerIcon {
    content: string;
    size?: Size;
    anchor?: Point;
  }

  class Polyline {
    constructor(opts?: PolylineOptions);
    setMap(map: Map | null): void;
  }

  interface PolylineOptions {
    map?: Map;
    path: LatLng[];
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    strokeStyle?: string;
  }

  class Size {
    constructor(w: number, h: number);
  }

  class Point {
    constructor(x: number, y: number);
  }

  // Position constants for controls
  const TOP_LEFT: number;
  const TOP_RIGHT: number;
  const BOTTOM_LEFT: number;
  const BOTTOM_RIGHT: number;
}
