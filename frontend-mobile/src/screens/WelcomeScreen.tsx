import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

export default function WelcomeScreen({
  onGoLogin,
  onGoRecovery,
}: {
  onGoLogin: () => void;
  onGoRecovery: () => void;
}) {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
      <Text style={{ fontSize: 28, fontWeight: "800", marginBottom: 8 }}>Digital ID</Text>
      <Text style={{ opacity: 0.7, marginBottom: 24 }}>
        សូមចូលប្រើដោយ PIN ឬស្តារគណនី (Recovery)
      </Text>

      <TouchableOpacity
        onPress={onGoLogin}
        style={{
          height: 52,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#2563EB",
          marginBottom: 12,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "800" }}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onGoRecovery}
        style={{
          height: 52,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#111827",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "800" }}>Recovery</Text>
      </TouchableOpacity>
    </View>
  );
}
