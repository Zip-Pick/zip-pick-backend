// LikedScreen.tsx (수정본)

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Housing } from '../App';
import { GlobalState } from '../constants/GlobalState';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export default function LikedScreen() {
  const navigation = useNavigation<Navigation>();
  const [likedItems, setLikedItems] = useState<Housing[]>([]);

  useFocusEffect(
    useCallback(() => {
      setLikedItems([...GlobalState.likedItems]);
    }, [])
  );

  const toggleUnlike = (item: Housing) => {
    const updated = GlobalState.likedItems.filter(
      (l) => !(l.label === item.label && l.lat === item.lat && l.lng === item.lng)
    );
    GlobalState.likedItems = [...updated];
    setLikedItems(updated);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>❤️ 찜한 매물 ({likedItems.length}개)</Text>

      <FlatList
        data={likedItems}
        keyExtractor={(item, index) => `${item.label}-${item.lat}-${item.lng}-${index}`}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              navigation.navigate('Result', {
                userInput: { deposit: '', area: '', type: '' },
                selectedItem: item,
              });
            }}
          >
            <View style={styles.headerRow}>
              <Text style={styles.address}>{String(item.address ?? '-')}</Text>
              <TouchableOpacity onPress={() => toggleUnlike(item)}>
                <Text style={styles.heart}>💔</Text>
              </TouchableOpacity>
            </View>
            <Text>{String(item.label ?? '-')}</Text>
            <Text>{`보증금: ${item.deposit ?? '-'} / 월세: ${item.monthlyRent ?? '-'}`}</Text>
            <Text>{`면적: ${item.area_m2 ?? '-'}㎡ (약 ${item.pyeong ?? '-'}평)`}</Text>
            <Text>{`계약일: ${item.contractDate ?? '정보 없음'}`}</Text>
            <Text>{`유형: ${item.type ?? '-'}`}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>🔙 추천 결과로 돌아가기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  list: { paddingBottom: 20 },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
  },
  address: { fontWeight: 'bold', flex: 1 },
  heart: { fontSize: 20, color: 'red', marginLeft: 10 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  backButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    alignItems: 'center',
  },
  backText: { fontSize: 16, color: '#555' },
});