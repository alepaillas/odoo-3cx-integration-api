// src/utils/duration.utils.ts
export function parseDuration(duration: string): string {
  // Remove 'PT' prefix and 'S' suffix
  const durationWithoutPT = duration.replace('PT', '');
  const durationWithoutS = durationWithoutPT.replace('S', '');

  // Split into minutes and seconds
  const durationParts = durationWithoutS.split('M');

  let minutes = 0;
  let seconds = 0;

  if (durationParts.length > 1) {
    minutes = parseInt(durationParts[0], 10);
    seconds = parseFloat(durationParts[1]);
  } else {
    // Handle cases where duration is only in seconds
    seconds = parseFloat(durationParts[0]);
  }

  return `${minutes}min ${Math.round(seconds)}s`;
}
