import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, ClipboardList, Camera, User } from 'lucide-react-native';
import { Config } from '@/constants/Config';
import { Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Config.theme.colors.primary,
        tabBarInactiveTintColor: Config.theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Config.theme.colors.cardBackground,
          borderTopColor: Config.theme.colors.cardBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Panel',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="logs"
        options={{
          title: 'Diario',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="analyzer"
        options={{
          title: 'IA Scan',
          tabBarIcon: ({ color, size }) => <Camera color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
