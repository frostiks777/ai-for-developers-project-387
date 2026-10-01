import { parse } from "uri-template";
import type { HostBookingsClientContext } from "./hostBookingsClientContext.js";
import { createRestError } from "../../helpers/error.js";
import type { OperationOptions } from "../../helpers/interfaces.js";
import {
  jsonBookingToApplicationTransform,
  jsonCreateBookingRequestToTransportTransform,
  jsonErrorResponseToApplicationTransform,
} from "../../models/internal/serializers.js";
import type {
  Booking,
  CreateBookingRequest,
  ErrorResponse,
} from "../../models/models.js";

export interface ListHostBookingsOptions extends OperationOptions {}
export async function listHostBookings(
  client: HostBookingsClientContext,
  slug: string,
  options?: ListHostBookingsOptions,
): Promise<Array<Booking> | ErrorResponse> {
  const path = parse("/api/v1/hosts/{slug}/bookings").expand({
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
export interface CreateBookingOptions extends OperationOptions {
  idempotencyKey?: string
}
export async function createBooking(
  client: HostBookingsClientContext,
  slug: string,
  body: CreateBookingRequest,
  options?: CreateBookingOptions,
): Promise<ErrorResponse | Booking> {
  const path = parse("/api/v1/hosts/{slug}/bookings").expand({
    slug: slug
  });
  const httpRequestOptions = {
    headers: {
      ...(options?.idempotencyKey && {"idempotency-key": options.idempotencyKey})
    },body: jsonCreateBookingRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorResponseToApplicationTransform(response.body)!;
  }
  if (+response.status === 201 && response.headers["content-type"]?.includes("application/json")) {
    return jsonBookingToApplicationTransform(response.body)!;
  }
  if (+response.status === 429 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
