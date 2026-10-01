import { parse } from "uri-template";
import type { HostsClientContext } from "./hostsClientContext.js";
import { createRestError } from "../../helpers/error.js";
import type { OperationOptions } from "../../helpers/interfaces.js";
import {
  jsonCreateHostRequestToTransportTransform,
  jsonErrorResponseToApplicationTransform,
  jsonHostToApplicationTransform,
} from "../../models/internal/serializers.js";
import type {
  CreateHostRequest,
  ErrorResponse,
  Host,
} from "../../models/models.js";

export interface ListHostsOptions extends OperationOptions {}
export async function listHosts(
  client: HostsClientContext,
  options?: ListHostsOptions,
): Promise<Array<Host> | ErrorResponse> {
  const path = parse("/api/v1/hosts").expand({});
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
export interface CreateHostOptions extends OperationOptions {}
export async function createHost(
  client: HostsClientContext,
  body: CreateHostRequest,
  options?: CreateHostOptions,
): Promise<ErrorResponse | Host> {
  const path = parse("/api/v1/hosts").expand({});
  const httpRequestOptions = {
    headers: {},body: jsonCreateHostRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorResponseToApplicationTransform(response.body)!;
  }
  if (+response.status === 201 && response.headers["content-type"]?.includes("application/json")) {
    return jsonHostToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
