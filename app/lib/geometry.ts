import { parseLatLng, type LatLng, type LocationPoint } from "./timeline";
import type { SemanticSegment, StringToDate } from "./types";

export type PathGeometry = {
  type: "path";
  points: Array<LocationPoint>;
};

export type VisitGeometry = {
  type: "visit";
  point: LatLng;
  timeRange: {
    start: Date;
    end: Date;
  };
};

export type ActivityGeometry = {
  type: "activity";
  activityType: string;
  start: LocationPoint;
  end: LocationPoint;
};

export type Geometry = PathGeometry | VisitGeometry | ActivityGeometry;

export function segmentToGeometry(
  segment: StringToDate<SemanticSegment>
): Geometry | null {
  if ("timelinePath" in segment) {
    return {
      type: "path",
      points: segment.timelinePath.map(({ point, time }) => ({
        point: parseLatLng(point),
        time,
      })),
    };
  } else if ("visit" in segment) {
    return {
      type: "visit",
      point: parseLatLng(segment.visit.topCandidate.placeLocation.latLng),
      timeRange: {
        start: segment.startTime,
        end: segment.endTime,
      },
    };
  } else if ("activity" in segment) {
    return {
      type: "activity",
      activityType: segment.activity.topCandidate.type,
      start: {
        point: parseLatLng(segment.activity.start.latLng),
        time: segment.startTime,
      },
      end: {
        point: parseLatLng(segment.activity.end.latLng),
        time: segment.endTime,
      },
    };
  }
  return null;
}
