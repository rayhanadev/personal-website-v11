import { Result } from "better-result";

const GEOCODE_ENDPOINT = "https://nominatim.openstreetmap.org/reverse";
const GEOCODE_TIMEOUT_MS = 4_000;

const stateNamesToAbbreviations: Record<string, string> = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
  "District of Columbia": "DC",
};

type ReverseGeocodeResponse = {
  address?: {
    city?: string;
    city_district?: string;
    county?: string;
    hamlet?: string;
    municipality?: string;
    neighbourhood?: string;
    state?: string;
    state_code?: string;
    suburb?: string;
    town?: string;
    village?: string;
  };
};

const geocodeCache = new Map<string, Promise<string | null>>();

export async function formatCityState(latitude: number, longitude: number): Promise<string | null> {
  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  const cached = geocodeCache.get(cacheKey);

  if (cached) {
    return await cached;
  }

  const promise = (async () => {
    const result = await Result.tryPromise(async () => {
      const searchParams = new URLSearchParams({
        addressdetails: "1",
        format: "jsonv2",
        lat: String(latitude),
        lon: String(longitude),
        zoom: "10",
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS);

      try {
        const response = await fetch(`${GEOCODE_ENDPOINT}?${searchParams.toString()}`, {
          headers: {
            Accept: "application/json",
            "Accept-Language": "en",
            "User-Agent": "personal-website-v11/1.0 (rayhanadev.com)",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          return null;
        }

        const json = (await response.json()) as ReverseGeocodeResponse;
        const address = json.address;
        if (!address) {
          return null;
        }

        const city = firstNonEmpty([
          address.city,
          address.town,
          address.village,
          address.municipality,
          address.hamlet,
          address.suburb,
          address.neighbourhood,
          address.city_district,
          address.county,
        ]);
        const state = formatState(address.state_code ?? address.state);

        if (city && state) {
          return `${city}, ${state}`;
        }

        return city ?? state ?? null;
      } finally {
        clearTimeout(timeout);
      }
    });

    return result.match({
      err: () => null,
      ok: (value: string | null) => value,
    });
  })();

  geocodeCache.set(cacheKey, promise);
  return await promise;
}

function firstNonEmpty(values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return undefined;
}

function formatState(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.length === 2) {
    return trimmed.toUpperCase();
  }

  return stateNamesToAbbreviations[trimmed] ?? trimmed;
}
