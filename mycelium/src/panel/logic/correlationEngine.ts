/**
 * Heuristic Correlation Engine (MVP).
 *
 * Groups requests into "Logical Flows" based on time proximity.
 * Two consecutive requests within the TIME_THRESHOLD are considered
 * part of the same flow.
 */

import type { NetworkRequest } from '../../utils/types';

/** Time threshold in ms — requests within this window are grouped. */
const TIME_THRESHOLD_MS = 1000;

export interface RequestGroup {
  /** Requests belonging to this logical flow. */
  requests: NetworkRequest[];
  /** Timestamp of the first request in the group. */
  startTime: number;
}

/**
 * Groups requests into logical flows by time proximity.
 *
 * @param requests - Chronologically ordered request array.
 * @returns Array of RequestGroup, each representing a logical flow.
 */
export function groupRequestsIntoFlows(requests: NetworkRequest[]): RequestGroup[] {
  if (requests.length === 0) return [];

  const groups: RequestGroup[] = [];
  let currentGroup: RequestGroup = {
    requests: [requests[0]],
    startTime: requests[0].timestamp,
  };

  for (let i = 1; i < requests.length; i++) {
    const prev = requests[i - 1];
    const curr = requests[i];

    if (curr.timestamp - prev.timestamp <= TIME_THRESHOLD_MS) {
      // Same flow
      currentGroup.requests.push(curr);
    } else {
      // New flow
      groups.push(currentGroup);
      currentGroup = {
        requests: [curr],
        startTime: curr.timestamp,
      };
    }
  }

  groups.push(currentGroup);
  return groups;
}
