import { Team, ScoreLog, EventStats } from '../types';

const STORAGE_KEY = 'dino_event_teams_v1';
const ADMIN_PIN_KEY = 'dino_event_admin_pin_v1';
const DEFAULT_PIN = '1234';
const CHANNEL_NAME = 'dino_event_sync_channel';

// Initialize broadcast channel for real-time cross-tab updates
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch {
    broadcastChannel = null;
  }
}

export function notifyCrossTabUpdate() {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new Event('dino_local_update'));
    } catch {
      // Event fallback
    }
  }
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'UPDATE_LEADERBOARD', timestamp: Date.now() });
    } catch {
      // Channel error fallback
    }
  }
}

export function subscribeToUpdates(callback: () => void): () => void {
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback();
    }
  };

  const handleMessage = () => {
    callback();
  };

  const handleLocalUpdate = () => {
    callback();
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener('dino_local_update', handleLocalUpdate);
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleMessage);
  }

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('dino_local_update', handleLocalUpdate);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleMessage);
    }
  };
}

export function getTeams(): Team[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = getDemoTeams();
    saveTeams(initial, false);
    return initial;
  }
  try {
    return JSON.parse(raw) as Team[];
  } catch {
    return [];
  }
}

export function saveTeams(teams: Team[], notify = true) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
  if (notify) {
    notifyCrossTabUpdate();
  }
}

export function getRankedTeams(teams: Team[] = getTeams()): Team[] {
  return [...teams].sort((a, b) => {
    // 1. Highest score first
    if (b.highScore !== a.highScore) {
      return b.highScore - a.highScore;
    }
    // 2. Tie-breaker: Earlier timestamp gets higher rank
    const timeA = a.highScoreTimestamp || a.createdAt || 0;
    const timeB = b.highScoreTimestamp || b.createdAt || 0;
    return timeA - timeB;
  });
}

export function registerTeam(teamData: { name: string; player1: string; player2: string; contact?: string }): Team {
  const teams = getTeams();
  const timestamp = Date.now();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const newTeam: Team = {
    id: `TEAM-${randomSuffix}`,
    name: teamData.name.trim(),
    player1: teamData.player1.trim(),
    player2: teamData.player2.trim(),
    contact: teamData.contact?.trim() || '',
    highScore: 0,
    highScoreTimestamp: timestamp,
    totalAttempts: 0,
    createdAt: timestamp,
    scoreHistory: [],
  };

  teams.push(newTeam);
  saveTeams(teams);
  return newTeam;
}

export function submitScore(teamId: string, score: number): { team: Team; isNewHighScore: boolean; previousHighScore: number } {
  const teams = getTeams();
  const index = teams.findIndex((t) => t.id === teamId);
  if (index === -1) {
    throw new Error('Team not found');
  }

  const team = { ...teams[index] };
  const timestamp = Date.now();
  const previousHighScore = team.highScore;
  const isNewHighScore = score > previousHighScore;

  const newLog: ScoreLog = {
    id: `SCR-${timestamp}-${Math.floor(Math.random() * 1000)}`,
    score,
    timestamp,
  };

  team.totalAttempts = (team.totalAttempts || 0) + 1;
  team.scoreHistory = [newLog, ...(team.scoreHistory || [])];

  if (isNewHighScore) {
    team.highScore = score;
    team.highScoreTimestamp = timestamp;
  }

  teams[index] = team;
  saveTeams(teams);

  return { team, isNewHighScore, previousHighScore };
}

export function getEventStats(): EventStats {
  const teams = getTeams();
  const ranked = getRankedTeams(teams);
  
  let totalGamesPlayed = 0;
  let latestScore: EventStats['latestScore'] = null;
  let latestTime = 0;

  teams.forEach((t) => {
    totalGamesPlayed += t.totalAttempts || 0;
    if (t.scoreHistory && t.scoreHistory.length > 0) {
      const mostRecent = t.scoreHistory[0];
      if (mostRecent.timestamp > latestTime) {
        latestTime = mostRecent.timestamp;
        latestScore = {
          teamName: t.name,
          score: mostRecent.score,
          timestamp: mostRecent.timestamp,
        };
      }
    }
  });

  const topTeam = ranked[0];

  return {
    totalTeams: teams.length,
    totalGamesPlayed,
    topScore: topTeam ? topTeam.highScore : 0,
    topTeamName: topTeam ? topTeam.name : 'N/A',
    latestScore,
  };
}

