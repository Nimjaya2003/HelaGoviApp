/**
 * HelaGovi App
 * @format
 */

import React, { useState, useEffect, useRef } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreen from './SplashScreen';
import AuthScreen from './AuthScreen';
import ZoneInfoScreen from './ZoneInfoScreen';
import HomeScreen from './HomeScreen';
import { Crop, emptyZoneCrops } from './plants';

const SESSION_DURATION_MS = 10 * 60 * 1000;

type Screen = 'zoneInfo' | 'home';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [showSplash, setShowSplash] = useState(true);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>('zoneInfo');
  const [zoneCrops, setZoneCrops] = useState<Crop[][]>(emptyZoneCrops());

  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  function handleLoginSuccess(token: string) {
    setIdToken(token);
    setScreen('zoneInfo'); // new farmers (and every fresh login) see zone info first
    setZoneCrops(emptyZoneCrops()); // starts empty — matches "new farmer has no crops" requirement

    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    logoutTimer.current = setTimeout(() => {
      setIdToken(null);
      setScreen('zoneInfo');
    }, SESSION_DURATION_MS);
  }

  useEffect(() => {
    return () => {
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {showSplash ? (
        <SplashScreen />
      ) : !idToken ? (
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      ) : screen === 'zoneInfo' ? (
        <ZoneInfoScreen
          zoneCrops={zoneCrops}
          onUpdate={setZoneCrops}
          onContinue={() => setScreen('home')}
        />
      ) : (
        <HomeScreen zoneCrops={zoneCrops} onManageZones={() => setScreen('zoneInfo')} />
      )}
    </SafeAreaProvider>
  );
}

export default App;