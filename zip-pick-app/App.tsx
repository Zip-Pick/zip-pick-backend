import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LogBox } from 'react-native';

import InputScreen from './app/InputScreen';
import ResultScreen from './app/ResultScreen';
import DetailScreen from './app/DetailScreen';
import LikedScreen from './app/LikedScreen';
import AddressSearchScreen from './app/AddressSearchScreen';

LogBox.ignoreLogs([
  'Text strings must be rendered within a <Text>',
]);

export type Housing = {
  label: string;
  lat: number;
  lng: number;
  type: string;
  address: string;
  deposit: string;
  monthlyRent?: string;
  area_m2?: number;
  pyeong?: number;
  contractDate?: string;
  commute_minutes?: number;
};

export const GlobalState = {
  likedItems: [] as Housing[],
};

export type RootStackParamList = {
  Input: { selectedAddress?: string };
  Result: {
    userInput: any;
    results: Housing[];
    selectedItem?: Housing;
    likedItems?: Housing[];
  };
  Detail: { item: Housing };
  Liked: {
    likedItems: Housing[];
    userInput: any;
  };
  AddressSearch: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Input">
        <Stack.Screen name="Input" component={InputScreen} options={{ title: 'ZIP-PICK 조건 입력' }} />
        <Stack.Screen name="Result" component={ResultScreen} options={{ title: '추천 결과' }} />
        <Stack.Screen name="Detail" component={DetailScreen} options={{ title: '매물 상세 정보' }} />
        <Stack.Screen name="Liked" component={LikedScreen} options={{ title: '찜한 매물 목록' }} />
        <Stack.Screen name="AddressSearch" component={AddressSearchScreen} options={{ title: '주소 검색' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}