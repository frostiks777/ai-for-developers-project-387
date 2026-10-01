import {
  type Client,
  type ClientOptions,
  getClient,
} from "@typespec/ts-http-runtime";

export interface AvailabilityClientContext extends Client {

}export interface AvailabilityClientOptions extends ClientOptions {
  endpoint?: string;
}export function createAvailabilityClientContext(
  options?: AvailabilityClientOptions,
): AvailabilityClientContext {
  const params: Record<string, any> = {
    endpoint: options?.endpoint ?? "http://localhost:3000"
  };
  const resolvedEndpoint = "{endpoint}".replace(/{([^}]+)}/g, (_, key) =>
    key in params ? String(params[key]) : (() => { throw new Error(`Missing parameter: ${key}`); })()
  );;return getClient(resolvedEndpoint,{
    ...options
  })
}
