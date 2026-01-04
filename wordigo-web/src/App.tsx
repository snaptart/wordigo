import { useState } from 'react';
import './App.css';
import type { CompleteGameResponse } from './types/index';
import { useAuth } from './hooks/useAuth';
import type { GameMode } from './hooks/useGameEngine';

// Components
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Profile from './components/Profile';
import Menu from './components/Menu';
import Settings from './components/Settings';
import GameHistory from './components/GameHistory';
import WordLookup from './components/WordLookup';
import DifficultySelection from './components/DifficultySelection';
import GameResults from './components/GameResults';
import GameOver from './components/GameOver';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';

type GameState = 'start' | 'difficulty-selection' | 'playing' | 'game-over' | 'results' | 'history' | 'profile' | 'settings' | 'word-lookup';

function App() {
  // Use auth hook
  const auth = useAuth();

  // Navigation state
  const [gameState, setGameState] = useState<GameState>('start');
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  // Game results
  const [gameResults, setGameResults] = useState<CompleteGameResponse | null>(null);
  const [finalStrikes, setFinalStrikes] = useState(0);
  const [timerEnabled, setTimerEnabled] = useState(true);

  // Handle mode selection from start screen
  const handleSelectMode = async (mode: GameMode) => {
    setGameMode(mode);

    if (mode === 'endless') {
      // Start game immediately for endless mode
      setGameState('playing');
    } else {
      // For other modes, go to difficulty selection
      setGameState('difficulty-selection');
    }
  };

  // Handle difficulty selection (for non-endless modes)
  const handleSelectDifficulty = async (_selectedDifficulty: string, useTimer: boolean) => {
    setTimerEnabled(useTimer);
    setGameState('playing');
    // Note: difficulty is passed to GameScreen via gameMode
  };

  // Handle menu click
  const handleMenuClick = () => {
    setShowMenu((prev) => !prev);
  };

  // Handle game completion
  const handleGameComplete = (results: CompleteGameResponse) => {
    setGameResults(results);
    setGameState('results');
  };

  // Reset game to start screen
  const resetGame = () => {
    setGameState('start');
    setGameMode(null);
    setGameResults(null);
    setFinalStrikes(0);
  };

  // Handle logout
  const handleLogout = () => {
    auth.handleLogout();
    resetGame();
  };

  // Render different states

  // Show landing page first if user hasn't seen it yet
  if (showLanding) {
    return <LandingPage onStart={() => {
      setShowLanding(false);
      // Automatically continue as guest after landing page
      auth.handleContinueAsGuest();
    }} />;
  }

  // Show auth screens if not authenticated or guest
  if (auth.authState === 'login') {
    return (
      <Login
        onLoginSuccess={auth.handleLoginSuccess}
        onSwitchToSignUp={auth.switchToSignup}
        onSkip={auth.handleContinueAsGuest}
      />
    );
  }

  if (auth.authState === 'signup') {
    return (
      <SignUp
        onSignUpSuccess={auth.handleSignUpSuccess}
        onSwitchToLogin={auth.switchToLogin}
      />
    );
  }

  // User is authenticated or guest - show game
  if (gameState === 'start') {
    return (
      <div className="app">
        <StartScreen
          onSelectMode={handleSelectMode}
          onMenuClick={handleMenuClick}
        />

        {/* Global Menu Overlay */}
        <Menu
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
          user={auth.user}
          isGuest={auth.isGuest}
          onProfile={() => setGameState('profile')}
          onSettings={() => setGameState('settings')}
          onHistory={() => setGameState('history')}
          onWordLookup={() => setGameState('word-lookup')}
          onLogout={handleLogout}
          onLogin={auth.switchToLogin}
        />
      </div>
    );
  }

  if (gameState === 'difficulty-selection') {
    return (
      <div className="app">
        <DifficultySelection onSelectDifficulty={handleSelectDifficulty} />
      </div>
    );
  }

  if (gameState === 'playing') {
    return (
      <GameScreen
        mode={gameMode}
        userId={auth.user?.id}
        user={auth.user}
        isGuest={auth.isGuest}
        useTimer={timerEnabled}
        onGameComplete={handleGameComplete}
        onExit={resetGame}
        onProfile={() => setGameState('profile')}
        onSettings={() => setGameState('settings')}
        onHistory={() => setGameState('history')}
        onWordLookup={() => setGameState('word-lookup')}
        onLogout={handleLogout}
        onLogin={auth.switchToLogin}
      />
    );
  }

  if (gameState === 'game-over') {
    return (
      <div className="app">
        <GameOver onRestart={resetGame} />
      </div>
    );
  }

  if (gameState === 'results' && gameResults) {
    return (
      <div className="app">
        <GameResults
          results={gameResults}
          onPlayAgain={resetGame}
          strikes={finalStrikes}
          timerEnabled={timerEnabled}
        />
      </div>
    );
  }

  if (gameState === 'history') {
    return (
      <div className="app">
        <GameHistory
          onBack={() => setGameState('start')}
          onMenuClick={handleMenuClick}
          userId={auth.user?.id}
        />

        {/* Global Menu Overlay */}
        <Menu
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
          user={auth.user}
          isGuest={auth.isGuest}
          onProfile={() => setGameState('profile')}
          onSettings={() => setGameState('settings')}
          onHistory={() => setGameState('history')}
          onWordLookup={() => setGameState('word-lookup')}
          onLogout={handleLogout}
          onLogin={auth.switchToLogin}
        />
      </div>
    );
  }

  if (gameState === 'word-lookup') {
    return (
      <div className="app">
        <WordLookup
          onBack={() => setGameState('start')}
          onMenuClick={handleMenuClick}
          userId={auth.user?.id}
        />

        {/* Global Menu Overlay */}
        <Menu
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
          user={auth.user}
          isGuest={auth.isGuest}
          onProfile={() => setGameState('profile')}
          onSettings={() => setGameState('settings')}
          onHistory={() => setGameState('history')}
          onWordLookup={() => setGameState('word-lookup')}
          onLogout={handleLogout}
          onLogin={auth.switchToLogin}
        />
      </div>
    );
  }

  if (gameState === 'profile') {
    return (
      <div className="app">
        <Profile
          user={auth.user}
          onBack={() => setGameState('start')}
          onMenuClick={handleMenuClick}
          onLogout={handleLogout}
          onUpdateProfile={auth.handleUpdateProfile}
        />

        {/* Global Menu Overlay */}
        <Menu
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
          user={auth.user}
          isGuest={auth.isGuest}
          onProfile={() => setGameState('profile')}
          onSettings={() => setGameState('settings')}
          onHistory={() => setGameState('history')}
          onWordLookup={() => setGameState('word-lookup')}
          onLogout={handleLogout}
          onLogin={auth.switchToLogin}
        />
      </div>
    );
  }

  if (gameState === 'settings') {
    return (
      <div className="app">
        <Settings
          user={auth.user}
          onBack={() => setGameState('start')}
          onMenuClick={handleMenuClick}
        />

        {/* Global Menu Overlay */}
        <Menu
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
          user={auth.user}
          isGuest={auth.isGuest}
          onProfile={() => setGameState('profile')}
          onSettings={() => setGameState('settings')}
          onHistory={() => setGameState('history')}
          onWordLookup={() => setGameState('word-lookup')}
          onLogout={handleLogout}
          onLogin={auth.switchToLogin}
        />
      </div>
    );
  }

  // Fallback to start screen
  return (
    <div className="app">
      <StartScreen
        onSelectMode={handleSelectMode}
        onMenuClick={handleMenuClick}
      />
    </div>
  );
}

export default App;
