export type Tier = "basic" | "vip";

export const LIMITS = {
  basic: {
    maxTextLen: 100,
    maxPhotos: 1,
    maxVideos: 1,
    maxAudioSec: 60,
  },
  vip: {
    maxTextLen: 5000,
    maxPhotos: 3,
    maxVideos: 2,
    maxAudioSec: 180,
  },
} as const;
