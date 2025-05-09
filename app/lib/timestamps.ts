/**
 * Findings by analyzing the assets JSON:
 * - All assets have EXIF data when requested with `withExif` option. Could be thanks to immich-go?
 * - `asset.fileCreatedAt` is always the same as `exifInfo.dateTimeOriginal` (seems to be thanks to immich-app/immich#14874)
 * - All `exifInfo.dateTimeOriginal` values end in +00:00, and are actually in UTC
 * - It seems that the file name (if it even has a timestamp) is in the local timezone of the camera, not UTC
 * - The EXIF data is not to always be trusted, particularly the timezone. It could get corrupted while migrating old images, or perhaps some cameras store inconsistent data between timestamp in filename and EXIF data (due to timezone).
 */

/**
 * The list of possible date formats in the filename.
 */
const dateRegexes = [
  /(?<=\b|_)(\d{4})(\d{2})(\d{2})(?=\b|_)/,
  /(?<=\b|_)(\d{4})-(\d{2})-(\d{2})(?=\b|_)/,
  /(?<=\b|_)(\d{4})_(\d{2})_(\d{2})(?=\b|_)/,
  /(?<=\b|_)(\d{4})\.(\d{2})\.(\d{2})(?=\b|_)/,
];
/**
 * The list of possible time formats in the filename.
 */
const timeRegexes = [
  /(?<=\b|_)(\d{2})(\d{2})(\d{2})(?=\b|_)/,
  /(?<=\b|_)(\d{2})-(\d{2})-(\d{2})(?=\b|_)/,
  /(?<=\b|_)(\d{2})_(\d{2})_(\d{2})(?=\b|_)/,
  /(?<=\b|_)(\d{2})\.(\d{2})\.(\d{2})(?=\b|_)/,
];

/**
 * Extracts a timestamp from the given filename, if any exists.
 * Detects the time only if all 3 components (hours, minutes, seconds) are present.
 */
export function getTimestampFromFilename(filename: string): Date | null {
  let year = 0,
    month = 0,
    day = 0;
  for (const regex of dateRegexes) {
    const match = regex.exec(filename);
    if (match) {
      [, year, month, day] = match.map(Number);
      filename = filename.replace(regex, ""); // Remove the matched date part from the filename to not interfere with time regexes
      break;
    }
  }
  // TODO: maybe check after each match, in case another RegEx catches the correct one?
  if (year < 1970 || month > 12 || day > 31) {
    // False positive in date match
    return null;
  }

  // TODO: allow having hours and minutes only?
  let hours = 0,
    minutes = 0,
    seconds = 0;
  for (const regex of timeRegexes) {
    const match = regex.exec(filename);
    if (match) {
      [, hours, minutes, seconds] = match.map(Number);
      break;
    }
  }
  if (hours > 23 || minutes > 59 || seconds > 59) {
    // False positive in time match, reset to default values
    hours = minutes = seconds = 0;
  }

  return new Date(year, month - 1, day, hours, minutes, seconds);
}
