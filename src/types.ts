export interface UserPreferences {
  type: string[];
  ageRange: {
    min: number;
    max: number;
  };
  distance: number;
  interests: string[];
}

export interface Profile {
  id: string;
  name: string;
  age: number;
  bio: string;
  distance: number;
  interests: string[];
  photos?: string[];
}

export interface ScoringWeights {
  interest: number;
  age: number;
  distance: number;
  bio: number;
  visual: number;
}

export interface SwipeDecision {
  profile: Profile;
  score: number;
  action: 'RIGHT' | 'LEFT';
  reasoning?: string;
  bestImageUrl?: string;
}
