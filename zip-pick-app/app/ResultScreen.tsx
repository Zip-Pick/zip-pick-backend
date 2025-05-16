import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import KakaoMap from '../components/KakaoMap';
import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Housing } from '../App';
import { GlobalState } from '../constants/GlobalState';

type ResultRouteProp = RouteProp<RootStackParamList, 'Result'>;
type ResultNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Result'>;

const { width, height } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.7;

export default function ResultScreen() {
  const navigation = useNavigation<ResultNavigationProp>();
  const route = useRoute<ResultRouteProp>();
  const { results, userInput, selectedItem: selectedFromRoute } = route.params;

  const [data, setData] = useState<Housing[]>(results);
  const [selectedItem, setSelectedItem] = useState<Housing | null>(selectedFromRoute ?? null);
  const flatListRef = useRef<FlatList>(null);

  // 🟦 사용자 입력 주소의 위도/경도 계산
  const [userMarker, setUserMarker] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (userInput && userInput.workplaceAddress) {
      // 서버에서 결과에 포함해주면 더 좋지만, 클라이언트에서 Kakao Geocoding 호출
      // 간단한 fetch로 좌표 가져오기 (Kakao REST API)
      (async () => {
        try {
          const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(
            userInput.workplaceAddress
          )}`;
          const res = await fetch(url, {
            headers: {
              Authorization: 'KakaoAK 18e911d85380035dff228cc1dba44960', // 자신의 Kakao REST API KEY로 교체!
            },
          });
          const json = await res.json();
          const doc = json.documents?.[0];
          if (doc) setUserMarker({ lat: parseFloat(doc.y), lng: parseFloat(doc.x) });
        } catch (e) {
          // 좌표 변환 실패 시 무시
        }
      })();
    }
  }, [userInput]);

  useFocusEffect(
    useCallback(() => {
      if (selectedFromRoute) {
        setSelectedItem(selectedFromRoute);
        const index = data.findIndex((item) => item.label === selectedFromRoute.label);
        if (index >= 0 && flatListRef.current) {
          flatListRef.current.scrollToIndex({ index, animated: true });
        }
      }
    }, [selectedFromRoute, data])
  );

  const toggleLike = (item: Housing) => {
    const exists = GlobalState.likedItems.some(
      (i) => i.label === item.label && i.lat === item.lat && i.lng === item.lng
    );

    if (exists) {
      GlobalState.likedItems = GlobalState.likedItems.filter(
        (i) => !(i.label === item.label && i.lat === item.lat && i.lng === item.lng)
      );
    } else {
      GlobalState.likedItems = [...GlobalState.likedItems, item];
    }

    setSelectedItem(item);
  };

  const handleMarkerClick = (label: string) => {
    const matched = data.find(item => item.label === label);
    if (matched) {
      setSelectedItem(matched);
      const index = data.findIndex((item) => item.label === label);
      if (index >= 0 && flatListRef.current) {
        flatListRef.current.scrollToIndex({ index, animated: true });
      }
    }
  };

  const renderItem = ({ item }: { item: Housing }) => (
    <TouchableOpacity
      style={[
        styles.card,
        selectedItem?.label === item.label && styles.cardSelected
      ]}
      onPress={() => {
        setSelectedItem(item);
        navigation.navigate('Detail', { item });
      }}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.address}>{String(item.address ?? '-')}</Text>
        <TouchableOpacity onPress={() => toggleLike(item)}>
          <Text
            style={{
              fontSize: 22,
              color: GlobalState.likedItems.some(
                i => i.label === item.label && i.lat === item.lat && i.lng === item.lng
              )
                ? 'red'
                : 'gray',
            }}
          >
            {GlobalState.likedItems.some(
              i => i.label === item.label && i.lat === item.lat && i.lng === item.lng
            )
              ? '♥︎'
              : '♡'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.labelText}>
        {'보증금 ' + String(item.deposit ?? '-') +
        ' / 월세 ' + String(item.monthlyRent ?? '-') +
        ' | ' + String(item.area_m2 ?? '-') + '㎡ (약 ' + String(item.pyeong ?? '-') + '평)'}
      </Text>
      <Text style={styles.labelText}>{'전용: ' + String(item.area_m2 ?? '-') + '㎡'}</Text>
      <Text style={styles.labelText}>{'계약일: ' + String(item.contractDate ?? '정보 없음')}</Text>
      <Text style={styles.labelText}>{'유형: ' + String(item.type ?? '-')}</Text>
      {item.commute_minutes !== undefined && (
        <Text style={styles.labelText}>예상 통근시간: {item.commute_minutes}분</Text>
      )}
    </TouchableOpacity>
  );

  if (!data || data.length === 0) {
    return (
      <View style={styles.loader}>
        <Text>추천 가능한 매물이 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KakaoMap
        height={height * 0.65}
        markers={Array.isArray(data) ? data.map(item => ({
          lat: item.lat,
          lng: item.lng,
          label: item.label,
          type: 'house', // 구분
        })) : []}
        userMarker={userMarker} // 🟦 입력 주소 마커
        center={
          selectedItem
            ? { lat: selectedItem.lat, lng: selectedItem.lng }
            : userMarker
              ? userMarker
              : undefined
        }
        onMarkerClick={handleMarkerClick}
      />

      <FlatList
        ref={flatListRef}
        data={data}
        style={styles.list}
        keyExtractor={(item, index) => `${item.label}-${item.lat}-${item.lng}-${index}`}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        initialNumToRender={10}
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH,
          offset: ITEM_WIDTH * index,
          index,
        })}
        onScrollToIndexFailed={({ index }) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index, animated: true });
          }, 500);
        }}
      />

      <TouchableOpacity
        style={styles.likeButton}
        onPress={() => navigation.navigate('Liked', {
          likedItems: GlobalState.likedItems,
          userInput,
        })}
      >
        <Text style={styles.likeText}>💖 찜한 매물 보기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width, height: height * 0.65 },
  list: { height: 120, paddingHorizontal: 4 },
  card: {
    padding: 6,
    margin: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 1,
    width: ITEM_WIDTH,
  },
  cardSelected: {
    borderColor: '#007aff',
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  labelText: {
    fontSize: 13,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeButton: {
    margin: 10,
    padding: 12,
    backgroundColor: '#fce4ec',
    borderRadius: 10,
    alignItems: 'center',
  },
  likeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d81b60',
  },
});
