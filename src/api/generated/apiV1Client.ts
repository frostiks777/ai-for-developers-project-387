import {
  type ApiV1ClientContext,
  type ApiV1ClientOptions,
  createApiV1ClientContext,
} from "./api/apiV1ClientContext.js";
import {
  getHostSettings,
  type GetHostSettingsOptions,
  listSlots,
  type ListSlotsOptions,
} from "./api/apiV1ClientOperations.js";
import {
  type AvailabilityClientContext,
  type AvailabilityClientOptions,
  createAvailabilityClientContext,
} from "./api/availabilityClient/availabilityClientContext.js";
import {
  getAvailability,
  type GetAvailabilityOptions,
  updateAvailability,
  type UpdateAvailabilityOptions,
} from "./api/availabilityClient/availabilityClientOperations.js";
import {
  type BookingsClientContext,
  type BookingsClientOptions,
  createBookingsClientContext,
} from "./api/bookingsClient/bookingsClientContext.js";
import {
  cancelBooking,
  type CancelBookingOptions,
  getBooking,
  type GetBookingOptions,
  rescheduleBooking,
  type RescheduleBookingOptions,
} from "./api/bookingsClient/bookingsClientOperations.js";
import {
  createEventTypesClientContext,
  type EventTypesClientContext,
  type EventTypesClientOptions,
} from "./api/eventTypesClient/eventTypesClientContext.js";
import {
  createEventType,
  type CreateEventTypeOptions,
  deleteEventType,
  type DeleteEventTypeOptions,
  listEventTypes,
  type ListEventTypesOptions,
  updateEventType,
  type UpdateEventTypeOptions,
} from "./api/eventTypesClient/eventTypesClientOperations.js";
import {
  createHostBookingsClientContext,
  type HostBookingsClientContext,
  type HostBookingsClientOptions,
} from "./api/hostBookingsClient/hostBookingsClientContext.js";
import {
  createBooking,
  type CreateBookingOptions,
  listHostBookings,
  type ListHostBookingsOptions,
} from "./api/hostBookingsClient/hostBookingsClientOperations.js";
import {
  createHostsClientContext,
  type HostsClientContext,
  type HostsClientOptions,
} from "./api/hostsClient/hostsClientContext.js";
import {
  createHost,
  type CreateHostOptions,
  listHosts,
  type ListHostsOptions,
} from "./api/hostsClient/hostsClientOperations.js";
import {
  createTimeBlocksClientContext,
  type TimeBlocksClientContext,
  type TimeBlocksClientOptions,
} from "./api/timeBlocksClient/timeBlocksClientContext.js";
import {
  createTimeBlock,
  type CreateTimeBlockOptions,
  deleteTimeBlock,
  type DeleteTimeBlockOptions,
  listTimeBlocks,
  type ListTimeBlocksOptions,
} from "./api/timeBlocksClient/timeBlocksClientOperations.js";
import type {
  CreateBookingRequest,
  CreateEventTypeRequest,
  CreateHostRequest,
  CreateTimeBlockRequest,
  RescheduleBookingRequest,
  UpdateAvailabilityRequest,
  UpdateEventTypeRequest,
} from "./models/models.js";

