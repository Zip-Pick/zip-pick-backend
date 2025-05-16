// app/hooks/useColorScheme.ts
import { ColorSchemeName, useColorScheme as _useColorScheme } from 'react-native';

// 실제 기기/에뮬레이터의 색상 모드 감지 (light/dark)
export function useColorScheme(): NonNullable<ColorSchemeName> {
  return _useColorScheme() ?? 'light';
}