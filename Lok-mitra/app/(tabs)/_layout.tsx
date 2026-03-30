import { Tabs } from 'expo-router';
import React from 'react';
import { AnimatedTabIcon } from '@/components/navigation/AnimatedTabIcon';

const activeColor = '#FF7A1A';
const inactiveColor = '#74808E';

export default function CitizenTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: 4,
        },
        tabBarStyle: {
          height: 70,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopWidth: 1,
          borderTopColor: '#E8E4DC',
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon name="home" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="complaints"
        options={{
          title: 'Complaints',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon name="alert-circle" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="updates"
        options={{
          title: 'Updates',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon name="notifications" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon name="person" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
