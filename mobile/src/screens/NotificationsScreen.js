import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSizes } from '../theme';

export default function NotificationsScreen() {
    return (
        <View style={s.container}>
            <Text style={s.title}>Notifications</Text>
            <View style={s.empty}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>🔔</Text>
                <Text style={s.emptyText}>No notifications yet</Text>
                <Text style={s.hint}>You will see order updates and alerts here</Text>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg },
    title: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.lg },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: Colors.textSecondary, fontSize: FontSizes.md, fontWeight: '600' },
    hint: { color: Colors.textSecondary, fontSize: FontSizes.sm, marginTop: 4 },
});
