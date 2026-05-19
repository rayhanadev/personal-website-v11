import { createHash, pbkdf2Sync, randomBytes, randomUUID } from "node:crypto";
import { request } from "node:https";

import { z } from "zod";

import { env } from "@/env";

const AUTH_ENDPOINT = "https://idmsa.apple.com/appleauth/auth";
const HOME_ENDPOINT = "https://www.icloud.com";
const SETUP_ENDPOINT = "https://setup.icloud.com/setup/ws/1";
const WIDGET_KEY = "d39ba9916b7251055b22c7f910e2ea796ee65e98b2ddecea8f5dde8d9d1a815d";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3.1 Safari/605.1.15";
const CLIENT_BUILD_NUMBER = "2534Project66";
const CLIENT_MASTERING_NUMBER = "2534B22";

const SRP_N_HEX =
  "AC6BDB41324A9A9BF166DE5E1389582FAF72B6651987EE07FC3192943DB56050A37329CBB4A099ED8193E0757767A13DD52312AB4B03310DCD7F48A9DA04FD50E8083969EDB767B0CF6095179A163AB3661A05FBD5FAAAE82918A9962F0B93B855F97993EC975EEAA80D740ADBF4FF747359D041D5C33EA71D281E446B14773BCA97B43A23FB801676BD207A436C6481F1D2B9078717461A5B9D32E688F87748544523B524B0D57D5EA77A2775D2ECFA032CFBDBF52FB3786160279004E57AE6AF874E7303CE53299CCC041C7BC308D82A5698F3A8D0C38271AE35F8E9DBFBB694B5C803D89F7AE435DE236D525F54759B65E372FCD68EF20FA7111F9E4AFF73";
const SRP_N = BigInt(`0x${SRP_N_HEX}`);
const SRP_G = BigInt(2);
const SRP_WIDTH = Buffer.from(SRP_N_HEX, "hex").length;

const RawFindMyLocation = z.object({
  altitude: z.number().nullable().optional(),
  horizontalAccuracy: z.number().nullable().optional(),
  isInaccurate: z.boolean().nullable().optional(),
  isOld: z.boolean().nullable().optional(),
  latitude: z.number(),
  locationType: z.string().nullable().optional(),
  longitude: z.number(),
  positionType: z.string().nullable().optional(),
  timeStamp: z.union([z.number(), z.string()]).nullable().optional(),
  verticalAccuracy: z.number().nullable().optional(),
});

const RawFindMyDevice = z.object({
  batteryLevel: z.number().nullable().optional(),
  batteryStatus: z.string().nullable().optional(),
  deviceClass: z.string().nullable().optional(),
  deviceDisplayName: z.string().nullable().optional(),
  id: z.string(),
  location: RawFindMyLocation.nullable().optional(),
  modelDisplayName: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  rawDeviceModel: z.string().nullable().optional(),
});

const FindMyClientResponse = z.object({
  content: z.array(RawFindMyDevice).optional().default([]),
  serverContext: z.unknown().optional(),
});

const AccountLoginResponse = z.object({
  dsInfo: z
    .object({
      dsid: z.union([z.number(), z.string()]).optional(),
    })
    .optional(),
  webservices: z
    .object({
      findme: z
        .object({
          url: z.string().url(),
        })
        .optional(),
    })
    .optional(),
});

const SrpInitResponse = z.object({
  b: z.string(),
  c: z.string(),
  iteration: z.number(),
  protocol: z.enum(["s2k", "s2k_fo"]),
  salt: z.string(),
});

type RawFindMyDevice = z.infer<typeof RawFindMyDevice>;
type RawFindMyLocation = z.infer<typeof RawFindMyLocation>;
type FindMyClientResponse = z.infer<typeof FindMyClientResponse>;
type AccountLoginResponse = z.infer<typeof AccountLoginResponse>;

type ICloudWebSession = {
  cookies?: Record<string, string>;
  data?: Partial<Record<SessionDataKey, string>>;
};

