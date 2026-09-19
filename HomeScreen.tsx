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
import { Crop, ZONE_META } from './plants';
import MoistureHistoryChart from './MoistureHistoryChart';

const ZONE_LABELS: string[] = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4'];
const RAW_MAX = 4095;
const RAW_DRY_REFERENCE = 3400;
const RAW_WET_REFERENCE = 1200;

interface MoistureStatus {
  label: string;
  color: string;
}

function getMoistureStatus(raw: number): MoistureStatus {
  if (raw > 2800) return { label: 'Dry', color: '#D85A30' };
  if (raw > 1800) return { label: 'Moderate', color: '#BA7517' };
  return { label: 'Moist', color: '#0F6E56' };
}

function toBarPercent(raw: number): number {
  const clamped = Math.min(Math.max(raw, RAW_WET_REFERENCE), RAW_DRY_REFERENCE);
  const percent = 100 - ((clamped - RAW_WET_REFERENCE) / (RAW_DRY_REFERENCE - RAW_WET_REFERENCE)) * 100;
  return Math.round(percent);
}

async function fetchLatestReading() {
  const query = `
    query GetLatestReading($deviceId: String!) {
      getLatestReading(deviceId: $deviceId) {
        deviceId
        timestamp
        moistureZone1
        moistureZone2
        moistureZone3
        moistureZone4
      }
    }
  `;
  const response = await fetch(APPSYNC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify({ query, variables: { deviceId: 'esp32-01' } }),
  });
  const json = await response.json();
  if (json.errors) throw new Error(json.errors[0].message);

  const reading = json.data.getLatestReading;
  return reading ? [reading] : [];
}

async function fetchHistory() {
  const query = `
    query ListSensorReadings {
      listSensorReadings(limit: 100) {
        items {
          timestamp
          deviceId
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
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify({ query }),
  });
  const json = await response.json();
  if (json.errors) throw new Error(json.errors[0].message);

  const items = json.data.listSensorReadings.items
    .filter((r: any) => r.deviceId === 'esp32-01')
    .sort((a: any, b: any) => a.timestamp - b.timestamp)
    .slice(-20);

  return items;
}

async function fetchLatestAnimalEvent() {
  const query = `
    query GetLatestAnimalEvent($deviceId: String!) {
      getLatestAnimalEvent(deviceId: $deviceId) {
        deviceId
        timestamp
        detected
      }
    }
  `;
  const response = await fetch(APPSYNC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify({ query, variables: { deviceId: 'esp32-01' } }),
  });
  const json = await response.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data.getLatestAnimalEvent;
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
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify({
      query: mutation,
      variables: { deviceId: 'esp32-01', action, timestamp: Math.floor(Date.now() / 1000) },
    }),
  });
  const json = await response.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data.sendPumpCommand;
}

interface Props {
  zoneCrops: Crop[][];
  onManageZones: () => void;
}

export default function HomeScreen({ zoneCrops, onManageZones }: Props) {
  const [moistureData, setMoistureData] = useState<number[]>([0, 0, 0, 0]);
  const [historyAvg, setHistoryAvg] = useState<number[]>([]);
  const [deviceId, setDeviceId] = useState<string>('—');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [pumpLoading, setPumpLoading] = useState<boolean>(false);
  const [pumpResult, setPumpResult] = useState<string | null>(null);

  const [animalDetected, setAnimalDetected] = useState<boolean>(false);
  const [animalEventTime, setAnimalEventTime] = useState<Date | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
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
        }

        const historyItems = await fetchHistory();
        const averages = historyItems.map((r: any) => {
          const vals = [r.moistureZone1, r.moistureZone2, r.moistureZone3, r.moistureZone4].filter(
            (v) => v !== null && v !== undefined,
          );
          return vals.length > 0 ? Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length) : 0;
        });
        setHistoryAvg(averages);

        const animalEvent = await fetchLatestAnimalEvent();
        if (animalEvent) {
          setAnimalDetected(animalEvent.detected);
          setAnimalEventTime(new Date(animalEvent.timestamp * 1000));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
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
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>HelaGovi</Text>
            <Text style={styles.subtitle}>Smart plant protection & irrigation</Text>
          </View>
          <TouchableOpacity style={styles.manageButton} onPress={onManageZones}>
            <Text style={styles.manageButtonText}>Manage zones</Text>
          </TouchableOpacity>
        </View>

        {loading && <Text style={styles.status}>Loading...</Text>}
        {error && <Text style={styles.error}>{error}</Text>}

        {!loading && !error && (
          <>
            {animalDetected && (
              <View style={styles.alertCard}>
                <Text style={styles.alertTitle}>⚠ Animal detected</Text>
                <Text style={styles.alertSubtitle}>
                  {animalEventTime ? animalEventTime.toLocaleString() : ''}
                </Text>
              </View>
            )}

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
              <Text style={styles.cardTitle}>Moisture history (average across zones)</Text>
              <MoistureHistoryChart values={historyAvg} />
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

            <Text style={styles.sectionHeading}>Soil moisture by zone (raw ADC)</Text>
            {moistureData.map((value: number, index: number) => {
              const status = getMoistureStatus(value);
              const barWidth = toBarPercent(value);
              const crops = zoneCrops[index];
              return (
                <View key={index} style={styles.zoneCard}>
                  <View style={styles.zoneHeader}>
                    <Text style={styles.zoneLabel}>{ZONE_LABELS[index]}</Text>
                    <Text style={[styles.statusBadge, { color: status.color }]}>
                      {status.label}
                    </Text>
                  </View>
                  {crops.length > 0 && (
                    <Text style={styles.cropTag}>
                      {crops.map((c) => c.name).join(', ')}
                    </Text>
                  )}
                  <View style={styles.barBackground}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${barWidth}%`, backgroundColor: status.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.zoneValue}>Raw: {value} / {RAW_MAX}</Text>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#173404' },
  subtitle: { fontSize: 14, color: '#5F5E5A' },
  manageButton: { backgroundColor: '#173404', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  manageButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  status: { fontSize: 14, color: '#5F5E5A', marginTop: 10 },
  error: { fontSize: 14, color: '#D85A30', marginTop: 10 },
  alertCard: {
    backgroundColor: '#FAECE7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#D85A30',
  },
  alertTitle: { fontSize: 15, fontWeight: '700', color: '#712B13' },
  alertSubtitle: { fontSize: 12, color: '#993C1D', marginTop: 4 },
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
  zoneHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  zoneLabel: { fontSize: 15, fontWeight: '600', color: '#2C2C2A' },
  statusBadge: { fontSize: 13, fontWeight: '600' },
  cropTag: { fontSize: 12, color: '#0F6E56', marginBottom: 8 },
  barBackground: { height: 10, backgroundColor: '#EAEAE3', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  zoneValue: { fontSize: 13, color: '#5F5E5A', marginTop: 6 },
  pumpButtonRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  pumpButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  pumpButtonOn: { backgroundColor: '#0F6E56' },
  pumpButtonOff: { backgroundColor: '#D85A30' },
  pumpButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
});