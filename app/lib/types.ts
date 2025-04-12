// TODO: generate a JSON schema (https://marketplace.visualstudio.com/items?itemName=marcoq.vscode-typescript-to-json-schema
// or https://transform.tools/typescript-to-json-schema)
// and contribute it to https://locationhistoryformat.com/reference

/** Metadata of an image in Google Photos takeout */
export interface Metadata {
  title: string;
  description: string;
  imageViews: string;
  creationTime: {
    timestamp: string;
    formatted: string;
  };
  photoTakeTime: {
    timestamp: string;
    formatted: string;
  };
  geoData: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
  geoDataExif?: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
  url: string;
  googlePhotosOrigin: {
    mobileUpload: {
      deviceFolder: Object;
      deviceType: string;
    };
  };
  people?: Array<{ name: string }>;
  appSource: {
    androidPackageName: string;
  };
}

interface SegmentBase {
  /** ISO date-time stamp */
  startTime: string;
  /** ISO date-time stamp */
  endTime: string;
}

interface PathSegment extends SegmentBase {
  timelinePath: Array<{
    /** Format: "30.0485295°, 31.3557779°" */
    point: string;
    /** ISO date-time stamp */
    time: string;
  }>;
}

type SemanticType =
  | "INFERRED_WORK"
  | "HOME"
  | "WORK"
  | "UNKNOWN"
  | "ALIASED_LOCATION"
  | "SEARCHED_ADDRESS"
  | "INFERRED_HOME";

interface VisitSegment extends SegmentBase {
  startTimeTimezoneUtcOffsetMinutes: number;
  endTimeTimezoneUtcOffsetMinutes: number;
  visit: {
    hierarchyLevel: number;
    /** 0-1 */
    probability: number;
    topCandidate: {
      placeId: string;
      semanticType: SemanticType;
      /** 0-1 */
      probability: number;
      placeLocation: {
        /** Format: "30.0485295°, 31.3557779°" */
        latLng: string;
      };
    };
  };
}

type ActivityType =
  | "IN_VEHICLE"
  | "IN_BUS"
  | "IN_TRAM"
  | "IN_TRAIN"
  | "IN_SUBWAY"
  | "IN_FERRY"
  | "IN_PASSENGER_VEHICLE"
  | "WALKING"
  | "UNKNOWN_ACTIVITY_TYPE"
  | "CYCLING"
  | "FLYING"
  | "SKIING"
  | "MOTORCYCLING";

interface ActivitySegment extends SegmentBase {
  startTimeTimezoneUtcOffsetMinutes: number;
  endTimeTimezoneUtcOffsetMinutes: number;
  activity: {
    distanceMeters: number;
    end: { latLng: string };
    start: { latLng: string };
    topCandidate: { type: ActivityType; probability: number };
  };
}

interface TimelineMemory extends SegmentBase {
  timelineMemory: {
    trip: {
      distanceFromOriginKms: number;
      destinations: Array<{
        identifier: {
          placeId: string;
        };
      }>;
    };
  };
}

type SemanticSegment =
  | PathSegment
  | VisitSegment
  | ActivitySegment
  | TimelineMemory;

interface Position {
  position: {
    LatLng: string;
    accuracyMeters: number;
    altitudeMeters: number;
    source: "WIFI" | "CELL" | "GPS" | "UNKNOWN";
    timestamp: string;
    speedMetersPerSecond: number;
  };
}

interface WifiScan {
  wifiScan: {
    deliveryTime: string;
    devicesRecords: any[]; // Couldn't bother
  };
}

interface ActivityRecord {
  activityRecord: {
    probableActivities: any[]; // Couldn't bother
    timestamp: string;
  };
}

type RawSignal = Position | WifiScan | ActivityRecord;

type TravelMode =
  | "IN_PASSENGER_VEHICLE"
  | "WALKING"
  | "IN_SUBWAY"
  | "IN_BUS"
  | "IN_TRAIN"
  | "FLYING"
  | "IN_FERRY";

export interface Timeline {
  semanticSegments: SemanticSegment[];
  rawSignals: RawSignal[];
  userLocationProfile: {
    frequentPlaces: Array<{
      placeId: string;
      /** geo */
      placeLocation: string;
      label?: string;
    }>;
    persona: {
      travelModeAffinities: Array<{
        mode: TravelMode;
        affinity: number;
      }>;
    };
  };
}
