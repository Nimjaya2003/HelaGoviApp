// SplashScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function SplashScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emblem}>HelaGovi</Text>
        <Text style={styles.tagline}>Your smart agri solution</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#173404' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emblem: { fontSize: 36, fontWeight: '700', color: '#EAF3DE', letterSpacing: 0.5 },
  tagline: { fontSize: 14, color: '#C0DD97', marginTop: 8 },
});