import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';

type Housing = {
  label: string;
  lat: number;
  lng: number;
  type: string;
  address: string;
};

export default function HomeScreen() {
  const [housingData, setHousingData] = useState<Housing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://10.10.0.240:8000/housing-data') // ← 본인 서버 IP에 맞게
      .then((response) => {
        const items: Housing[] = response.data || [];
        const filtered = items.filter(item => !isNaN(item.lat) && !isNaN(item.lng));
        setHousingData(filtered);
        setLoading(false);
      })
      .catch((error) => {
        console.error("🚨 데이터 요청 실패:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 37.5665,
          longitude: 126.9780,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
      >
        {housingData.map((item, index) => (
          <Marker
            key={index}
            coordinate={{ latitude: item.lat, longitude: item.lng }}
            title={item.label}
            description={item.address}
            pinColor={
              item.type === '매매'
                ? 'red'
                : item.type === '전세'
                ? 'blue'
                : 'green'
            }
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});