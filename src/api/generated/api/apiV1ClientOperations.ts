import { parse } from "uri-template";
import type { ApiV1ClientContext } from "./apiV1ClientContext.js";
import { createRestError } from "../helpers/error.js";
import type { OperationOptions } from "../helpers/interfaces.js";
import type {
  AvailabilityDay,
  ErrorResponse,
  HostSettings,
} from "../models/models.js";

export interface GetHostSettingsOptions extends OperationOptions {}
export async function getHostSettings(
  client: ApiV1ClientContext,
  slug: string,
  options?: GetHostSettingsOptions,
): Promise<HostSettings | ErrorResponse> {
  const path = parse("/api/v1/hosts/{slug}/settings").expand({
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
export interface ListSlotsOptions extends OperationOptions {
  date?: string
  eventTypeId?: string
}
export async function listSlots(
  client: ApiV1ClientContext,
  slug: string,
  options?: ListSlotsOptions,
): Promise<AvailabilityDay | ErrorResponse> {
  const path = parse("/api/v1/hosts/{slug}/slots{?date,eventTypeId}").expand({
    slug: slug,
    ...(options?.date && {date: options.date}),
    ...(options?.eventTypeId && {eventTypeId: options.eventTypeId})
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