type FindMyConfig = {
  appleId: string;
  deviceName?: string;
  password: string;
  webSession?: ICloudWebSession;
};

type SessionDataKey =
  | "account_country"
  | "auth_attributes"
  | "client_id"
  | "dsid"
  | "scnt"
  | "session_id"
  | "session_token"
  | "trust_token";

type AppleHttpResponse = {
  body: string;
  status: number;
};

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

class ICloudWebClient {
  private readonly clientId: string;
  private readonly cookies = new Map<string, string>();
  private readonly sessionData: Partial<Record<SessionDataKey, string>>;

  constructor(private readonly config: FindMyConfig) {
    this.clientId = config.webSession?.data?.client_id ?? `auth-${randomUUID()}`;
    this.sessionData = {
      ...config.webSession?.data,
      client_id: this.clientId,
    };

    for (const [key, value] of Object.entries(config.webSession?.cookies ?? {})) {
      this.cookies.set(key, value);
    }
  }

  async fetchFindMyDevices(): Promise<FindMyClientResponse> {
    const account = await this.authenticate();
    const findmeUrl = account.webservices?.findme?.url;

    if (!findmeUrl) {
      throw new Error("iCloud accountLogin did not return a Find My webservice URL.");
    }

    const init = await this.requestFindMyClient(findmeUrl);
    return this.requestFindMyClient(findmeUrl, init.serverContext);
  }

  private async authenticate(): Promise<AccountLoginResponse> {
    if (this.sessionData.session_token) {
      try {
        return this.accountLogin();
      } catch {
        this.sessionData.session_token = undefined;
      }
    }

    await this.srpAuthenticate();
    return this.accountLogin();
  }

  private async srpAuthenticate(): Promise<void> {
    await this.requestJson("GET", `${AUTH_ENDPOINT}/authorize/signin`, undefined, {
      authVersion: "latest",
      client_id: WIDGET_KEY,
      frame_id: this.clientId,
      iframeid: this.clientId,
      redirect_uri: HOME_ENDPOINT,
      response_mode: "web_message",
      response_type: "code",
      skVersion: "7",
      state: this.clientId,
    });

    const proof = new AppleSrpProof(this.config.appleId, this.config.password);
    const init = await this.requestJson(
      "POST",
      `${AUTH_ENDPOINT}/signin/init`,
      {
        accountName: this.config.appleId,
        a: proof.aPublic.toString("base64"),
        protocols: ["s2k", "s2k_fo"],
      },
      undefined,
      this.authHeaders(),
    );

    const challenge = SrpInitResponse.safeParse(init.json);
    if (!challenge.success) {
      throw new Error("Apple SRP signin/init returned an unexpected response shape.");
    }

    const completeBody = proof.complete(challenge.data, this.sessionData.trust_token);
    const complete = await this.requestJson(
      "POST",
      `${AUTH_ENDPOINT}/signin/complete`,
      completeBody,
      { isRememberMeEnabled: "true" },
      this.authHeaders(),
    );

    if (complete.status === 409) {
      throw new Error("Apple requires two-factor authentication for this iCloud web session.");
    }

    if (!this.sessionData.session_token) {
      throw new Error("Apple signin completed without returning a web session token.");
    }
  }

  private async accountLogin(): Promise<AccountLoginResponse> {
    if (!this.sessionData.session_token) {
      throw new Error("Missing iCloud web session token.");
    }

    const response = await this.requestJson("POST", `${SETUP_ENDPOINT}/accountLogin`, {
      accountCountryCode: this.sessionData.account_country,
      dsWebAuthToken: this.sessionData.session_token,
      extended_login: true,
      trustToken: this.sessionData.trust_token ?? "",
    });

    const parsed = AccountLoginResponse.safeParse(response.json);
    if (!parsed.success) {
      throw new Error("iCloud accountLogin returned an unexpected response shape.");
    }

    const dsid = parsed.data.dsInfo?.dsid;
    if (dsid != null) {
      this.sessionData.dsid = String(dsid);
    }

    return parsed.data;
  }

