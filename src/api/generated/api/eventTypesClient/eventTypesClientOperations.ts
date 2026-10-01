import { parse } from "uri-template";
import type { EventTypesClientContext } from "./eventTypesClientContext.js";
import { createRestError } from "../../helpers/error.js";
import type { OperationOptions } from "../../helpers/interfaces.js";
import {
  jsonCreateEventTypeRequestToTransportTransform,
  jsonErrorResponseToApplicationTransform,
  jsonEventTypeToApplicationTransform,
  jsonUpdateEventTypeRequestToTransportTransform,
} from "../../models/internal/serializers.js";
import type {
  CreateEventTypeRequest,
  ErrorResponse,
  EventType,
  UpdateEventTypeRequest,
} from "../../models/models.js";

export interface ListEventTypesOptions extends OperationOptions {}
export async function listEventTypes(
  client: EventTypesClientContext,
  slug: string,
  options?: ListEventTypesOptions,
): Promise<Array<EventType> | ErrorResponse> {
  const path = parse("/api/v1/hosts/{slug}/event-types").expand({
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
export interface CreateEventTypeOptions extends OperationOptions {}
export async function createEventType(
  client: EventTypesClientContext,
  slug: string,
  body: CreateEventTypeRequest,
  options?: CreateEventTypeOptions,
): Promise<ErrorResponse | EventType> {
  const path = parse("/api/v1/hosts/{slug}/event-types").expand({
    slug: slug
  });
  const httpRequestOptions = {
    headers: {},body: jsonCreateEventTypeRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorResponseToApplicationTransform(response.body)!;
  }
  if (+response.status === 201 && response.headers["content-type"]?.includes("application/json")) {
    return jsonEventTypeToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface UpdateEventTypeOptions extends OperationOptions {}
export async function updateEventType(
  client: EventTypesClientContext,
  slug: string,
  eventTypeId: string,
  body: UpdateEventTypeRequest,
  options?: UpdateEventTypeOptions,
): Promise<EventType | ErrorResponse> {
  const path = parse("/api/v1/hosts/{slug}/event-types/{eventTypeId}").expand({
    slug: slug,
    eventTypeId: eventTypeId
  });
  const httpRequestOptions = {
    headers: {},body: jsonUpdateEventTypeRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).patch(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return response.body!;
  }
  throw createRestError(response);
}
;
export interface DeleteEventTypeOptions extends OperationOptions {}
export async function deleteEventType(
  client: EventTypesClientContext,
  slug: string,
  eventTypeId: string,
  options?: DeleteEventTypeOptions,
): Promise<ErrorResponse | void> {
  const path = parse("/api/v1/hosts/{slug}/event-types/{eventTypeId}").expand({
    slug: slug,
    eventTypeId: eventTypeId
  });
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).delete(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorResponseToApplicationTransform(response.body)!;
  }
  if (+response.status === 204 && !response.body) {
    return;
  }
  throw createRestError(response);
}
;
