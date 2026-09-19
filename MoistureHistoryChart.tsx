// MoistureHistoryChart.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  values: number[]; // raw ADC readings, oldest to newest
}

export default function MoistureHistoryChart({ values }: Props) {
  if (values.length === 0) {
    return <Text style={styles.empty}>No history yet — check back after a few readings</Text>;
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  return (
    <View>
      <View style={styles.chartRow}>
        {values.map((v, i) => {
          const heightPct = ((v - min) / range) * 100;
          return (
            <View key={i} style={styles.barWrap}>
              <View style={[styles.bar, { height: `${Math.max(heightPct, 4)}%` }]} />
            </View>
          );
        })}
      </View>
      <View style={styles.axisRow}>
        <Text style={styles.axisLabel}>Low: {min}</Text>
        <Text style={styles.axisLabel}>High: {max}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 3 },
  barWrap: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { backgroundColor: '#0F6E56', borderRadius: 2, minHeight: 4 },
  axisRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  axisLabel: { fontSize: 11, color: '#5F5E5A' },
  empty: { fontSize: 13, color: '#5F5E5A', textAlign: 'center', paddingVertical: 20 },
});