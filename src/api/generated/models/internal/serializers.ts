import type {
  ApiError,
  AvailabilityDay,
  AvailabilityRange,
  AvailabilitySettings,
  Booking,
  CancelBookingRequest,
  CaptchaSettings,
  CreateBookingRequest,
  CreateEventTypeRequest,
  CreateHostRequest,
  CreateTimeBlockRequest,
  ErrorCode,
  ErrorResponse,
  EventType,
  Host,
  HostSettings,
  RescheduleBookingRequest,
  Slot,
  TimeBlock,
  UpdateAvailabilityRequest,
  UpdateEventTypeRequest,
} from "../models.js";

export function decodeBase64(value: string): Uint8Array | undefined {
  if(!value) {
    return value as any;
  }
  // Normalize Base64URL to Base64
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
    .padEnd(value.length + (4 - (value.length % 4)) % 4, '=');

  return new Uint8Array(Buffer.from(base64, 'base64'));
}export function encodeUint8Array(
  value: Uint8Array | undefined | null,
  encoding: BufferEncoding,
): string | undefined {
  if (!value) {
    return value as any;
  }
  return Buffer.from(value).toString(encoding);
}export function dateDeserializer(date?: string | null): Date {
  if (!date) {
    return date as any;
  }

  return new Date(date);
}export function dateRfc7231Deserializer(date?: string | null): Date {
  if (!date) {
    return date as any;
  }

  return new Date(date);
}export function dateRfc3339Serializer(date?: Date | null): string {
  if (!date) {
    return date as any
  }

  return date.toISOString();
}export function dateRfc7231Serializer(date?: Date | null): string {
  if (!date) {
    return date as any;
  }

  return date.toUTCString();
}export function dateUnixTimestampSerializer(date?: Date | null): number {
  if (!date) {
    return date as any;
  }

  return Math.floor(date.getTime() / 1000);
}export function dateUnixTimestampDeserializer(date?: number | null): Date {
  if (!date) {
    return date as any;
  }

  return new Date(date * 1000);
}export function cancelBookingPayloadToTransport(
  payload: CancelBookingRequest,
) {
  return jsonCancelBookingRequestToTransportTransform(payload)!;
}export function rescheduleBookingPayloadToTransport(
  payload: RescheduleBookingRequest,
) {
  return jsonRescheduleBookingRequestToTransportTransform(payload)!;
}export function createTimeBlockPayloadToTransport(
  payload: CreateTimeBlockRequest,
) {
  return jsonCreateTimeBlockRequestToTransportTransform(payload)!;
}export function createBookingPayloadToTransport(
  payload: CreateBookingRequest,
) {
  return jsonCreateBookingRequestToTransportTransform(payload)!;
}export function updateAvailabilityPayloadToTransport(
  payload: UpdateAvailabilityRequest,
) {
  return jsonUpdateAvailabilityRequestToTransportTransform(payload)!;
}export function createEventTypePayloadToTransport(
  payload: CreateEventTypeRequest,
) {
  return jsonCreateEventTypeRequestToTransportTransform(payload)!;
}export function updateEventTypePayloadToTransport(
  payload: UpdateEventTypeRequest,
) {
  return jsonUpdateEventTypeRequestToTransportTransform(payload)!;
}export function createHostPayloadToTransport(payload: CreateHostRequest) {
  return jsonCreateHostRequestToTransportTransform(payload)!;
}export function jsonArrayHostToTransportTransform(
  items_?: Array<Host> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonHostToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayHostToApplicationTransform(
  items_?: any,
): Array<Host> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonHostToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonHostToTransportTransform(input_?: Host | null): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,slug: input_.slug,name: input_.name,timeZone: input_.timeZone
  }!;
}export function jsonHostToApplicationTransform(input_?: any): Host {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,slug: input_.slug,name: input_.name,timeZone: input_.timeZone
  }!;
}export function jsonErrorResponseToTransportTransform(
  input_?: ErrorResponse | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    error: jsonApiErrorToTransportTransform(input_.error)
  }!;
}export function jsonErrorResponseToApplicationTransform(
  input_?: any,
): ErrorResponse {
  if(!input_) {
    return input_ as any;
  }
    return {
    error: jsonApiErrorToApplicationTransform(input_.error)
  }!;
}export function jsonApiErrorToTransportTransform(
  input_?: ApiError | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: jsonErrorCodeToTransportTransform(input_.code),message: input_.message,details: jsonRecordUnknownToTransportTransform(input_.details)
  }!;
}export function jsonApiErrorToApplicationTransform(input_?: any): ApiError {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: jsonErrorCodeToApplicationTransform(input_.code),message: input_.message,details: jsonRecordUnknownToApplicationTransform(input_.details)
  }!;
}export function jsonErrorCodeToTransportTransform(
  input_?: ErrorCode | null,
): any {
  if(!input_) {
    return input_ as any;
  }return input_
}export function jsonErrorCodeToApplicationTransform(input_?: any): ErrorCode {
  if(!input_) {
    return input_ as any;
  }return input_
}export function jsonRecordUnknownToTransportTransform(
  items_?: Record<string, any> | null,
): any {
  if(!items_) {
    return items_ as any;
  }

  const _transformedRecord: any = {};

  for (const [key, value] of Object.entries(items_ ?? {})) {
    const transformedItem = value as any;
    _transformedRecord[key] = transformedItem;
  }

  return _transformedRecord;
}export function jsonRecordUnknownToApplicationTransform(
  items_?: any,
): Record<string, any> {
  if(!items_) {
    return items_ as any;
  }

  const _transformedRecord: any = {};

  for (const [key, value] of Object.entries(items_ ?? {})) {
    const transformedItem = value as any;
    _transformedRecord[key] = transformedItem;
  }

  return _transformedRecord;
}export function jsonCreateHostRequestToTransportTransform(
  input_?: CreateHostRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    slug: input_.slug,name: input_.name,timeZone: input_.timeZone
  }!;
}export function jsonCreateHostRequestToApplicationTransform(
  input_?: any,
): CreateHostRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    slug: input_.slug,name: input_.name,timeZone: input_.timeZone
  }!;
}export function jsonArrayEventTypeToTransportTransform(
  items_?: Array<EventType> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonEventTypeToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayEventTypeToApplicationTransform(
  items_?: any,
): Array<EventType> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonEventTypeToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonEventTypeToTransportTransform(
  input_?: EventType | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,slug: input_.slug,title: input_.title,description: input_.description,durationMin: input_.durationMin,locationType: input_.locationType,isActive: input_.isActive
  }!;
}export function jsonEventTypeToApplicationTransform(input_?: any): EventType {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,slug: input_.slug,title: input_.title,description: input_.description,durationMin: input_.durationMin,locationType: input_.locationType,isActive: input_.isActive
  }!;
}export function jsonCreateEventTypeRequestToTransportTransform(
  input_?: CreateEventTypeRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    slug: input_.slug,title: input_.title,description: input_.description,durationMin: input_.durationMin,locationType: input_.locationType,isActive: input_.isActive
  }!;
}export function jsonCreateEventTypeRequestToApplicationTransform(
  input_?: any,
): CreateEventTypeRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    slug: input_.slug,title: input_.title,description: input_.description,durationMin: input_.durationMin,locationType: input_.locationType,isActive: input_.isActive
  }!;
}export function jsonUpdateEventTypeRequestToTransportTransform(
  input_?: UpdateEventTypeRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    title: input_.title,description: input_.description,durationMin: input_.durationMin,locationType: input_.locationType,isActive: input_.isActive
  }!;
}export function jsonUpdateEventTypeRequestToApplicationTransform(
  input_?: any,
): UpdateEventTypeRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    title: input_.title,description: input_.description,durationMin: input_.durationMin,locationType: input_.locationType,isActive: input_.isActive
  }!;
}export function jsonAvailabilitySettingsToTransportTransform(
  input_?: AvailabilitySettings | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    timeZone: input_.timeZone,slotDurationMin: input_.slotDurationMin,bufferBeforeMin: input_.bufferBeforeMin,bufferAfterMin: input_.bufferAfterMin,minNoticeMin: input_.minNoticeMin,horizonDays: input_.horizonDays,ranges: jsonArrayAvailabilityRangeToTransportTransform(input_.ranges)
  }!;
}export function jsonAvailabilitySettingsToApplicationTransform(
  input_?: any,
): AvailabilitySettings {
  if(!input_) {
    return input_ as any;
  }
    return {
    timeZone: input_.timeZone,slotDurationMin: input_.slotDurationMin,bufferBeforeMin: input_.bufferBeforeMin,bufferAfterMin: input_.bufferAfterMin,minNoticeMin: input_.minNoticeMin,horizonDays: input_.horizonDays,ranges: jsonArrayAvailabilityRangeToApplicationTransform(input_.ranges)
  }!;
}export function jsonArrayAvailabilityRangeToTransportTransform(
  items_?: Array<AvailabilityRange> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonAvailabilityRangeToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayAvailabilityRangeToApplicationTransform(
  items_?: any,
): Array<AvailabilityRange> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonAvailabilityRangeToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonAvailabilityRangeToTransportTransform(
  input_?: AvailabilityRange | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    weekday: input_.weekday,startMinute: input_.startMinute,endMinute: input_.endMinute
  }!;
}export function jsonAvailabilityRangeToApplicationTransform(
  input_?: any,
): AvailabilityRange {
  if(!input_) {
    return input_ as any;
  }
    return {
    weekday: input_.weekday,startMinute: input_.startMinute,endMinute: input_.endMinute
  }!;
}export function jsonUpdateAvailabilityRequestToTransportTransform(
  input_?: UpdateAvailabilityRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    timeZone: input_.timeZone,slotDurationMin: input_.slotDurationMin,bufferBeforeMin: input_.bufferBeforeMin,bufferAfterMin: input_.bufferAfterMin,minNoticeMin: input_.minNoticeMin,horizonDays: input_.horizonDays,ranges: jsonArrayAvailabilityRangeToTransportTransform(input_.ranges)
  }!;
}export function jsonUpdateAvailabilityRequestToApplicationTransform(
  input_?: any,
): UpdateAvailabilityRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    timeZone: input_.timeZone,slotDurationMin: input_.slotDurationMin,bufferBeforeMin: input_.bufferBeforeMin,bufferAfterMin: input_.bufferAfterMin,minNoticeMin: input_.minNoticeMin,horizonDays: input_.horizonDays,ranges: jsonArrayAvailabilityRangeToApplicationTransform(input_.ranges)
  }!;
}export function jsonArrayBookingToTransportTransform(
  items_?: Array<Booking> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonBookingToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayBookingToApplicationTransform(
  items_?: any,
): Array<Booking> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonBookingToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonBookingToTransportTransform(input_?: Booking | null): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,hostSlug: input_.hostSlug,eventTypeId: input_.eventTypeId,startAt: input_.startAt,endAt: input_.endAt,timeZone: input_.timeZone,clientName: input_.clientName,clientEmail: input_.clientEmail,clientPhone: input_.clientPhone,clientNotes: input_.clientNotes,clientGuests: jsonArrayStringToTransportTransform(input_.clientGuests),consentAccepted: input_.consentAccepted,status: input_.status,cancellationReason: input_.cancellationReason,createdAt: input_.createdAt
  }!;
}export function jsonBookingToApplicationTransform(input_?: any): Booking {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,hostSlug: input_.hostSlug,eventTypeId: input_.eventTypeId,startAt: input_.startAt,endAt: input_.endAt,timeZone: input_.timeZone,clientName: input_.clientName,clientEmail: input_.clientEmail,clientPhone: input_.clientPhone,clientNotes: input_.clientNotes,clientGuests: jsonArrayStringToApplicationTransform(input_.clientGuests),consentAccepted: input_.consentAccepted,status: input_.status,cancellationReason: input_.cancellationReason,createdAt: input_.createdAt
  }!;
}export function jsonArrayStringToTransportTransform(
  items_?: Array<string> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = item as any;
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayStringToApplicationTransform(
  items_?: any,
): Array<string> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = item as any;
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonCreateBookingRequestToTransportTransform(
  input_?: CreateBookingRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    eventTypeId: input_.eventTypeId,startAt: input_.startAt,clientName: input_.clientName,clientEmail: input_.clientEmail,clientPhone: input_.clientPhone,clientNotes: input_.clientNotes,guests: jsonArrayStringToTransportTransform(input_.guests),consentAccepted: input_.consentAccepted,captchaToken: input_.captchaToken
  }!;
}export function jsonCreateBookingRequestToApplicationTransform(
  input_?: any,
): CreateBookingRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    eventTypeId: input_.eventTypeId,startAt: input_.startAt,clientName: input_.clientName,clientEmail: input_.clientEmail,clientPhone: input_.clientPhone,clientNotes: input_.clientNotes,guests: jsonArrayStringToApplicationTransform(input_.guests),consentAccepted: input_.consentAccepted,captchaToken: input_.captchaToken
  }!;
}export function jsonArrayTimeBlockToTransportTransform(
  items_?: Array<TimeBlock> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonTimeBlockToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayTimeBlockToApplicationTransform(
  items_?: any,
): Array<TimeBlock> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonTimeBlockToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonTimeBlockToTransportTransform(
  input_?: TimeBlock | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,startAt: input_.startAt,endAt: input_.endAt,reason: input_.reason,createdAt: input_.createdAt
  }!;
}export function jsonTimeBlockToApplicationTransform(input_?: any): TimeBlock {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,startAt: input_.startAt,endAt: input_.endAt,reason: input_.reason,createdAt: input_.createdAt
  }!;
}export function jsonCreateTimeBlockRequestToTransportTransform(
  input_?: CreateTimeBlockRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    startAt: input_.startAt,endAt: input_.endAt,reason: input_.reason
  }!;
}export function jsonCreateTimeBlockRequestToApplicationTransform(
  input_?: any,
): CreateTimeBlockRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    startAt: input_.startAt,endAt: input_.endAt,reason: input_.reason
  }!;
}export function jsonCancelBookingRequestToTransportTransform(
  input_?: CancelBookingRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    reason: input_.reason
  }!;
}export function jsonCancelBookingRequestToApplicationTransform(
  input_?: any,
): CancelBookingRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    reason: input_.reason
  }!;
}export function jsonRescheduleBookingRequestToTransportTransform(
  input_?: RescheduleBookingRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    startAt: input_.startAt
  }!;
}export function jsonRescheduleBookingRequestToApplicationTransform(
  input_?: any,
): RescheduleBookingRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    startAt: input_.startAt
  }!;
}export function jsonHostSettingsToTransportTransform(
  input_?: HostSettings | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    slug: input_.slug,name: input_.name,timeZone: input_.timeZone,captcha: jsonCaptchaSettingsToTransportTransform(input_.captcha)
  }!;
}export function jsonHostSettingsToApplicationTransform(
  input_?: any,
): HostSettings {
  if(!input_) {
    return input_ as any;
  }
    return {
    slug: input_.slug,name: input_.name,timeZone: input_.timeZone,captcha: jsonCaptchaSettingsToApplicationTransform(input_.captcha)
  }!;
}export function jsonCaptchaSettingsToTransportTransform(
  input_?: CaptchaSettings | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    provider: input_.provider,required: input_.required,siteKey: input_.siteKey
  }!;
}export function jsonCaptchaSettingsToApplicationTransform(
  input_?: any,
): CaptchaSettings {
  if(!input_) {
    return input_ as any;
  }
    return {
    provider: input_.provider,required: input_.required,siteKey: input_.siteKey
  }!;
}export function jsonAvailabilityDayToTransportTransform(
  input_?: AvailabilityDay | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    date: input_.date,timeZone: input_.timeZone,slots: jsonArraySlotToTransportTransform(input_.slots)
  }!;
}export function jsonAvailabilityDayToApplicationTransform(
  input_?: any,
): AvailabilityDay {
  if(!input_) {
    return input_ as any;
  }
    return {
    date: input_.date,timeZone: input_.timeZone,slots: jsonArraySlotToApplicationTransform(input_.slots)
  }!;
}export function jsonArraySlotToTransportTransform(
  items_?: Array<Slot> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonSlotToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArraySlotToApplicationTransform(
  items_?: any,
): Array<Slot> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonSlotToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonSlotToTransportTransform(input_?: Slot | null): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,startAt: input_.startAt,durationMin: input_.durationMin,available: input_.available
  }!;
}export function jsonSlotToApplicationTransform(input_?: any): Slot {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,startAt: input_.startAt,durationMin: input_.durationMin,available: input_.available
  }!;
}
