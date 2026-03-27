import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme';

export default function ProfileScreen() {
    const { seller, logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({});

    useEffect(() => {
        api.get('/seller/profile').then(d => { setProfile(d); setForm({ full_name: d.full_name, momo_number: d.momo_number || '' }); });
    }, []);

    async function handleSave() {
        try {
            const d = await api.patch('/seller/profile', form);
            setProfile(d); setEditing(false);
            Alert.alert('Success', 'Profile updated!');
        } catch (err) { Alert.alert('Error', err.message); }
    }

    return (
        <ScrollView style={s.container}>
            <View style={s.avatarRow}>
                <View style={s.avatar}><Text style={s.avatarText}>{profile?.full_name?.charAt(0) || 'S'}</Text></View>
                <Text style={s.name}>{profile?.full_name}</Text>
                <Text style={s.email}>{profile?.email}</Text>
            </View>

            {!editing ? (
                <View style={s.card}>
                    <DetailRow label="Phone" value={profile?.phone} />
                    <DetailRow label="MoMo" value={profile?.momo_number || 'Not set'} />
                    <DetailRow label="KYC" value={profile?.kyc_status} />
                    <DetailRow label="Joined" value={profile ? new Date(profile.created_at).toLocaleDateString() : ''} />
                    <TouchableOpacity style={s.editBtn} onPress={() => setEditing(true)}>
                        <Text style={s.editBtnText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={s.card}>
                    <Text style={s.label}>FULL NAME</Text>
                    <TextInput style={s.input} value={form.full_name} onChangeText={v => setForm({ ...form, full_name: v })} />
                    <Text style={s.label}>MOMO NUMBER</Text>
                    <TextInput style={s.input} value={form.momo_number} onChangeText={v => setForm({ ...form, momo_number: v })} />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={s.editBtn} onPress={handleSave}><Text style={s.editBtnText}>Save</Text></TouchableOpacity>
                        <TouchableOpacity style={s.cancelBtn} onPress={() => setEditing(false)}><Text>Cancel</Text></TouchableOpacity>
                    </View>
                </View>
            )}

            <TouchableOpacity style={s.logoutBtn} onPress={logout}>
                <Text style={s.logoutText}>Logout</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

function DetailRow({ label, value }) {
    return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
            <Text style={{ color: Colors.textSecondary, fontWeight: '600' }}>{label}</Text>
            <Text style={{ color: Colors.text }}>{value}</Text>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg },
    avatarRow: { alignItems: 'center', marginBottom: Spacing.xl },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.brand, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
    avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
    name: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text },
    email: { fontSize: FontSizes.sm, color: Colors.textSecondary },
    card: { backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.lg },
    label: { fontSize: FontSizes.xs, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4, letterSpacing: 0.5 },
    input: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.sm, padding: Spacing.md, marginBottom: Spacing.md },
    editBtn: { backgroundColor: Colors.brand, padding: Spacing.md, borderRadius: BorderRadius.sm, alignItems: 'center', marginTop: Spacing.sm, flex: 1 },
    editBtnText: { color: '#fff', fontWeight: '600' },
    cancelBtn: { padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm, flex: 1 },
    logoutBtn: { padding: Spacing.md, borderRadius: BorderRadius.sm, alignItems: 'center', borderWidth: 1, borderColor: Colors.danger },
    logoutText: { color: Colors.danger, fontWeight: '600' },
});
