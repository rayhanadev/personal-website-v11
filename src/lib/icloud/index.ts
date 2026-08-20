import { cacheLife } from "next/cache";

import { env } from "@/env";
import {
  type FindMyConfig,
  type ICloudWebSession,
  ICloudWebClient,
  type RawFindMyDevice,
  type RawFindMyLocation,
} from "@/lib/icloud/client";
import { formatCityState } from "@/lib/icloud/geolocation";

const LOCATION_REVALIDATE_SECONDS = 600;

export type LocationMetadata =
  | {
      success: true;
      message: string;
      data: LocationData;
    }
  | {
      success: false;
      message: string;
      data: null;
    };

export type LocationData = {
  device: {
    batteryLevel: number | null;
    batteryStatus: string | null;
    deviceClass: string | null;
    displayName: string | null;
    id: string;
    modelDisplayName: string | null;
    name: string;
    rawDeviceModel: string | null;
  };
  location: {
    accuracyMeters: number | null;
    altitudeMeters: number | null;
    isInaccurate: boolean;
    isOld: boolean;
    latitude: number;
    locationType: string | null;
    longitude: number;
    mapsUrl: string;
    positionType: string | null;
    timestamp: Date | null;
    verticalAccuracyMeters: number | null;
  };
};

export async function fetchCurrentIPhoneLocation(): Promise<LocationMetadata> {
  let config: FindMyConfig | null;
  try {
    config = getFindMyConfig();
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : "Unable to parse iCloud configuration.",
    );
  }

  if (!config) {
    return failure("Set ICLOUD_APPLE_ID and ICLOUD_PASSWORD.");
  }

  try {
    const client = new ICloudWebClient(config);
    const response = await client.fetchFindMyDevices();
    const device = selectDevice(response.content, config);

    if (!device) {
      return failure("No matching iCloud device was returned.");
    }

    const location = normalizeLocation(device.location);
    if (!location) {
      return failure("The matching iCloud device did not include a usable location.");
    }

    return {
      success: true,
      message: "Location fetched successfully.",
      data: {
        device: normalizeDevice(device),
        location,
      },
    };
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Unable to fetch iCloud location.");
  }
}

function getFindMyConfig(): FindMyConfig | null {
  const appleId = nonEmpty(env.ICLOUD_APPLE_ID);
  const password = nonEmpty(env.ICLOUD_PASSWORD);

  if (!appleId || !password) {
    return null;
  }

  return {
    appleId,
    deviceName: nonEmpty(env.ICLOUD_DEVICE_NAME),
    password,
    webSession: parseWebSession(env.ICLOUD_WEB_SESSION_JSON),
  };
}

function parseWebSession(rawSession: string | undefined): ICloudWebSession | undefined {
  const raw = nonEmpty(rawSession);
  if (!raw) {
    return undefined;
  }

  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("ICLOUD_WEB_SESSION_JSON must be a JSON object.");
  }

  return parsed as ICloudWebSession;
}

function selectDevice(devices: RawFindMyDevice[], config: FindMyConfig): RawFindMyDevice | null {
  if (config.deviceName) {
    const targetName = config.deviceName.toLowerCase();
    const namedDevice = devices.find((device) =>
      [device.name, device.deviceDisplayName, device.modelDisplayName]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(targetName)),
    );

    if (namedDevice) {
      return namedDevice;
    }
  }

  const locatedDevices = devices.filter((device) => isUsableLocation(device.location));
  const iPhones = locatedDevices.filter(isIPhone);

  return newestDevice(iPhones) ?? newestDevice(locatedDevices) ?? devices[0] ?? null;
}

function isIPhone(device: RawFindMyDevice): boolean {
  return [
    device.deviceClass,
    device.deviceDisplayName,
    device.modelDisplayName,
    device.rawDeviceModel,
    device.name,
  ]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes("iphone"));
}

function newestDevice(devices: RawFindMyDevice[]): RawFindMyDevice | null {
  let newest: RawFindMyDevice | null = null;
  let newestTime = 0;

  for (const device of devices) {
    const time = parseAppleDate(device.location?.timeStamp)?.getTime() ?? 0;
    if (!newest || time > newestTime) {
      newest = device;
      newestTime = time;
    }
  }

  return newest;
}

function normalizeDevice(device: RawFindMyDevice): LocationData["device"] {
  return {
    batteryLevel: device.batteryLevel ?? null,
    batteryStatus: device.batteryStatus ?? null,
    deviceClass: device.deviceClass ?? null,
    displayName: device.deviceDisplayName ?? null,
    id: device.id,
    modelDisplayName: device.modelDisplayName ?? null,
    name: device.name ?? device.deviceDisplayName ?? device.modelDisplayName ?? "iPhone",
    rawDeviceModel: device.rawDeviceModel ?? null,
  };
}

function isUsableLocation(
  location: RawFindMyLocation | null | undefined,
): location is RawFindMyLocation {
  return !!location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude);
}

function normalizeLocation(
  location: RawFindMyLocation | null | undefined,
): LocationData["location"] | null {
  if (!isUsableLocation(location)) {
    return null;
  }

  return {
    accuracyMeters: location.horizontalAccuracy ?? null,
    altitudeMeters: location.altitude ?? null,
    isInaccurate: location.isInaccurate ?? false,
    isOld: location.isOld ?? false,
    latitude: location.latitude,
    locationType: location.locationType ?? null,
    longitude: location.longitude,
    mapsUrl: `https://maps.apple.com/?ll=${location.latitude},${location.longitude}`,
    positionType: location.positionType ?? null,
    timestamp: parseAppleDate(location.timeStamp),
    verticalAccuracyMeters: location.verticalAccuracy ?? null,
  };
}

function parseAppleDate(timestamp: number | string | null | undefined): Date | null {
  if (timestamp == null) {
    return null;
  }

  const value = Number(timestamp);
  const date = Number.isFinite(value)
    ? new Date(value < 1_000_000_000_000 ? value * 1000 : value)
    : new Date(timestamp);

  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Returns null rather than throwing on failure. The homepage is prerendered, so
 * a rejection here fails the production build outright — a transient iCloud
 * error must not be able to do that. The cost is that a failure is cached like
 * any other result, so the fallback copy sticks for up to the revalidate window
 * above.
 */
export async function fetchLocation(): Promise<string | null> {
  "use cache";
  cacheLife({ revalidate: LOCATION_REVALIDATE_SECONDS });

  const { data, success } = await fetchCurrentIPhoneLocation();
  if (!success) {
    return null;
  }

  return formatCityState(data.location.latitude, data.location.longitude);
}

function failure(message: string): LocationMetadata {
  return {
    success: false,
    message,
    data: null,
  };
}

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