  private async requestFindMyClient(
    findmeUrl: string,
    serverContext?: unknown,
  ): Promise<FindMyClientResponse> {
    const isRefresh = serverContext != null;
    const url = `${findmeUrl.replace(/\/$/, "")}/fmipservice/client/web/${
      isRefresh ? "refreshClient" : "initClient"
    }`;
    const clientContext: Record<string, unknown> = {
      apiVersion: "3.0",
      appName: "iCloud Find (Web)",
      appVersion: "2.0",
      deviceListVersion: 1,
      fmly: true,
      inactiveTime: 0,
      timezone: "US/Pacific",
      ...(isRefresh ? { selectedDevice: "all", shouldLocate: true } : {}),
    };
    const body = {
      clientContext,
      ...(isRefresh ? { isUpdatingAllLocations: true, serverContext } : {}),
    };

    const response = await this.requestJson("POST", url, body, this.requestParams());
    const parsed = FindMyClientResponse.safeParse(response.json);
    if (!parsed.success) {
      throw new Error("Apple Find My returned an unexpected response shape.");
    }

    return parsed.data;
  }

  private async requestJson(
    method: "GET" | "POST",
    rawUrl: string,
    body?: unknown,
    query?: Record<string, string>,
    headers?: Record<string, string>,
  ): Promise<AppleHttpResponse & { json: unknown }> {
    const response = await this.request(method, rawUrl, body, query, headers);
    const json = parseAppleJson(response.body, rawUrl);

    if (response.status >= 400 && response.status !== 409) {
      throw new Error(
        errorMessageFromJson(json) ?? `Apple iCloud request failed with HTTP ${response.status}.`,
      );
    }

    return {
      ...response,
      json,
    };
  }