export class ApiV1Client {
  #context: ApiV1ClientContext
  hostsClient: HostsClient;
  eventTypesClient: EventTypesClient;
  availabilityClient: AvailabilityClient;
  hostBookingsClient: HostBookingsClient;
  timeBlocksClient: TimeBlocksClient;
  bookingsClient: BookingsClient
  constructor(options?: ApiV1ClientOptions) {
    this.#context = createApiV1ClientContext(options);
    this.hostsClient = new HostsClient(options);;this
      .eventTypesClient = new EventTypesClient(options);;this
      .availabilityClient = new AvailabilityClient(options);;this
      .hostBookingsClient = new HostBookingsClient(options);;this
      .timeBlocksClient = new TimeBlocksClient(options);;this
      .bookingsClient = new BookingsClient(options);
  }
  async getHostSettings(slug: string, options?: GetHostSettingsOptions) {
    return getHostSettings(this.#context, slug, options);
  };
  async listSlots(slug: string, options?: ListSlotsOptions) {
    return listSlots(this.#context, slug, options);
  }
}
export class BookingsClient {
  #context: BookingsClientContext
  constructor(options?: BookingsClientOptions) {
    this.#context = createBookingsClientContext(options);

  }
  async getBooking(bookingId: string, options?: GetBookingOptions) {
    return getBooking(this.#context, bookingId, options);
  };
  async cancelBooking(bookingId: string, options?: CancelBookingOptions) {
    return cancelBooking(this.#context, bookingId, options);
  };
  async rescheduleBooking(
    bookingId: string,
    body: RescheduleBookingRequest,
    options?: RescheduleBookingOptions,
  ) {
    return rescheduleBooking(this.#context, bookingId, body, options);
  }
}
export class TimeBlocksClient {
  #context: TimeBlocksClientContext
  constructor(options?: TimeBlocksClientOptions) {
    this.#context = createTimeBlocksClientContext(options);

  }
  async listTimeBlocks(slug: string, options?: ListTimeBlocksOptions) {
    return listTimeBlocks(this.#context, slug, options);
  };
  async createTimeBlock(
    slug: string,
    body: CreateTimeBlockRequest,
    options?: CreateTimeBlockOptions,
  ) {
    return createTimeBlock(this.#context, slug, body, options);
  };
  async deleteTimeBlock(
    slug: string,
    blockId: string,
    options?: DeleteTimeBlockOptions,
  ) {
    return deleteTimeBlock(this.#context, slug, blockId, options);
  }
}
export class HostBookingsClient {
  #context: HostBookingsClientContext
  constructor(options?: HostBookingsClientOptions) {
    this.#context = createHostBookingsClientContext(options);

  }
  async listHostBookings(slug: string, options?: ListHostBookingsOptions) {
    return listHostBookings(this.#context, slug, options);
  };
  async createBooking(
    slug: string,
    body: CreateBookingRequest,
    options?: CreateBookingOptions,
  ) {
    return createBooking(this.#context, slug, body, options);
  }
}
export class AvailabilityClient {
  #context: AvailabilityClientContext
  constructor(options?: AvailabilityClientOptions) {
    this.#context = createAvailabilityClientContext(options);

  }
  async getAvailability(slug: string, options?: GetAvailabilityOptions) {
    return getAvailability(this.#context, slug, options);
  };
  async updateAvailability(
    slug: string,
    body: UpdateAvailabilityRequest,
    options?: UpdateAvailabilityOptions,
  ) {
    return updateAvailability(this.#context, slug, body, options);
  }
}
export class EventTypesClient {
  #context: EventTypesClientContext
  constructor(options?: EventTypesClientOptions) {
    this.#context = createEventTypesClientContext(options);

  }
  async listEventTypes(slug: string, options?: ListEventTypesOptions) {
    return listEventTypes(this.#context, slug, options);
  };
  async createEventType(
    slug: string,
    body: CreateEventTypeRequest,
    options?: CreateEventTypeOptions,
  ) {
    return createEventType(this.#context, slug, body, options);
  };
  async updateEventType(
    slug: string,
    eventTypeId: string,
    body: UpdateEventTypeRequest,
    options?: UpdateEventTypeOptions,
  ) {
    return updateEventType(this.#context, slug, eventTypeId, body, options);
  };
  async deleteEventType(
    slug: string,
    eventTypeId: string,
    options?: DeleteEventTypeOptions,
  ) {
    return deleteEventType(this.#context, slug, eventTypeId, options);
  }
}
export class HostsClient {
  #context: HostsClientContext
  constructor(options?: HostsClientOptions) {
    this.#context = createHostsClientContext(options);

  }
  async listHosts(options?: ListHostsOptions) {
    return listHosts(this.#context, options);
  };
  async createHost(body: CreateHostRequest, options?: CreateHostOptions) {
    return createHost(this.#context, body, options);
  }
}
