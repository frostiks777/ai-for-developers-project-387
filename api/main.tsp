import "@typespec/http";
import "@typespec/openapi3";

using TypeSpec.Http;

@service(#{
  title: "Call Calendar API",
})
@server("http://localhost:3000", "Local development")
namespace CallCalendar;

// ---------------------------------------------------------------------------
// Скаляры и общие модели
// ---------------------------------------------------------------------------

/** Момент времени в UTC, ISO 8601 с миллисекундами и суффиксом `Z`; для отображения — поле timeZone (IANA). */
@format("date-time")
scalar UtcDateTime extends string;

/** Локальная дата (YYYY-MM-DD) в поясе хоста. */
@format("date")
scalar LocalDate extends string;

alias HostSlug = string;

enum LocationType {
  online,
  offline,
  phone,
}

enum BookingStatus {
  confirmed,
  cancelled,
}

/** Единая модель ошибки для всех не-2xx ответов. */
model ApiError {
  @doc("Код ошибки для программной обработки.")
  code: ErrorCode;
  @doc("Человекочитаемое сообщение.")
  message: string;
  @doc("Дополнительные детали (например, ошибки полей).")
  details?: Record<unknown>;
}

/** Тело ответа с ошибкой: конверт `{ error: ApiError }`. */
model ErrorResponse {
  error: ApiError;
}

union ErrorCode {
  "VALIDATION_ERROR",
  "NOT_FOUND",
  "SLOT_TAKEN",
  "CONFLICT",
  "CAPTCHA_FAILED",
  "RATE_LIMITED",
}

/** Публичные настройки CAPTCHA для формы записи (ADR-0025). */
model CaptchaSettings {
  @doc("Провайдер защиты от ботов. Сейчас всегда turnstile.")
  provider: "turnstile";
  @doc("true — виджет обязателен и токен проверяется; false — CAPTCHA выключена.")
  required: boolean;
  @doc("Публичный site key. null, если CAPTCHA выключена.")
  siteKey: string | null;
}

/** Публичные настройки организатора по slug. */
model HostSettings {
  slug: HostSlug;
  name: string;
  @doc("IANA-пояс хоста, например Europe/Moscow.")
  timeZone: string;
  @doc("Параметры CAPTCHA: провайдер, обязательность и публичный site key.")
  captcha: CaptchaSettings;
}

/** Организатор (хост) в мульти-хост-модели. */
model Host {
  @doc("Стабильный UUID хоста (используется в публичных ссылках /book/:id).")
  id: string;
  slug: string;
  name: string;
  @doc("IANA-пояс хоста.")
  timeZone: string;
}

model CreateHostRequest {
  slug: string;
  name: string;
  @doc("Необязательный IANA-пояс; по умолчанию UTC.")
  timeZone?: string;
}

// ---------------------------------------------------------------------------
// Типы встреч
// ---------------------------------------------------------------------------

model EventType {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  @doc("Длительность встречи в минутах (MVP: 30).")
  durationMin: int32;
  locationType: LocationType;
  @doc("Активен ли тип для записи гостем.")
  isActive: boolean;
}

model CreateEventTypeRequest {
  slug: string;
  title: string;
  description?: string;
  durationMin: int32;
  locationType: LocationType;
  isActive?: boolean;
}

model UpdateEventTypeRequest {
  title?: string;
  description?: string;
  durationMin?: int32;
  locationType?: LocationType;
  isActive?: boolean;
}

// ---------------------------------------------------------------------------
// Доступность
// ---------------------------------------------------------------------------

/** Непрерывный интервал записи внутри дня недели (минуты от полуночи, пояс хоста). */
model AvailabilityRange {
  @doc("День недели: 1 — понедельник, 7 — воскресенье.")
  @minValue(1)
  @maxValue(7)
  weekday: int32;
  @minValue(0)
  @maxValue(1440)
  startMinute: int32;
  @minValue(0)
  @maxValue(1440)
  endMinute: int32;
}

model AvailabilitySettings {
  timeZone: string;
  slotDurationMin: int32;
  @doc("Буфер до начала встречи, минуты.")
  bufferBeforeMin: int32;
  @doc("Буфер после встречи, минуты.")
  bufferAfterMin: int32;
  minNoticeMin: int32;
  horizonDays: int32;
  ranges: AvailabilityRange[];
}

model UpdateAvailabilityRequest {
  timeZone?: string;
  slotDurationMin?: int32;
  bufferBeforeMin?: int32;
  bufferAfterMin?: int32;
  minNoticeMin?: int32;
  horizonDays?: int32;
  ranges?: AvailabilityRange[];
}

// ---------------------------------------------------------------------------
// Слоты
// ---------------------------------------------------------------------------

model Slot {
  @doc("Идентификатор слота (используется до перехода брони на startAt).")
  id: int32;
  @doc("Начало слота (UTC ISO 8601).")
  startAt: UtcDateTime;
  durationMin: int32;
  @doc("Свободен ли слот для записи активной бронью.")
  available: boolean;
}

model AvailabilityDay {
  @doc("Дата фильтра, если была запрошена.")
  date?: LocalDate | null;
  @doc("IANA-пояс, к которому относятся startAt слотов.")
  timeZone: string;
  slots: Slot[];
}

// ---------------------------------------------------------------------------
// Бронирования
// ---------------------------------------------------------------------------