  private request(
    method: "GET" | "POST",
    rawUrl: string,
    body?: unknown,
    query?: Record<string, string>,
    headers?: Record<string, string>,
  ): Promise<AppleHttpResponse> {
    const url = new URL(rawUrl);
    for (const [key, value] of Object.entries(query ?? {})) {
      url.searchParams.set(key, value);
    }

    const payload = body === undefined ? undefined : JSON.stringify(body);
    const requestHeaders: Record<string, string> = {
      Accept: "application/json, text/javascript",
      "Content-Type": "application/json",
      Origin: HOME_ENDPOINT,
      Referer: `${HOME_ENDPOINT}/`,
      "User-Agent": USER_AGENT,
      ...headers,
    };

    if (payload) {
      requestHeaders["Content-Length"] = Buffer.byteLength(payload).toString();
    }

    const cookie = this.cookieHeader();
    if (cookie) {
      requestHeaders.Cookie = cookie;
    }

    return new Promise((resolve, reject) => {
      const req = request(
        url,
        {
          headers: requestHeaders,
          method,
          rejectUnauthorized: false,
          timeout: 15_000,
        },
        (res) => {
          const chunks: Buffer[] = [];

          this.updateSessionData(res.headers as Record<string, string | string[] | undefined>);
          this.updateCookies(res.headers["set-cookie"]);

          res.on("data", (chunk: Buffer) => {
            chunks.push(chunk);
          });

          res.on("end", () => {
            resolve({
              body: Buffer.concat(chunks).toString("utf8"),
              status: res.statusCode ?? 0,
            });
          });
        },
      );

      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy(new Error(`Apple iCloud request timed out for ${url.hostname}.`));
      });
      req.end(payload);
    });
  }

  private authHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/json, text/javascript",
      "Content-Type": "application/json",
      Referer: "https://idmsa.apple.com",
      "X-Apple-FD-Client-Info": JSON.stringify({
        F: "",
        L: "en-US",
        U: USER_AGENT,
        V: "1.1",
        Z: "GMT+00:00",
      }),
      "X-Apple-Frame-Id": this.clientId,
      "X-Apple-OAuth-Client-Id": WIDGET_KEY,
      "X-Apple-OAuth-Client-Type": "firstPartyAuth",
      "X-Apple-OAuth-Redirect-URI": HOME_ENDPOINT,
      "X-Apple-OAuth-Require-Grant-Code": "true",
      "X-Apple-OAuth-Response-Mode": "web_message",
      "X-Apple-OAuth-Response-Type": "code",
      "X-Apple-OAuth-State": this.clientId,
      "X-Apple-Widget-Key": WIDGET_KEY,
    };

    if (this.sessionData.scnt) {
      headers.scnt = this.sessionData.scnt;
    }

    if (this.sessionData.session_id) {
      headers["X-Apple-ID-Session-Id"] = this.sessionData.session_id;
    }

    if (this.sessionData.auth_attributes) {
      headers["X-Apple-Auth-Attributes"] = this.sessionData.auth_attributes;
    }

    return headers;
  }

  private requestParams(): Record<string, string> {
    const params: Record<string, string> = {
      clientBuildNumber: CLIENT_BUILD_NUMBER,
      clientId: this.clientId,
      clientMasteringNumber: CLIENT_MASTERING_NUMBER,
    };

    if (this.sessionData.dsid) {
      params.dsid = this.sessionData.dsid;
    }

    return params;
  }

  private updateSessionData(headers: Record<string, string | string[] | undefined>): void {
    const headerMap: Record<string, SessionDataKey> = {
      "x-apple-auth-attributes": "auth_attributes",
      "x-apple-id-account-country": "account_country",
      "x-apple-id-session-id": "session_id",
      "x-apple-session-token": "session_token",
      "x-apple-twosv-trust-token": "trust_token",
      scnt: "scnt",
    };

    for (const [header, key] of Object.entries(headerMap)) {
      const value = headers[header];
      const firstValue = Array.isArray(value) ? value[0] : value;
      if (firstValue) {
        this.sessionData[key] = firstValue;
      }
    }
  }

  private updateCookies(setCookie: string | string[] | undefined): void {
    const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];

    for (const cookie of cookies) {
      const [pair] = cookie.split(";");
      const separator = pair?.indexOf("=") ?? -1;
      if (!pair || separator < 1) {
        continue;
      }

      this.cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
  }

  private cookieHeader(): string | undefined {
    if (this.cookies.size === 0) {
      return undefined;
    }

    return [...this.cookies.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
  }
}

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

class AppleSrpProof {
  readonly aPublic: Buffer;

  private readonly privateKey: bigint;
  private readonly publicKey: bigint;

  constructor(
    private readonly appleId: string,
    private readonly password: string,
  ) {
    this.privateKey = AppleSrpProof.bufferToBigInt(randomBytes(SRP_WIDTH));
    this.publicKey = AppleSrpProof.modPow(SRP_G, this.privateKey, SRP_N);
    this.aPublic = AppleSrpProof.bigIntToBuffer(this.publicKey);
  }

