/**
 * Pure state helpers for the panel's request list.
 */

import type { NetworkRequest, ResponseUpdate } from '../../utils/types';
import { MAX_DIAGRAM_REQUESTS } from './mermaidBuilder';

/** Appends new requests, keeping only the last MAX_DIAGRAM_REQUESTS. */
export function appendRequests(prev: NetworkRequest[], incoming: NetworkRequest[]): NetworkRequest[] {
  const updated = [...prev, ...incoming];
  return updated.length > MAX_DIAGRAM_REQUESTS ? updated.slice(-MAX_DIAGRAM_REQUESTS) : updated;
}

/**
 * Merges late-arriving responses into their requests by requestId.
 * Updates for requests no longer in the list are ignored.
 */
export function applyResponses(prev: NetworkRequest[], updates: ResponseUpdate[]): NetworkRequest[] {
  const byId = new Map(updates.map((u) => [u.requestId, u]));
  let changed = false;
  const next = prev.map((req) => {
    const update = byId.get(req.requestId);
    if (!update) return req;
    changed = true;
    return { ...req, statusCode: update.statusCode, responseHeaders: update.responseHeaders };
  });
  return changed ? next : prev;
}
