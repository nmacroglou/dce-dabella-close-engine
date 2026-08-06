let googleMapsPromise: Promise<typeof google> | null = null;

/** Shared async loader for the Google Maps JS API (browser key). */
export function loadGoogleMapsApi(): Promise<typeof google> {
  if (typeof window !== "undefined" && (window as unknown as { google?: typeof google }).google?.maps) {
    return Promise.resolve((window as unknown as { google: typeof google }).google);
  }
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    const tracking = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
    if (!key) {
      reject(new Error("Google Maps browser key missing"));
      return;
    }
    const cbName = "__initGoogleMapsShared";
    (window as unknown as Record<string, unknown>)[cbName] = () =>
      resolve((window as unknown as { google: typeof google }).google);

    const existing = document.querySelector<HTMLScriptElement>(`script[data-gmaps-shared="1"]`);
    if (existing) return;

    const s = document.createElement("script");
    s.dataset.gmapsShared = "1";
    s.src =
      `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=${cbName}` +
      (tracking ? `&channel=${tracking}` : "");
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });

  return googleMapsPromise;
}
