import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList, Housing } from '../App';

type DetailScreenRouteProp = RouteProp<RootStackParamList, 'Detail'>;

export default function DetailScreen() {
  const route = useRoute<DetailScreenRouteProp>();
  const item: Housing = route.params.item;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>매물 상세 정보</Text>
      <Text style={styles.item}>{`주소: ${String(item.address ?? '-')}`}</Text>
      <Text style={styles.item}>{`매물명: ${String(item.label ?? '-')}`}</Text>
      <Text style={styles.item}>{`보증금: ${item.deposit ?? '-'}만원`}</Text>
      <Text style={styles.item}>{`월세: ${item.monthlyRent ?? '-'}`}</Text>
      <Text style={styles.item}>{`면적: ${item.area_m2 ?? '-'}㎡ (약 ${item.pyeong ?? '-'}평)`}</Text>
      <Text style={styles.item}>{`계약일: ${item.contractDate ?? '정보 없음'}`}</Text>
      <Text style={styles.item}>{`유형: ${item.type ?? '-'}`}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  item: {
    fontSize: 16,
    marginBottom: 10,
  },
});
