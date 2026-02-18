import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';

export default function DebugRegisterScreen({ onBack, onFinish }: any) {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'blue', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ padding: 20, backgroundColor: 'white', borderRadius: 10 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'blue' }}>MINIMAL DEBUG SCREEN</Text>
                <Text>If you see this, Navigation is working.</Text>
                <Text>The issue is inside the real RegisterScreen imports.</Text>
            </View>
            <TouchableOpacity onPress={onBack} style={{ marginTop: 50, padding: 15, backgroundColor: 'white' }}>
                <Text style={{ color: 'blue' }}>GO BACK</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
