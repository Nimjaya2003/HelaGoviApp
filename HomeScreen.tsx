// HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';

import { APPSYNC_URL, API_KEY } from '@env';

const ZONE_LABELS: string[] = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4'];

interface MoistureStatus {
  label: string;
  color: string;
}

function getMoistureStatus(value: number): MoistureStatus {
  if (value < 30) return { label: 'Dry', color: '#D85A30' };
  if (value < 60) return { label: 'Moderate', color: '#BA7517' };
  return { label: 'Moist', color: '#0F6E56' };
}

async function fetchLatestReading() {
  const query = `
    query ListSensorReadings {
      listSensorReadings(limit: 1) {
        items {
          deviceId
          timestamp
          moistureZone1
          moistureZone2
          moistureZone3
          moistureZone4
        }
      }
    }
  `;

  const response = await fetch(APPSYNC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({ query }),
  });

  const json = await response.json();

  if (json.errors) {
    console.error('GraphQL errors:', json.errors);
    throw new Error(json.errors[0].message);
  }

  return json.data.listSensorReadings.items;
}

async function sendPumpCommand(action: string) {
  const mutation = `
    mutation SendPumpCommand($deviceId: String!, $action: String, $timestamp: Int!) {
      sendPumpCommand(deviceId: $deviceId, action: $action, timestamp: $timestamp) {
        success
        message
        timestamp
      }
    }
  `;

  const response = await fetch(APPSYNC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        deviceId: 'esp32-01',
        action,
        timestamp: Math.floor(Date.now() / 1000),
      },
    }),
  });

  const json = await response.json();

  if (json.errors) {
    console.error('GraphQL errors:', json.errors);
    throw new Error(json.errors[0].message);
  }

  return json.data.sendPumpCommand;
}

export default function HomeScreen() {
  const [moistureData, setMoistureData] = useState<number[]>([0, 0, 0, 0]);
  const [deviceId, setDeviceId] = useState<string>('—');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [pumpLoading, setPumpLoading] = useState<boolean>(false);
  const [pumpResult, setPumpResult] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const items = await fetchLatestReading();
        if (items.length > 0) {
          const latest = items[0];
          setMoistureData([
            latest.moistureZone1 ?? 0,
            latest.moistureZone2 ?? 0,
            latest.moistureZone3 ?? 0,
            latest.moistureZone4 ?? 0,
          ]);
          setDeviceId(latest.deviceId);
          setLastUpdated(new Date(latest.timestamp * 1000));
        } else {
          setError('No readings found in the table yet.');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  async function handlePumpToggle(action: string) {
    setPumpLoading(true);
    setPumpResult(null);
    try {
      const result = await sendPumpCommand(action);
      setPumpResult(result.message);
    } catch (err: any) {
      setPumpResult('Error: ' + err.message);
    } finally {
      setPumpLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>HelaGovi</Text>
        <Text style={styles.subtitle}>Smart plant protection & irrigation</Text>

        {loading && <Text style={styles.status}>Loading...</Text>}
        {error && <Text style={styles.error}>{error}</Text>}

        {!loading && !error && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Device status</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Device ID</Text>
                <Text style={styles.value}>{deviceId}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Last updated</Text>
                <Text style={styles.value}>
                  {lastUpdated ? lastUpdated.toLocaleString() : '—'}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Pump control</Text>
              <View style={styles.pumpButtonRow}>
                <TouchableOpacity
                  style={[styles.pumpButton, styles.pumpButtonOn]}
                  onPress={() => handlePumpToggle('ON')}
                  disabled={pumpLoading}
                >
                  <Text style={styles.pumpButtonText}>Turn ON</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pumpButton, styles.pumpButtonOff]}
                  onPress={() => handlePumpToggle('OFF')}
                  disabled={pumpLoading}
                >
                  <Text style={styles.pumpButtonText}>Turn OFF</Text>
                </TouchableOpacity>
              </View>
              {pumpLoading && <Text style={styles.status}>Sending command...</Text>}
              {pumpResult && <Text style={styles.status}>{pumpResult}</Text>}
            </View>

            <Text style={styles.sectionHeading}>Soil moisture by zone</Text>
            {moistureData.map((value: number, index: number) => {
              const status = getMoistureStatus(value);
              return (
                <View key={index} style={styles.zoneCard}>
                  <View style={styles.zoneHeader}>
                    <Text style={styles.zoneLabel}>{ZONE_LABELS[index]}</Text>
                    <Text style={[styles.statusBadge, { color: status.color }]}>
                      {status.label}
                    </Text>
                  </View>
                  <View style={styles.barBackground}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${value}%`, backgroundColor: status.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.zoneValue}>{value}%</Text>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F1EFE8' },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#173404' },
  subtitle: { fontSize: 14, color: '#5F5E5A', marginBottom: 20 },
  status: { fontSize: 14, color: '#5F5E5A', marginTop: 10 },
  error: { fontSize: 14, color: '#D85A30', marginTop: 10 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 10, color: '#2C2C2A' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 13, color: '#5F5E5A' },
  value: { fontSize: 13, fontWeight: '600', color: '#2C2C2A' },
  sectionHeading: { fontSize: 17, fontWeight: '600', marginBottom: 12, color: '#2C2C2A' },
  zoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  zoneHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  zoneLabel: { fontSize: 15, fontWeight: '600', color: '#2C2C2A' },
  statusBadge: { fontSize: 13, fontWeight: '600' },
  barBackground: {
    height: 10,
    backgroundColor: '#EAEAE3',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 5 },
  zoneValue: { fontSize: 13, color: '#5F5E5A', marginTop: 6 },
  pumpButtonRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  pumpButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  pumpButtonOn: { backgroundColor: '#0F6E56' },
  pumpButtonOff: { backgroundColor: '#D85A30' },
  pumpButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
});