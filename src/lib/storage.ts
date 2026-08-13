import { Team, ScoreLog, EventStats } from '../types';
import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  getDocs, 
  deleteDoc, 
  writeBatch
} from 'firebase/firestore';

const ADMIN_PIN_KEY = 'dino_event_admin_pin_v1';
const DEFAULT_PIN = '1234';

// Local cache to maintain synchronous API
let localTeamsCache: Team[] = [];
let isInitialized = false;

// Subscriptions
type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notifyListeners() {
  listeners.forEach(l => l());
}

export function subscribeToUpdates(callback: () => void): () => void {
  listeners.add(callback);
  
  // Initialize Firestore listener on first subscription
  if (!isInitialized) {
    isInitialized = true;
    try {
      const teamsCol = collection(db, 'teams');
      onSnapshot(teamsCol, (snapshot) => {
        const teams: Team[] = [];
        snapshot.forEach((doc) => {
          teams.push(doc.data() as Team);
        });
        localTeamsCache = teams;
        notifyListeners();
      }, (error) => {
        console.error("Firestore subscription error:", error);
      });
    } catch (e) {
      console.warn("Failed to connect to Firebase. Falling back to local cache only.", e);
    }
  }

  return () => {
    listeners.delete(callback);
  };
}

export function getTeams(): Team[] {
  return localTeamsCache;
}

export function getRankedTeams(teams: Team[] = getTeams()): Team[] {
  return [...teams].sort((a, b) => {
    if (b.highScore !== a.highScore) {
      return b.highScore - a.highScore;
    }
    const timeA = a.highScoreTimestamp || a.createdAt || 0;
    const timeB = b.highScoreTimestamp || b.createdAt || 0;
    return timeA - timeB;
  });
}

export async function registerTeam(teamData: { name: string; player1: string; player2: string; contact?: string }): Promise<Team> {
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

  // Optimistic update
  localTeamsCache.push(newTeam);
  notifyListeners();

  try {
    await setDoc(doc(db, 'teams', newTeam.id), newTeam);
  } catch (e) {
    console.error("Error saving team to Firestore", e);
  }
  
  return newTeam;
}

export async function submitScore(teamId: string, score: number): Promise<{ team: Team; isNewHighScore: boolean; previousHighScore: number }> {
  const index = localTeamsCache.findIndex((t) => t.id === teamId);
  if (index === -1) {
    throw new Error('Team not found');
  }

  const team = { ...localTeamsCache[index] };
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

  // Optimistic update
  localTeamsCache[index] = team;
  notifyListeners();

  try {
    await setDoc(doc(db, 'teams', team.id), team);
  } catch (e) {
    console.error("Error updating score in Firestore", e);
  }

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

export async function deleteTeam(teamId: string) {
  // Optimistic update
  localTeamsCache = localTeamsCache.filter((t) => t.id !== teamId);
  notifyListeners();

  try {
    await deleteDoc(doc(db, 'teams', teamId));
  } catch (e) {
    console.error("Error deleting team from Firestore", e);
  }
}

export async function updateTeamScore(teamId: string, newHighScore: number) {
  const team = localTeamsCache.find((t) => t.id === teamId);
  if (team) {
    team.highScore = Math.max(0, newHighScore);
    team.highScoreTimestamp = Date.now();
    notifyListeners();

    try {
      await setDoc(doc(db, 'teams', team.id), team);
    } catch (e) {
      console.error("Error updating team score in Firestore", e);
    }
  }
}

export async function resetAllData() {
  localTeamsCache = [];
  notifyListeners();

  try {
    const teamsCol = collection(db, 'teams');
    const snapshot = await getDocs(teamsCol);
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
  } catch (e) {
    console.error("Error resetting data in Firestore", e);
  }
}

export async function seedDemoData() {
  const demo = getDemoTeams();
  localTeamsCache = [...localTeamsCache, ...demo];
  notifyListeners();

  try {
    const batch = writeBatch(db);
    demo.forEach(team => {
      const ref = doc(db, 'teams', team.id);
      batch.set(ref, team);
    });
    await batch.commit();
  } catch (e) {
    console.error("Error seeding data in Firestore", e);
  }
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
      id: `TEAM-${Math.floor(1000 + Math.random() * 9000)}`,
      name: 'Google Chrome Velocity',
      player1: 'Alex Chen',
      player2: 'Sarah Jenkins',
      contact: 'alex.c@example.com',
      highScore: 14250,
      highScoreTimestamp: now - 3600000 * 2,
      totalAttempts: 3,
      createdAt: now - 3600000 * 3,
      scoreHistory: [
        { id: `SCR-${now}-1`, score: 14250, timestamp: now - 3600000 * 2 },
      ],
    }
  ];
}
