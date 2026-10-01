import { parse } from "uri-template";
import type { AvailabilityClientContext } from "./availabilityClientContext.js";
import { createRestError } from "../../helpers/error.js";
import type { OperationOptions } from "../../helpers/interfaces.js";
import {
  jsonUpdateAvailabilityRequestToTransportTransform,
} from "../../models/internal/serializers.js";
import type {
  AvailabilitySettings,
  ErrorResponse,
  UpdateAvailabilityRequest,
} from "../../models/models.js";

export interface GetAvailabilityOptions extends OperationOptions {}
export async function getAvailability(
  client: AvailabilityClientContext,
  slug: string,
  options?: GetAvailabilityOptions,
): Promise<AvailabilitySettings | ErrorResponse> {
  const path = parse("/api/v1/hosts/{slug}/availability").expand({
    slug: slug
  });
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return response.body!;
  }
  throw createRestError(response);
}
;
export interface UpdateAvailabilityOptions extends OperationOptions {}
export async function updateAvailability(
  client: AvailabilityClientContext,
  slug: string,
  body: UpdateAvailabilityRequest,
  options?: UpdateAvailabilityOptions,
): Promise<AvailabilitySettings | ErrorResponse> {
  const path = parse("/api/v1/hosts/{slug}/availability").expand({
    slug: slug
  });
  const httpRequestOptions = {
    headers: {},body: jsonUpdateAvailabilityRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).put(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return response.body!;
  }
  throw createRestError(response);
}
;
