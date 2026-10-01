import { parse } from "uri-template";
import type { TimeBlocksClientContext } from "./timeBlocksClientContext.js";
import { createRestError } from "../../helpers/error.js";
import type { OperationOptions } from "../../helpers/interfaces.js";
import {
  jsonCreateTimeBlockRequestToTransportTransform,
  jsonErrorResponseToApplicationTransform,
  jsonTimeBlockToApplicationTransform,
} from "../../models/internal/serializers.js";
import type {
  CreateTimeBlockRequest,
  ErrorResponse,
  TimeBlock,
} from "../../models/models.js";

export interface ListTimeBlocksOptions extends OperationOptions {}
export async function listTimeBlocks(
  client: TimeBlocksClientContext,
  slug: string,
  options?: ListTimeBlocksOptions,
): Promise<Array<TimeBlock> | ErrorResponse> {
  const path = parse("/api/v1/hosts/{slug}/blocks").expand({
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
export interface CreateTimeBlockOptions extends OperationOptions {}
export async function createTimeBlock(
  client: TimeBlocksClientContext,
  slug: string,
  body: CreateTimeBlockRequest,
  options?: CreateTimeBlockOptions,
): Promise<ErrorResponse | TimeBlock> {
  const path = parse("/api/v1/hosts/{slug}/blocks").expand({
    slug: slug
  });
  const httpRequestOptions = {
    headers: {},body: jsonCreateTimeBlockRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorResponseToApplicationTransform(response.body)!;
  }
  if (+response.status === 201 && response.headers["content-type"]?.includes("application/json")) {
    return jsonTimeBlockToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface DeleteTimeBlockOptions extends OperationOptions {}
export async function deleteTimeBlock(
  client: TimeBlocksClientContext,
  slug: string,
  blockId: string,
  options?: DeleteTimeBlockOptions,
): Promise<ErrorResponse | void> {
  const path = parse("/api/v1/hosts/{slug}/blocks/{blockId}").expand({
    slug: slug,
    blockId: blockId
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
