import { View, type ViewProps, useColorScheme } from 'react-native';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const theme = useColorScheme() ?? 'light';
  const backgroundColor = theme === 'dark' ? (darkColor ?? '#000000') : (lightColor ?? '#ffffff');

  return (
    <View style={[{ backgroundColor }, style]} {...otherProps} />
  );
}