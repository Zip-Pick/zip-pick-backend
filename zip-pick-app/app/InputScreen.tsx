import React from 'react';
import { View, Alert } from 'react-native';
import PreferenceForm from '../components/PreferenceForm';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { RouteProp } from '@react-navigation/native';

type InputScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Input'>;
type InputScreenRouteProp = RouteProp<RootStackParamList, 'Input'>;

export default function InputScreen() {
  const navigation = useNavigation<InputScreenNavigationProp>();
  const route = useRoute<InputScreenRouteProp>();

  const handleSubmit = async (formData: any) => {
    // 모든 조건을 서버 쿼리에 포함!
    const address = formData.workplaceAddress || '';
    const expectedArrival = formData.expectedArrivalMinutes || 540;
    const commuteTimeLimit = formData.commuteTimeLimit || 30;
    const deposit = formData.deposit || 99999999;
    const monthly = formData.monthly || 99999999;
    const area = formData.area || 0;

    try {
      const url = `http://10.10.0.240:8000/commute-from-address?` +
        `address=${encodeURIComponent(address)}` +
        `&expected_arrival=${expectedArrival}` +
        `&commuteTimeLimit=${commuteTimeLimit}` +
        `&deposit=${deposit}` +
        `&monthly=${monthly}` +
        `&area=${area}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!data || data.length === 0) {
        Alert.alert("매물이 없습니다", "모든 조건을 만족하는 매물이 없습니다.");
        return;
      }

      navigation.navigate('Result', {
        userInput: formData,
        results: data,
      });
    } catch (error) {
      console.error("주소 처리 실패:", error);
      Alert.alert("오류 발생", "주소를 변환하거나 데이터를 가져오는 데 실패했습니다.");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <PreferenceForm
        onSubmit={handleSubmit}
        selectedAddress={route.params?.selectedAddress || ''}
      />
    </View>
  );
}
