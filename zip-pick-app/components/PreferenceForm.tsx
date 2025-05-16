import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Input'>;

interface PreferenceFormProps {
  onSubmit: (formData: any) => void;
  selectedAddress?: string;
}

export default function PreferenceForm({ onSubmit, selectedAddress }: PreferenceFormProps) {
  const navigation = useNavigation<NavigationProp>();

  const [address, setAddress] = useState('');
  const [dealType, setDealType] = useState('전세');
  const [deposit, setDeposit] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [needAreaPyeong, setNeedAreaPyeong] = useState('');
  const [arrivalHour, setArrivalHour] = useState('8');
  const [arrivalMinute, setArrivalMinute] = useState('30');
  // 출근 소요 가능 시간(분) 추가!
  const [commuteTimeLimit, setCommuteTimeLimit] = useState('30');

  useEffect(() => {
    if (selectedAddress) {
      setAddress(selectedAddress);
    }
  }, [selectedAddress]);

  const needAreaM2 = needAreaPyeong ? (parseFloat(needAreaPyeong) * 3.305785).toFixed(1) : '';

  const handleSubmit = () => {
    if (!address || !deposit || !needAreaPyeong) {
      alert('회사 주소, 예산, 면적을 모두 입력해주세요.');
      return;
    }

    const expectedArrivalMinutes = parseInt(arrivalHour) * 60 + parseInt(arrivalMinute);

    const payload = {
      workplaceAddress: address,
      type: dealType,
      deposit: parseInt(deposit),
      monthly: dealType === '월세' ? parseInt(monthlyRent || '0') : 0,
      area: parseFloat(needAreaM2),
      expectedArrivalMinutes,
      commuteTimeLimit: parseInt(commuteTimeLimit), // 출근 소요 가능 시간(분) 추가!
    };

    onSubmit(payload);
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>회사/학교 주소</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, marginBottom: 10 }}>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="주소를 선택하거나 입력하세요"
          style={{ flex: 1, padding: 10 }}
          editable={false}
        />
        <TouchableOpacity onPress={() => navigation.navigate('AddressSearch')}>
          <Text style={{ padding: 10, color: 'blue' }}>검색</Text>
        </TouchableOpacity>
      </View>

      <Text>거래유형</Text>
      <Picker selectedValue={dealType} onValueChange={setDealType}>
        <Picker.Item label="전세" value="전세" />
        <Picker.Item label="월세" value="월세" />
        <Picker.Item label="매매" value="매매" />
      </Picker>

      {dealType === '월세' ? (
        <>
          <Text>보증금 (만원)</Text>
          <TextInput value={deposit} onChangeText={setDeposit} keyboardType="numeric" style={{ borderWidth: 1 }} />
          <Text>월세금액 (만원)</Text>
          <TextInput value={monthlyRent} onChangeText={setMonthlyRent} keyboardType="numeric" style={{ borderWidth: 1 }} />
        </>
      ) : (
        <>
          <Text>최대 예산 (만원)</Text>
          <TextInput value={deposit} onChangeText={setDeposit} keyboardType="numeric" style={{ borderWidth: 1 }} />
        </>
      )}

      <Text>필요 면적 (평)</Text>
      <TextInput
        value={needAreaPyeong}
        onChangeText={setNeedAreaPyeong}
        keyboardType="numeric"
        style={{ borderWidth: 1 }}
      />
      {needAreaM2 && <Text>⇒ 약 {needAreaM2}㎡</Text>}

      <Text style={{ marginTop: 10 }}>도착 희망 시간</Text>
      <View style={{ flexDirection: 'row' }}>
        <Picker
          selectedValue={arrivalHour}
          onValueChange={setArrivalHour}
          style={{ flex: 1 }}
        >
          {[...Array(24).keys()].map((h) => (
            <Picker.Item key={h} label={`${h}시`} value={String(h)} />
          ))}
        </Picker>

        <Picker
          selectedValue={arrivalMinute}
          onValueChange={setArrivalMinute}
          style={{ flex: 1 }}
        >
          {[...Array(60).keys()].map((m) => (
            <Picker.Item key={m} label={`${m}분`} value={String(m)} />
          ))}
        </Picker>
      </View>

      {/* 🔥 추가: 출근 소요 가능 시간 입력 */}
      <Text style={{ marginTop: 10 }}>출근 소요 가능 시간 (분)</Text>
      <TextInput
        value={commuteTimeLimit}
        onChangeText={setCommuteTimeLimit}
        placeholder="30"
        keyboardType="numeric"
        style={{ borderWidth: 1, marginBottom: 10 }}
      />

      <Button title="추천 지역 찾기" onPress={handleSubmit} />
    </View>
  );
}
