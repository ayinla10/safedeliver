import React, { useState, useEffect } from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl, StatusBar as RNStatusBar, Alert, ActivityIndicator, Image, Modal, TextInput, Platform, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';

export default function AdminKYCScreen({ navigation }) {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchApps();
    }, []);

    const fetchApps = async () => {
        setLoading(true);
        try {
            const data = await api.get('/admin/kyc-applications?status=PENDING');
            setApps(data);
        } catch (err) {
            console.error('Fetch KYC apps error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        try {
            if (action === 'REJECT' && !rejectReason) {
                Alert.alert('Required', 'Please provide a reason for rejection.');
                return;
            }

            await api.patch(`/admin/kyc-applications/${id}`, {
                action: action,
                rejection_reason: action === 'REJECT' ? rejectReason : undefined
            });

            Alert.alert('Success', `Application ${action}ED successfully.`);
            setShowModal(false);
            setRejectReason('');
            fetchApps();
        } catch (err) {
            Alert.alert('Error', err.message);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <RNStatusBar barStyle="light-content" backgroundColor="#0a0b10" />
            
            <View style={styles.header}>
                <Text style={styles.headerTitle}>KYC Review</Text>
                <Text style={styles.headerSub}>{apps.length} Pending Applications</Text>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchApps} tintColor="#2B7DE9" />}
            >
                {apps.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="documents-outline" size={48} color="rgba(255,255,255,0.05)" />
                        <Text style={styles.emptyText}>{loading ? 'Loading applications...' : 'All caught up! No pending KYC.'}</Text>
                    </View>
                ) : (
                    apps.map((app) => (
                        <TouchableOpacity 
                            key={app.id} 
                            style={styles.appCard}
                            onPress={() => { setSelectedApp(app); setShowModal(true); }}
                        >
                            <View style={styles.cardInfo}>
                                <Text style={styles.sellerName}>{app.seller_name}</Text>
                                <Text style={styles.sellerDetails}>{app.seller_email} • Tier {app.current_tier} → {app.target_tier}</Text>
                                <Text style={styles.timeText}>Applied: {new Date(app.created_at).toLocaleDateString()}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#64748B" />
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* Application Detail Modal */}
            <Modal visible={showModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Review Application</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Ionicons name="close" size={24} color="#F1F5F9" />
                            </TouchableOpacity>
                        </View>

                        {selectedApp && (
                            <ScrollView style={styles.modalBody}>
                                <View style={styles.infoSection}>
                                    <Text style={styles.infoLabel}>Seller Name</Text>
                                    <Text style={styles.infoValue}>{selectedApp.seller_name}</Text>
                                </View>
                                
                                <View style={styles.infoSection}>
                                    <Text style={styles.infoLabel}>Requested Tier</Text>
                                    <Text style={styles.infoValue}>Tier {selectedApp.target_tier}</Text>
                                </View>

                                <View style={styles.docSection}>
                                    <Text style={styles.infoLabel}>Selfie with ID</Text>
                                    <View style={styles.imagePlaceholder}>
                                        <Ionicons name="image-outline" size={48} color="#34343a" />
                                        <Text style={styles.imagePlaceholderText}>Image would be shown here 🔗</Text>
                                        <Text style={styles.linkText}>{selectedApp.selfie_url || 'No selfie provided'}</Text>
                                    </View>
                                </View>

                                <View style={styles.docSection}>
                                    <Text style={styles.infoLabel}>Government ID Card</Text>
                                    <View style={styles.imagePlaceholder}>
                                        <Ionicons name="card-outline" size={48} color="#34343a" />
                                        <Text style={styles.imagePlaceholderText}>Image would be shown here 🔗</Text>
                                        <Text style={styles.linkText}>{selectedApp.id_card_url || 'No ID provided'}</Text>
                                    </View>
                                </View>

                                <View style={styles.rejectGroup}>
                                    <Text style={styles.infoLabel}>Rejection Reason (if rejecting)</Text>
                                    <TextInput 
                                        style={styles.reasonInput}
                                        placeholder="e.g. ID is blurry, Name doesn't match"
                                        placeholderTextColor="#64748B"
                                        multiline
                                        value={rejectReason}
                                        onChangeText={setRejectReason}
                                    />
                                </View>

                                <View style={styles.modalActions}>
                                    <TouchableOpacity 
                                        style={[styles.modalBtn, styles.rejectBtn]}
                                        onPress={() => handleAction(selectedApp.id, 'REJECT')}
                                    >
                                        <Text style={styles.rejectText}>Reject Application</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                        style={[styles.modalBtn, styles.approveBtn]}
                                        onPress={() => handleAction(selectedApp.id, 'APPROVE')}
                                    >
                                        <Text style={styles.approveText}>Approve & Upgrade</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0b10',
        paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 4 : 0,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
    },
    headerSub: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 4,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    appCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#12131a',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    cardInfo: {
        flex: 1,
    },
    sellerName: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    sellerDetails: {
        color: '#64748B',
        fontSize: 12,
        marginBottom: 4,
    },
    timeText: {
        color: '#2B7DE9',
        fontSize: 10,
        fontWeight: '600',
    },
    emptyState: {
        paddingVertical: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#64748B',
        fontSize: 16,
        marginTop: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#12131a',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '90%',
        paddingTop: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    modalTitle: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '700',
    },
    modalBody: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    infoSection: {
        marginBottom: 16,
    },
    infoLabel: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    infoValue: {
        color: '#F1F5F9',
        fontSize: 16,
        fontWeight: '600',
    },
    docSection: {
        marginBottom: 24,
    },
    imagePlaceholder: {
        width: '100%',
        height: 160,
        backgroundColor: '#0a0b10',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    imagePlaceholderText: {
        color: '#64748B',
        fontSize: 12,
        marginTop: 8,
    },
    linkText: {
        color: '#2B7DE9',
        fontSize: 10,
        marginTop: 4,
        textAlign: 'center',
    },
    rejectGroup: {
        marginBottom: 24,
    },
    reasonInput: {
        backgroundColor: '#0a0b10',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        color: '#F1F5F9',
        padding: 16,
        height: 80,
        textAlignVertical: 'top',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 40,
    },
    modalBtn: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rejectBtn: {
        backgroundColor: '#EF444415',
        borderWidth: 1,
        borderColor: '#EF444430',
    },
    rejectText: {
        color: '#EF4444',
        fontWeight: '700',
    },
    approveBtn: {
        backgroundColor: '#22C55E',
    },
    approveText: {
        color: '#ffffff',
        fontWeight: '700',
    }
});
