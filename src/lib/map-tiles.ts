/** Light grey raster basemap that does not require a third-party API key. */
export const MAP_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";

export const MAP_LABEL_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}";

export const MAP_TILE_ATTRIBUTION =
  'Tiles &copy; <a href="https://www.esri.com/">Esri</a>';

export const MAP_TILE_OPTIONS = {
  attribution: MAP_TILE_ATTRIBUTION,
  maxZoom: 16,
};

export function addBasemap(
  L: typeof import("leaflet"),
  map: import("leaflet").Map
) {
  L.tileLayer(MAP_TILE_URL, MAP_TILE_OPTIONS).addTo(map);
  L.tileLayer(MAP_LABEL_TILE_URL, { maxZoom: 16 }).addTo(map);
}
