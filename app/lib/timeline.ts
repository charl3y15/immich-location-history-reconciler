import type {
  Timeline,
  TimelineWithDates,
  StringToDate,
  PathSegment,
  SemanticSegment,
  VisitSegment,
  ActivitySegment,
} from "./types";

const timeline = shallowRef<TimelineWithDates>();

type Segment = StringToDate<SemanticSegment>;

export type LatLng = {
  lat: number;
  lng: number;
};

export type LocationPoint = {
  point: LatLng;
  time: Date;
};

export function parseLatLng(latLng: string): LatLng {
  const [lat, lng] = latLng
    .split(", ")
    .map((part) => Number(part.replace("°", "")));
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new Error("Invalid latLng format");
  }
  return { lat, lng };
}

function toLocationPoint({
  point,
  time,
}: {
  point: string;
  time: Date;
}): LocationPoint {
  return {
    point: parseLatLng(point),
    time,
  };
}

function interpolateLocation(
  timestamp: Date,
  point1: LocationPoint,
  point2: LocationPoint
): LocationPoint {
  if (point2.time < point1.time) {
    [point1, point2] = [point2, point1];
  }
  // Check if the timestamp is within the range of the two points
  if (timestamp < point1.time || timestamp > point2.time) {
    throw new Error(
      "The given timestamp does not fall in the range of the given points"
    );
  }

  const totalDuration = point2.time.getTime() - point1.time.getTime();
  const elapsedTime = timestamp.getTime() - point1.time.getTime();
  const ratio = totalDuration === 0 ? 0 : elapsedTime / totalDuration;

  const lat = point1.point.lat + (point2.point.lat - point1.point.lat) * ratio;
  const lng = point1.point.lng + (point2.point.lng - point1.point.lng) * ratio;
  const time = new Date(point1.time.getTime() + totalDuration * ratio);

  return {
    time,
    point: { lat, lng },
  };
}

const segmentContainsDate = (segment: Segment, timestamp: Date): boolean => {
  return segment.startTime <= timestamp && timestamp <= segment.endTime;
};

const findRawSignalsContaining = () => {
  // TODO
};

const estimatePointFromPathSegment = (
  timestamp: Date,
  { timelinePath: path }: StringToDate<PathSegment>
): LocationPoint => {
  let low = 0;
  let high = path.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (path[mid].time > timestamp) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }

  // high = low = first index that is greater than the timestamp
  const pointAfter = path[high];
  const pointBefore = path[high - 1];

  // In case it's the first point
  if (pointBefore == undefined) {
    return toLocationPoint(pointAfter);
  }

  // In case it's the last point
  if (pointAfter == undefined) {
    return toLocationPoint(pointBefore);
  }

  return interpolateLocation(
    timestamp,
    toLocationPoint(pointBefore),
    toLocationPoint(pointAfter)
  );
};

const estimatePointFromVisitSegment = (
  timestamp: Date,
  { visit }: StringToDate<VisitSegment>
): LocationPoint => {
  return {
    time: timestamp,
    point: parseLatLng(visit.topCandidate.placeLocation.latLng),
  };
};

const estimatePointFromActivitySegment = (
  timestamp: Date,
  { startTime, endTime, activity }: StringToDate<ActivitySegment>
): LocationPoint => {
  return interpolateLocation(
    timestamp,
    {
      time: startTime,
      point: parseLatLng(activity.start.latLng),
    },
    {
      time: endTime,
      point: parseLatLng(activity.end.latLng),
    }
  );
};

const estimatePointFromSegment = (
  timestamp: Date,
  segment: Segment
): LocationPoint | null => {
  switch (true) {
    case "timelinePath" in segment:
      return estimatePointFromPathSegment(timestamp, segment);
    case "visit" in segment:
      return estimatePointFromVisitSegment(timestamp, segment);
    case "activity" in segment:
      return estimatePointFromActivitySegment(timestamp, segment);
    case "timelineMemory" in segment:
    default:
      return null;
  }
};

