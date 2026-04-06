import { useState, useCallback, useRef } from 'react';
import { nigeriaAddresses } from '../data/nigeriaAddresses';

export interface PlacePrediction {
  description: string;
  placeId: string;
  lat: number;
  lng: number;
  street: string;
  city: string;
  state: string;
}

export interface PlaceDetails {
  street: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

/**
 * Hybrid Address Search Hook (Local Database + Photon API)
 * Prioritizes pinpoint accurate local 'Seed' data while providing global Photon coverage.
 * No API Keys | No Console | Pinpoint Precision
 */
export const usePlacesAutocomplete = () => {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortController = useRef<AbortController | null>(null);

  /**
   * Performs a hybrid search: Local Nigeria Database -> Photon API.
   */
  const getPredictions = useCallback(async (input: string) => {
    if (!input || input.length < 3) {
      setPredictions([]);
      return;
    }

    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    setIsLoading(true);

    try {
      const searchTerm = input.toLowerCase();

      // 1. Search Local Database First (Pinpoint Demo Data)
      const localResults = nigeriaAddresses
        .filter(addr => addr.description.toLowerCase().includes(searchTerm))
        .map(addr => ({
          description: addr.description,
          placeId: addr.id,
          lat: addr.lat,
          lng: addr.lng,
          street: addr.street,
          city: addr.city,
          state: addr.state
        }));

      // 2. Search Global Photon API
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(input)}&limit=10&lat=6.5244&lon=3.3792&location_bias_scale=0.5`;
      const response = await fetch(url, { signal: abortController.current.signal });
      const data = await response.json();

      let remoteResults: PlacePrediction[] = [];
      if (data && data.features) {
        remoteResults = data.features.map((feat: any) => {
          const props = feat.properties;
          const coords = feat.geometry.coordinates;

          /**
           * Photon Address Component Parser
           * Mirrors Google Maps address_components logic:
           *   housenumber  → street_number
           *   street       → route
           *   district/suburb → sublocality / locality
           *   city         → locality (fallback)
           *   state        → administrative_area_level_1
           */

          // ── CONFIRMED STREET ──────────────────────────────────────────
          // Priority 1: Explicit Photon route + house number fields
          const houseNum   = (props.housenumber || '').trim();
          const routeName  = (props.street || '').trim();

          let confirmedStreet = '';

          if (routeName) {
            // props.street is a clean road name (e.g. "Asabi Aderohunmu Street")
            confirmedStreet = houseNum ? `${houseNum} ${routeName}` : routeName;
          } else if (props.name) {
            // props.name may be "9 Asabi Aderohunmu Street" (no comma → safe)
            // or "9 Asabi Aderohunmu Street, Alagbado, Lagos" (has commas → strip city/state tail)
            const nameParts = (props.name as string).split(',');
            confirmedStreet = nameParts[0].trim();   // Only the first segment = house + street
          }

          // ── CITY / AREA (locality) ───────────────────────────────────
          // props.city  = locality  (e.g. "Ikeja")  ← preferred for City field
          // props.district/suburb = sublocality (e.g. "Oregun") ← only if city absent
          const city = (
            props.city      ||
            props.district  ||
            props.suburb    ||
            props.county    ||
            ''
          ).trim();

          // ── STATE (administrative_area_level_1) ───────────────────────
          const state = (props.state || '').trim();

          // Build a clean readable description for the dropdown
          const descParts = [confirmedStreet, city, state].filter(Boolean);

          return {
            description: descParts.join(', '),
            placeId: `p-${coords[1]}-${coords[0]}-${props.osm_id}`,
            lat: coords[1],
            lng: coords[0],
            street: confirmedStreet,
            city,
            state
          };
        });
      }

      // 3. Combine: Local results first, then remote
      const combined = [...localResults, ...remoteResults.filter(r => !localResults.some(l => l.description === r.description))];
      setPredictions(combined);
      
    } catch {
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDetails = useCallback(async (placeId: string): Promise<PlaceDetails | null> => {
    const match = predictions.find(p => p.placeId === placeId);
    if (!match) return null;
    return {
      street: match.street,
      city: match.city,
      state: match.state,
      lat: match.lat,
      lng: match.lng
    };
  }, [predictions]);

  return {
    predictions,
    getPredictions,
    getDetails,
    isLoading,
    setPredictions
  };
};