  complete(challenge: z.infer<typeof SrpInitResponse>, trustToken: string | undefined) {
    const salt = Buffer.from(challenge.salt, "base64");
    const serverPublicKey = AppleSrpProof.bufferToBigInt(Buffer.from(challenge.b, "base64"));
    const multiplier = AppleSrpProof.bufferToBigInt(AppleSrpProof.hashPadded(SRP_N, SRP_G));
    const scramblingParameter = AppleSrpProof.bufferToBigInt(
      AppleSrpProof.hashPadded(this.publicKey, serverPublicKey),
    );
    const passwordDigest = createHash("sha256").update(this.password, "utf8").digest();
    const pbkdfInput =
      challenge.protocol === "s2k_fo"
        ? Buffer.from(passwordDigest.toString("hex"))
        : passwordDigest;
    const encodedPassword = pbkdf2Sync(pbkdfInput, salt, challenge.iteration, 32, "sha256");
    const privateKey = AppleSrpProof.bufferToBigInt(
      AppleSrpProof.hash(
        salt,
        AppleSrpProof.hash(Buffer.concat([Buffer.from(":"), encodedPassword])),
      ),
    );
    const verifier = AppleSrpProof.modPow(SRP_G, privateKey, SRP_N);
    const sharedSecretBase = AppleSrpProof.positiveMod(
      serverPublicKey - multiplier * verifier,
      SRP_N,
    );
    const sharedSecret = AppleSrpProof.modPow(
      sharedSecretBase,
      this.privateKey + scramblingParameter * privateKey,
      SRP_N,
    );
    const sessionKey = AppleSrpProof.hash(AppleSrpProof.bigIntToBuffer(sharedSecret));
    const clientProof = AppleSrpProof.hash(
      AppleSrpProof.hNxorg(),
      AppleSrpProof.hash(Buffer.from(this.appleId)),
      salt,
      AppleSrpProof.bigIntToBuffer(this.publicKey),
      AppleSrpProof.bigIntToBuffer(serverPublicKey),
      sessionKey,
    );
    const serverProof = AppleSrpProof.hash(
      AppleSrpProof.bigIntToBuffer(this.publicKey),
      clientProof,
      sessionKey,
    );

    return {
      accountName: this.appleId,
      c: challenge.c,
      m1: clientProof.toString("base64"),
      m2: serverProof.toString("base64"),
      rememberMe: true,
      trustTokens: trustToken ? [trustToken] : [],
    };
  }

  private static hash(...parts: Buffer[]): Buffer {
    const hasher = createHash("sha256");
    for (const part of parts) {
      hasher.update(part);
    }
    return hasher.digest();
  }

  private static hashPadded(...values: bigint[]): Buffer {
    return AppleSrpProof.hash(
      ...values.map((value) =>
        AppleSrpProof.leftPad(AppleSrpProof.bigIntToBuffer(value), SRP_WIDTH),
      ),
    );
  }

  private static hNxorg(): Buffer {
    const hashN = AppleSrpProof.hash(AppleSrpProof.bigIntToBuffer(SRP_N));
    const hashG = AppleSrpProof.hash(
      AppleSrpProof.leftPad(AppleSrpProof.bigIntToBuffer(SRP_G), SRP_WIDTH),
    );
    return Buffer.from(hashN.map((byte, index) => byte ^ hashG[index]));
  }

  private static modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
    if (modulus === BigInt(1)) {
      return BigInt(0);
    }

    let result = BigInt(1);
    let current = AppleSrpProof.positiveMod(base, modulus);
    let power = exponent;

    while (power > BigInt(0)) {
      if (power % BigInt(2) === BigInt(1)) {
        result = (result * current) % modulus;
      }

      power /= BigInt(2);
      current = (current * current) % modulus;
    }

    return result;
  }

  private static positiveMod(value: bigint, modulus: bigint): bigint {
    const result = value % modulus;
    return result >= BigInt(0) ? result : result + modulus;
  }

  private static bufferToBigInt(buffer: Buffer): bigint {
    if (buffer.length === 0) {
      return BigInt(0);
    }

    return BigInt(`0x${buffer.toString("hex")}`);
  }

  private static bigIntToBuffer(value: bigint): Buffer {
    if (value === BigInt(0)) {
      return Buffer.alloc(0);
    }

    let hex = value.toString(16);
    if (hex.length % 2) {
      hex = `0${hex}`;
    }

    return Buffer.from(hex, "hex");
  }

  private static leftPad(buffer: Buffer, width: number): Buffer {
    if (buffer.length >= width) {
      return buffer;
    }

    return Buffer.concat([Buffer.alloc(width - buffer.length), buffer]);
  }
}

function parseAppleJson(text: string, context: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Apple iCloud returned non-JSON data for ${new URL(context).pathname}.`);
  }
}

function errorMessageFromJson(json: unknown): string | undefined {
  if (!json || typeof json !== "object") {
    return undefined;
  }

  const data = json as Record<string, unknown>;
  for (const key of ["errorMessage", "errorReason", "error"]) {
    const value = data[key];
    if (typeof value === "string") {
      return value;
    }
  }

  return undefined;
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
