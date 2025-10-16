import { Tabs } from "expo-router";

import React from "react";

import { Platform } from "react-native";

import { Colors } from "@/constants/Colors";

import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const tintColor = Colors.light.tint;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: tintColor,

        tabBarInactiveTintColor: "#262626",

        tabBarShowLabel: false,

        tabBarStyle: {
          backgroundColor: "#ffffff",

          position: "absolute",

          borderTopWidth: 0.5,

          borderTopColor: "#dbdbdb",

          elevation: 0,

          height: Platform.OS === "ios" ? 90 : 60,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={28}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="security"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "shield-checkmark" : "shield-checkmark-outline"}
              size={28}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="health"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "medkit" : "medkit-outline"}
              size={28}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
