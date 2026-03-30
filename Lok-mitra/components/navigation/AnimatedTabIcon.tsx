import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AnimatedTabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
  size?: number;
};

export function AnimatedTabIcon({ name, focused, color, size = 22 }: AnimatedTabIconProps) {
  const scale = useRef(new Animated.Value(focused ? 1.08 : 1)).current;
  const translateY = useRef(new Animated.Value(focused ? -2 : 0)).current;
  const dotScale = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.08 : 1,
        friction: 6,
        tension: 160,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: focused ? -2 : 0,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(dotScale, {
        toValue: focused ? 1 : 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, dotScale, scale, translateY]);

  return (
    <View style={styles.wrapper}>
      <Animated.View style={{ transform: [{ scale }, { translateY }] }}>
        <Ionicons name={name} size={size} color={color} />
      </Animated.View>
      <Animated.View style={[styles.dot, { transform: [{ scale: dotScale }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 4,
    backgroundColor: '#FF7A1A',
  },
});