/** Weighted average */
const estimatePointFromSegments = (
  timestamp: Date,
  segments: Segment[]
): LocationPoint | null => {
  const points = segments
    .map((seg) => estimatePointFromSegment(timestamp, seg))
    .filter((point) => point != null);

  if (points.length === 0) {
    return null;
  }

  return points.reduce((point1, point2) =>
    interpolateLocation(timestamp, point1, point2)
  );
};

export function useTimeline() {
  const setTimeline = ({
    semanticSegments,
    rawSignals,
    userLocationProfile,
  }: Timeline) => {
    timeline.value = {
      semanticSegments: semanticSegments.map((signal) => {
        if ("timelinePath" in signal) {
          return {
            ...signal,
            startTime: new Date(signal.startTime),
            endTime: new Date(signal.endTime),
            timelinePath: signal.timelinePath.map((path) => ({
              ...path,
              time: new Date(path.time),
            })),
          };
        } else {
          return {
            ...signal,
            startTime: new Date(signal.startTime),
            endTime: new Date(signal.endTime),
          };
        }
      }),
      rawSignals,
      userLocationProfile,
    };
  };

  const findSegmentsContaining = (timestamp: Date): Segment[] => {
    const segments = timeline.value?.semanticSegments;
    if (segments == null) return [];

    let low = 0;
    let high = segments.length;

    // Binary search to find the first startTime greater than timestamp
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (segments[mid].startTime > timestamp) {
        high = mid;
      } else {
        low = mid + 1;
      }
    }
    // Index of first segment that starts after the given timestamp
    const highIndex = low;
    // Index of first segment that contains the given timestamp
    let lowIndex = highIndex - 1;

    // Go back in the timeline, adding segments that contain the timestamp (usually only one, but could be more)
    while (
      lowIndex >= 0 &&
      segmentContainsDate(segments[lowIndex], timestamp)
    ) {
      lowIndex--;
    }

    if (lowIndex === highIndex - 1) {
      // No segments found that contain the timestamp
      // Maybe return the one before and after?
      // Depending on whether we value accuracy more or just having some data
      // probably using an option like: use surrounding segments if no overlap found
      // To be combined with an option like: maximum time difference to consider
      // In that case, provide options: use start, use end, use midpoint, ignore
    }

    return segments.slice(lowIndex + 1, highIndex);
  };

  const estimateLocationAtTime = (timestamp: Date) => {
    if (!timeline.value) return null;

    const segments = findSegmentsContaining(timestamp);

    /*
     * There are 4 types of segments: timelinePath, visit, activity, and timelineMemory.
     * 1. timelinePath has an array of locations with timestamps, so we can find the closest one to the given timestamp.
     *    Also, no 2 consecutive timelinePath segments can overlap (at most, the endTime for one is the startTime for the next one).
     *    In such an edge case, we can just merge them and find the nearest point in the path.
     * 2. visit has one location associated with a time range.
     * 3. activity has a location range (start/end) associated with a time range. Perhaps we can interpolate
     * 4. timelineMemory segments are associated with trips and are basically useless in our case.
     *
     * It seems that the most accurate (smallest time range) activity type is the timeline path,
     * followed by visit and activity (both can have relatively large time ranges)
     */

    const pathSegments = segments.filter((seg) => "timelinePath" in seg);
    if (pathSegments.length) {
      return {
        bestEstimate: estimatePointFromSegments(timestamp, pathSegments),
        segments,
        estimateSource: "timelinePath" as const,
      };
    }

    // Otherwise, just return the average of all other data (TODO: improve upon this somehow)
    return {
      bestEstimate: estimatePointFromSegments(timestamp, segments),
      segments,
      estimateSource: "others" as const,
    };
  };

  // TODO: wrap result of functions in "computed" based on timeline

  return {
    setTimeline,
    timeline: readonly(timeline),
    estimateLocationAtTime,
    findSegmentsContaining,
  };
}
