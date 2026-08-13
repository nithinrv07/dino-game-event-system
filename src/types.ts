export type ViewMode = 'play' | 'leaderboard' | 'admin';

export interface ScoreLog {
  id: string;
  score: number;
  timestamp: number;
}

export interface Team {
  id: string;
  name: string;
  player1: string;
  player2: string;
  contact?: string;
  highScore: number;
  highScoreTimestamp: number;
  totalAttempts: number;
  createdAt: number;
  scoreHistory: ScoreLog[];
}

export interface SubmissionPayload {
  teamId: string;
  score: number;
  timestamp: number;
}

export interface EventStats {
  totalTeams: number;
  totalGamesPlayed: number;
  topScore: number;
  topTeamName: string;
  latestScore: {
    teamName: string;
    score: number;
    timestamp: number;
  } | null;
}
