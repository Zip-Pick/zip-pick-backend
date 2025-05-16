// app/hooks/useThemeColor.ts

import { useColorScheme } from './useColorScheme'; // 너가 만든 fallback 훅

const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
  },
};

type ColorType = keyof typeof Colors['light'];

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ColorType
) {
  const theme = useColorScheme(); // fallback 적용된 버전 사용!
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }

  return Colors[theme][colorName];
}