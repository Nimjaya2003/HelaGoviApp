// plants.ts
export interface Crop {
  id: string;
  name: string;
}

export interface ZoneMeta {
  title: string;
  waterCategory: string;
  description: string;
}

// Zone 1 = highest water need, Zone 4 = lowest — matches your project proposal
export const ZONE_META: ZoneMeta[] = [
  {
    title: 'Zone 1',
    waterCategory: 'Very high water need',
    description: 'Best suited for crops needing constant moisture, such as paddy and banana.',
  },
  {
    title: 'Zone 2',
    waterCategory: 'High water need',
    description: 'Suited for crops like cucumber, tomato and brinjal that need frequent watering.',
  },
  {
    title: 'Zone 3',
    waterCategory: 'Moderate water need',
    description: 'Suited for crops like okra, chili and beans with moderate watering needs.',
  },
  {
    title: 'Zone 4',
    waterCategory: 'Low water need',
    description: 'Suited for drought-tolerant crops like onion, chickpea and cowpea.',
  },
];

// Example Sri Lankan crops shown as quick-add suggestions per zone
export const SUGGESTED_CROPS: string[][] = [
  ['Rice (paddy)', 'Banana', 'Sugarcane'],
  ['Cucumber', 'Tomato', 'Brinjal'],
  ['Okra', 'Chili pepper', 'Beans'],
  ['Onion', 'Chickpea', 'Cowpea'],
];

export function newCrop(name: string): Crop {
  return { id: Date.now().toString() + Math.random().toString(36).slice(2, 7), name };
}

// A brand-new farmer starts with zero crops in every zone
export function emptyZoneCrops(): Crop[][] {
  return [[], [], [], []];
}