export function deleteTeam(teamId: string) {
  const teams = getTeams().filter((t) => t.id !== teamId);
  saveTeams(teams);
}

export function updateTeamScore(teamId: string, newHighScore: number) {
  const teams = getTeams();
  const team = teams.find((t) => t.id === teamId);
  if (team) {
    team.highScore = Math.max(0, newHighScore);
    team.highScoreTimestamp = Date.now();
    saveTeams(teams);
  }
}

export function resetAllData() {
  saveTeams([]);
}

export function seedDemoData() {
  const demo = getDemoTeams();
  saveTeams(demo);
}

export function exportToCSV() {
  const teams = getRankedTeams();
  const headers = ['Rank', 'Team ID', 'Team Name', 'Player 1', 'Player 2', 'Contact', 'High Score', 'Total Attempts', 'Registered Date'];
  
  const rows = teams.map((team, index) => [
    index + 1,
    `"${team.id}"`,
    `"${team.name.replace(/"/g, '""')}"`,
    `"${team.player1.replace(/"/g, '""')}"`,
    `"${team.player2.replace(/"/g, '""')}"`,
    `"${(team.contact || '').replace(/"/g, '""')}"`,
    team.highScore,
    team.totalAttempts,
    `"${new Date(team.createdAt).toLocaleString()}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `dino_event_leaderboard_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Admin PIN Helpers
export function getAdminPin(): string {
  if (typeof window === 'undefined') return DEFAULT_PIN;
  return localStorage.getItem(ADMIN_PIN_KEY) || DEFAULT_PIN;
}

export function verifyAdminPin(pin: string): boolean {
  return pin === getAdminPin();
}

export function setAdminPin(newPin: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_PIN_KEY, newPin);
}

// Demo teams seeder
function getDemoTeams(): Team[] {
  const now = Date.now();
  return [
    {
      id: 'TEAM-1001',
      name: 'Google Chrome Velocity',
      player1: 'Alex Chen',
      player2: 'Sarah Jenkins',
      contact: 'alex.c@example.com',
      highScore: 14250,
      highScoreTimestamp: now - 3600000 * 2,
      totalAttempts: 3,
      createdAt: now - 3600000 * 3,
      scoreHistory: [
        { id: 'SCR-1', score: 14250, timestamp: now - 3600000 * 2 },
        { id: 'SCR-2', score: 9800, timestamp: now - 3600000 * 2.5 },
      ],
    },
    {
      id: 'TEAM-1002',
      name: 'Pixel Runners',
      player1: 'Marcus Vance',
      player2: 'Elena Rostova',
      contact: '9876543210',
      highScore: 12800,
      highScoreTimestamp: now - 3600000 * 1.5,
      totalAttempts: 2,
      createdAt: now - 3600000 * 2.5,
      scoreHistory: [
        { id: 'SCR-3', score: 12800, timestamp: now - 3600000 * 1.5 },
        { id: 'SCR-4', score: 7200, timestamp: now - 3600000 * 2 },
      ],
    },
    {
      id: 'TEAM-1003',
      name: 'Android Jumpers',
      player1: 'David Kim',
      player2: 'Priya Sharma',
      contact: 'priya@example.com',
      highScore: 11450,
      highScoreTimestamp: now - 3600000 * 1,
      totalAttempts: 4,
      createdAt: now - 3600000 * 2,
      scoreHistory: [
        { id: 'SCR-5', score: 11450, timestamp: now - 3600000 * 1 },
        { id: 'SCR-6', score: 10200, timestamp: now - 3600000 * 1.2 },
      ],
    },
    {
      id: 'TEAM-1004',
      name: 'Gemini Sparks',
      player1: 'Leo Garcia',
      player2: 'Sophia Martinez',
      contact: 'leo.g@example.com',
      highScore: 9900,
      highScoreTimestamp: now - 1800000,
      totalAttempts: 2,
      createdAt: now - 3600000 * 1.2,
      scoreHistory: [
        { id: 'SCR-7', score: 9900, timestamp: now - 1800000 },
      ],
    },
    {
      id: 'TEAM-1005',
      name: 'Cactus Dodgers',
      player1: 'Jordan Taylor',
      player2: 'Chris Morgan',
      contact: 'jordan@example.com',
      highScore: 8400,
      highScoreTimestamp: now - 900000,
      totalAttempts: 1,
      createdAt: now - 1200000,
      scoreHistory: [
        { id: 'SCR-8', score: 8400, timestamp: now - 900000 },
      ],
    },
  ];
}
