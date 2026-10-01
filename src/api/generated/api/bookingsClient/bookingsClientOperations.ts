import { parse } from "uri-template";
import type { BookingsClientContext } from "./bookingsClientContext.js";
import { createRestError } from "../../helpers/error.js";
import type { OperationOptions } from "../../helpers/interfaces.js";
import {
  jsonCancelBookingRequestToTransportTransform,
  jsonRescheduleBookingRequestToTransportTransform,
} from "../../models/internal/serializers.js";
import type {
  Booking,
  CancelBookingRequest,
  ErrorResponse,
  RescheduleBookingRequest,
} from "../../models/models.js";

export interface GetBookingOptions extends OperationOptions {}
export async function getBooking(
  client: BookingsClientContext,
  bookingId: string,
  options?: GetBookingOptions,
): Promise<Booking | ErrorResponse> {
  const path = parse("/api/v1/bookings/{bookingId}").expand({
    bookingId: bookingId
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
export interface CancelBookingOptions extends OperationOptions {
  body?: CancelBookingRequest
}
export async function cancelBooking(
  client: BookingsClientContext,
  bookingId: string,
  options?: CancelBookingOptions,
): Promise<Booking | ErrorResponse> {
  const path = parse("/api/v1/bookings/{bookingId}/cancel").expand({
    bookingId: bookingId
  });
  const httpRequestOptions = {
    headers: {

    },body: jsonCancelBookingRequestToTransportTransform(options?.body),
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return response.body!;
  }
  throw createRestError(response);
}
;
export interface RescheduleBookingOptions extends OperationOptions {}
export async function rescheduleBooking(
  client: BookingsClientContext,
  bookingId: string,
  body: RescheduleBookingRequest,
  options?: RescheduleBookingOptions,
): Promise<Booking | ErrorResponse> {
  const path = parse("/api/v1/bookings/{bookingId}/reschedule").expand({
    bookingId: bookingId
  });
  const httpRequestOptions = {
    headers: {},body: jsonRescheduleBookingRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return response.body!;
  }
  throw createRestError(response);
}
;
