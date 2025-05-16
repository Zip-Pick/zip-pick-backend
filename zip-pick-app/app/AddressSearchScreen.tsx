import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddressSearch'>;

const KAKAO_REST_API_KEY = '18e911d85380035dff228cc1dba44960'; // 본인 키로 바꿔주세요

export default function AddressSearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false); // 검색을 실제로 실행했는지

  const searchAddress = async (text: string) => {
    setQuery(text);
    if (!text) {
      setResults([]);
      setSearched(false); // 입력이 없으면 검색 자체를 안한 상태로
      return;
    }
    setLoading(true);
    setSearched(false); // 검색 중에는 안내문구 안 띄움
    try {
      const res = await fetch(
        `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(text)}`,
        {
          headers: {
            Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
          },
        }
      );
      const data = await res.json();
      setResults(data.documents || []);
      setSearched(true); // 검색 결과 도착, 이후 안내문구 허용
    } catch (error) {
      setResults([]);
      setSearched(true);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="도로명/지번 주소를 입력해주세요."
        value={query}
        onChangeText={searchAddress}
        autoFocus
      />
      {loading && <ActivityIndicator style={{margin:10}} />}
      <FlatList
        data={results}
        keyExtractor={(item, idx) => idx.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              const selectedAddress = item.road_address?.address_name || item.address_name;
              navigation.navigate('Input', { selectedAddress });
            }}
          >
            <Text>{item.road_address?.address_name || item.address_name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          // '검색어가 입력됐고' + '검색 결과가 없고' + '검색을 실제 실행한 후' + '로딩 중이 아닐 때'만 안내
          (!loading && searched && query.length > 0 && results.length === 0) ? (
            <View style={{padding: 20, alignItems: 'center'}}>
              <Text style={{color: '#888'}}>검색 결과가 없습니다.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10 },
  item: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
});
