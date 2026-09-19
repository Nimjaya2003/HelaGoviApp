// ZoneInfoScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { Crop, ZONE_META, SUGGESTED_CROPS, newCrop } from './plants';

type Mode = 'login' | 'register' | 'confirm';

interface Props {
  zoneCrops: Crop[][];
  onUpdate: (zoneCrops: Crop[][]) => void;
  onContinue: () => void;
}

// One accent per zone, scaled by water need: deepest/coolest = highest need
const ZONE_ACCENTS = [
  { badgeBg: '#DCEEE7', badgeText: '#0F6E56', barColor: '#0F6E56', stripe: '#0F6E56' },
  { badgeBg: '#E6F1FB', badgeText: '#185FA5', barColor: '#378ADD', stripe: '#378ADD' },
  { badgeBg: '#FAEEDA', badgeText: '#854F0B', barColor: '#BA7517', stripe: '#BA7517' },
  { badgeBg: '#FAECE7', badgeText: '#993C1D', barColor: '#D85A30', stripe: '#D85A30' },
];

export default function ZoneInfoScreen({ zoneCrops, onUpdate, onContinue }: Props) {
  const [modalZone, setModalZone] = useState<number | null>(null);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const [cropName, setCropName] = useState('');

  function openAddModal(zoneIndex: number) {
    setModalZone(zoneIndex);
    setEditingCrop(null);
    setCropName('');
  }

  function openEditModal(zoneIndex: number, crop: Crop) {
    setModalZone(zoneIndex);
    setEditingCrop(crop);
    setCropName(crop.name);
  }

  function saveCrop() {
    if (modalZone === null || cropName.trim() === '') return;
    const updated = zoneCrops.map((arr) => [...arr]);
    if (editingCrop) {
      updated[modalZone] = updated[modalZone].map((c) =>
        c.id === editingCrop.id ? { ...c, name: cropName.trim() } : c,
      );
    } else {
      updated[modalZone] = [...updated[modalZone], newCrop(cropName.trim())];
    }
    onUpdate(updated);
    setModalZone(null);
  }

  function quickAdd(zoneIndex: number, name: string) {
    const updated = zoneCrops.map((arr) => [...arr]);
    updated[zoneIndex] = [...updated[zoneIndex], newCrop(name)];
    onUpdate(updated);
  }

  function removeCrop(zoneIndex: number, cropId: string) {
    const updated = zoneCrops.map((arr) => [...arr]);
    updated[zoneIndex] = updated[zoneIndex].filter((c) => c.id !== cropId);
    onUpdate(updated);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Your farm zones</Text>
        <Text style={styles.subtitle}>
          Zones are ranked by water need — Zone 1 needs the most, Zone 4 the least. Add the crops
          you're growing in each zone.
        </Text>

        {ZONE_META.map((meta, index) => {
          const accent = ZONE_ACCENTS[index];
          return (
            <View key={index} style={[styles.zoneCard, { borderLeftColor: accent.stripe }]}>
              <View style={styles.zoneHeaderRow}>
                <Text style={styles.zoneTitle}>{meta.title}</Text>
                <View style={[styles.zoneBadgeWrap, { backgroundColor: accent.badgeBg }]}>
                  <Text style={[styles.zoneBadge, { color: accent.badgeText }]}>
                    {meta.waterCategory}
                  </Text>
                </View>
              </View>
              <Text style={styles.zoneDesc}>{meta.description}</Text>

              <Text style={styles.subheading}>Your crops</Text>
              {zoneCrops[index].length === 0 ? (
                <Text style={styles.emptyText}>No crops added yet</Text>
              ) : (
                <View style={styles.chipRow}>
                  {zoneCrops[index].map((crop) => (
                    <TouchableOpacity
                      key={crop.id}
                      style={[styles.chip, { backgroundColor: accent.badgeBg }]}
                      onPress={() => openEditModal(index, crop)}
                    >
                      <Text style={[styles.chipText, { color: accent.badgeText }]}>{crop.name}</Text>
                      <TouchableOpacity onPress={() => removeCrop(index, crop.id)}>
                        <Text style={styles.chipRemove}> ×</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity style={styles.addButton} onPress={() => openAddModal(index)}>
                <Text style={[styles.addButtonText, { color: accent.barColor }]}>+ Add a crop</Text>
              </TouchableOpacity>

              <Text style={styles.subheading}>Suggested for this zone</Text>
              <View style={styles.chipRow}>
                {SUGGESTED_CROPS[index].map((name) => (
                  <TouchableOpacity
                    key={name}
                    style={[styles.suggestionChip, { borderColor: accent.barColor }]}
                    onPress={() => quickAdd(index, name)}
                  >
                    <Text style={[styles.suggestionChipText, { color: accent.barColor }]}>
                      + {name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}

        <TouchableOpacity style={styles.confirmButton} onPress={onContinue}>
          <Text style={styles.confirmButtonText}>Continue to dashboard</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modalZone !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingCrop ? 'Edit crop' : 'Add a crop'}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Crop name"
              placeholderTextColor="#B4B2A9"
              value={cropName}
              onChangeText={setCropName}
              autoFocus
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setModalZone(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={saveCrop}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F1EFE8' },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: '#173404' },
  subtitle: { fontSize: 13, color: '#5F5E5A', marginTop: 6, marginBottom: 20 },
  zoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  zoneHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  zoneTitle: { fontSize: 17, fontWeight: '700', color: '#173404' },
  zoneBadgeWrap: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  zoneBadge: { fontSize: 11, fontWeight: '700' },
  zoneDesc: { fontSize: 12, color: '#5F5E5A', marginTop: 8, marginBottom: 12, lineHeight: 18 },
  subheading: { fontSize: 12, fontWeight: '700', color: '#2C2C2A', marginTop: 8, marginBottom: 8 },
  emptyText: { fontSize: 12, color: '#888780', fontStyle: 'italic', marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  chipText: { fontSize: 12, fontWeight: '700' },
  chipRemove: { fontSize: 14, color: '#D85A30', fontWeight: '700', marginLeft: 4 },
  suggestionChip: {
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  suggestionChipText: { fontSize: 12, fontWeight: '600' },
  addButton: { alignSelf: 'flex-start', marginBottom: 6 },
  addButtonText: { fontSize: 13, fontWeight: '700' },
  confirmButton: {
    backgroundColor: '#173404',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#173404',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 22 },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14, color: '#2C2C2A' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D3D1C7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    marginBottom: 18,
  },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 14 },
  modalCancelText: { color: '#5F5E5A', fontSize: 13, fontWeight: '600' },
  modalSave: { backgroundColor: '#0F6E56', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
  modalSaveText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});