model Booking {
  @doc("UUID — публичный идентификатор для ссылок отмены и переноса.")
  id: string;
  hostSlug: HostSlug;
  eventTypeId: string;
  @doc("Начало встречи (UTC ISO 8601).")
  startAt: UtcDateTime;
  endAt: UtcDateTime;
  timeZone: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  clientNotes?: string | null;
  @doc("Приглашённые участники (email).")
  clientGuests?: string[] | null;
  @doc("Согласие на обработку персональных данных.")
  consentAccepted: boolean;
  status: BookingStatus;
  @doc("Причина отмены, если бронь отменена.")
  cancellationReason?: string | null;
  createdAt: string;
}

model CreateBookingRequest {
  eventTypeId: string;
  @doc("Желаемое начало слота (UTC ISO 8601).")
  startAt: UtcDateTime;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientNotes?: string;
  @doc("Приглашённые участники (email), необязательно.")
  guests?: string[];
  @doc("Согласие на обработку персональных данных (обязательно).")
  consentAccepted: boolean;
  @doc("Одноразовый токен Cloudflare Turnstile. Обязателен, когда CAPTCHA включена.")
  captchaToken?: string;
}

model RescheduleBookingRequest {
  @doc("Новое начало слота (UTC ISO 8601).")
  startAt: UtcDateTime;
}

model CancelBookingRequest {
  @doc("Необязательная причина отмены.")
  reason?: string;
}

// ---------------------------------------------------------------------------
// Блокировки времени (отпуск, личные дела)
// ---------------------------------------------------------------------------

/** Интервал, в который организатор не принимает записи. */
model TimeBlock {
  id: string;
  @doc("Начало блокировки (UTC ISO 8601).")
  startAt: UtcDateTime;
  @doc("Конец блокировки (UTC ISO 8601).")
  endAt: UtcDateTime;
  @doc("Необязательная причина блокировки.")
  reason?: string | null;
  createdAt: string;
}

model CreateTimeBlockRequest {
  startAt: UtcDateTime;
  endAt: UtcDateTime;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Операции
// ---------------------------------------------------------------------------

@route("/api/v1")
namespace ApiV1 {
  @route("/hosts")
  namespace Hosts {
    @get
    op listHosts(): Host[] | ErrorResponse;

    @post
    op createHost(
      @body body: CreateHostRequest,
    ): { @statusCode statusCode: 201; @body body: Host } | ErrorResponse;
  }

  @route("/hosts/{slug}/settings")
  @get
  op getHostSettings(@path slug: HostSlug): HostSettings | ErrorResponse;

  @route("/hosts/{slug}/event-types")
  namespace EventTypes {
    @get
    op listEventTypes(@path slug: HostSlug): EventType[] | ErrorResponse;

    @post
    op createEventType(
      @path slug: HostSlug,
      @body body: CreateEventTypeRequest,
    ): { @statusCode statusCode: 201; @body body: EventType } | ErrorResponse;

    @route("/{eventTypeId}")
    @patch
    op updateEventType(
      @path slug: HostSlug,
      @path eventTypeId: string,
      @body body: UpdateEventTypeRequest,
    ): EventType | ErrorResponse;

    @route("/{eventTypeId}")
    @delete
    op deleteEventType(
      @path slug: HostSlug,
      @path eventTypeId: string,
    ): { @statusCode statusCode: 204 } | ErrorResponse;
  }

  @route("/hosts/{slug}/availability")
  namespace Availability {
    @get
    op getAvailability(@path slug: HostSlug): AvailabilitySettings | ErrorResponse;

    @put
    op updateAvailability(
      @path slug: HostSlug,
      @body body: UpdateAvailabilityRequest,
    ): AvailabilitySettings | ErrorResponse;
  }

  @route("/hosts/{slug}/slots")
  @get
  op listSlots(
    @path slug: HostSlug,
    @query date?: LocalDate,
    @query eventTypeId?: string,
  ): AvailabilityDay | ErrorResponse;

  @route("/hosts/{slug}/bookings")
  namespace HostBookings {
    @get
    op listHostBookings(@path slug: HostSlug): Booking[] | ErrorResponse;

    @post
    op createBooking(
      @path slug: HostSlug,
      @header("Idempotency-Key") idempotencyKey?: string,
      @body body: CreateBookingRequest,
    ): { @statusCode statusCode: 201; @body body: Booking } | { @statusCode statusCode: 429; @body body: ErrorResponse } | ErrorResponse;
  }

  @route("/hosts/{slug}/blocks")
  namespace TimeBlocks {
    @get
    op listTimeBlocks(@path slug: HostSlug): TimeBlock[] | ErrorResponse;

    @post
    op createTimeBlock(
      @path slug: HostSlug,
      @body body: CreateTimeBlockRequest,
    ): { @statusCode statusCode: 201; @body body: TimeBlock } | ErrorResponse;

    @route("/{blockId}")
    @delete
    op deleteTimeBlock(
      @path slug: HostSlug,
      @path blockId: string,
    ): { @statusCode statusCode: 204 } | ErrorResponse;
  }

  @route("/bookings/{bookingId}")
  namespace Bookings {
    @get
    op getBooking(@path bookingId: string): Booking | ErrorResponse;

    @route("/cancel")
    @post
    op cancelBooking(
      @path bookingId: string,
      @body body?: CancelBookingRequest,
    ): Booking | ErrorResponse;

    @route("/reschedule")
    @post
    op rescheduleBooking(
      @path bookingId: string,
      @body body: RescheduleBookingRequest,
    ): Booking | ErrorResponse;
  }
}
