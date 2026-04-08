import React, { useState, useEffect, useMemo } from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl, StatusBar as RNStatusBar, Alert, ActivityIndicator, Image, Modal, TextInput, Platform, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { api } from '../api';

export default function AdminKYCScreen({ navigation }) {
    const { colors } = useTheme();
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

    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <SafeAreaView style={styles.container}>
            <RNStatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
            
            <View style={styles.header}>
                <Text style={styles.headerTitle}>KYC Review</Text>
                <Text style={styles.headerSub}>{apps.length} Pending Applications</Text>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchApps} tintColor={colors.brand} />}
            >
                {apps.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="documents-outline" size={64} color={colors.border} />
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
                            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
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
                            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.modalCloseBtn}>
                                <Ionicons name="close" size={24} color={colors.text} />
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

                                {/* AI Verification Insights */}
                                <View style={styles.aiSection}>
                                    <View style={styles.aiHeader}>
                                        <Ionicons name="shield-checkmark" size={20} color={colors.success} />
                                        <Text style={styles.aiTitle}>AI Verification Signals</Text>
                                    </View>
                                    
                                    <View style={styles.aiGrid}>
                                        <View style={styles.aiCard}>
                                            <Text style={styles.aiLabel}>Face Match</Text>
                                            <Text style={[styles.aiValue, { color: selectedApp.auto_verify_score > 70 ? colors.success : colors.warning }]}>
                                                {selectedApp.auto_verify_score ? `${selectedApp.auto_verify_score}%` : 'N/A'}
                                            </Text>
                                        </View>
                                        <View style={styles.aiCard}>
                                            <Text style={styles.aiLabel}>Status</Text>
                                            <Text style={[styles.aiValue, { color: selectedApp.is_auto_verified ? colors.success : colors.danger }]}>
                                                {selectedApp.is_auto_verified ? 'VERIFIED' : 'FLAGGED'}
                                            </Text>
                                        </View>
                                    </View>

                                    {selectedApp.verification_error && (
                                        <Text style={styles.aiError}>⚠️ {selectedApp.verification_error}</Text>
                                    )}

                                    {selectedApp.ocr_data?.raw_text && (
                                        <View style={styles.ocrBox}>
                                            <Text style={styles.aiLabel}>OCR Extraction Sample</Text>
                                            <Text style={styles.ocrText} numberOfLines={3}>{selectedApp.ocr_data.raw_text}</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.docSection}>
                                    <Text style={styles.infoLabel}>Selfie with ID</Text>
                                    <View style={styles.imagePlaceholder}>
                                        <Ionicons name="image-outline" size={48} color={colors.border} />
                                        <Text style={styles.imagePlaceholderText}>Image would be shown here 🔗</Text>
                                        <Text style={styles.linkText} numberOfLines={1}>{selectedApp.selfie_url || 'No selfie provided'}</Text>
                                    </View>
                                </View>

                                <View style={styles.docSection}>
                                    <Text style={styles.infoLabel}>Government ID Card</Text>
                                    <View style={styles.imagePlaceholder}>
                                        <Ionicons name="card-outline" size={48} color={colors.border} />
                                        <Text style={styles.imagePlaceholderText}>Image would be shown here 🔗</Text>
                                        <Text style={styles.linkText} numberOfLines={1}>{selectedApp.gov_id_url || 'No ID provided'}</Text>
                                    </View>
                                </View>

                                <View style={styles.rejectGroup}>
                                    <Text style={styles.infoLabel}>Rejection Reason (if rejecting)</Text>
                                    <TextInput 
                                        style={styles.reasonInput}
                                        placeholder="e.g. ID is blurry, Name doesn't match"
                                        placeholderTextColor={colors.textMuted}
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

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
        paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 4 : 0,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 24,
        paddingTop: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: -1,
    },
    headerSub: {
        fontSize: 15,
        color: colors.textSecondary,
        marginTop: 4,
        fontWeight: '600',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    appCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardGlass,
        padding: 20,
        borderRadius: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        shadowColor: colors.brand,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 4,
    },
    cardInfo: {
        flex: 1,
    },
    sellerName: {
        color: colors.text,
        fontSize: 17,
        fontWeight: '800',
        marginBottom: 4,
        letterSpacing: -0.3,
    },
    sellerDetails: {
        color: colors.textSecondary,
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    timeText: {
        color: colors.brand,
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    emptyState: {
        paddingVertical: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: 17,
        fontWeight: '600',
        marginTop: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: colors.overlay,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.bg,
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        maxHeight: '92%',
        paddingTop: 32,
        shadowColor: colors.brand,
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 20,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 28,
        marginBottom: 32,
    },
    modalTitle: {
        color: colors.text,
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    modalCloseBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.cardAlt,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    modalBody: {
        paddingHorizontal: 28,
        paddingBottom: 40,
    },
    infoSection: {
        marginBottom: 20,
    },
    infoLabel: {
        color: colors.textMuted,
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    infoValue: {
        color: colors.text,
        fontSize: 18,
        fontWeight: '700',
    },
    aiSection: {
        backgroundColor: colors.success + '08',
        borderRadius: 24,
        padding: 20,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: colors.success + '20',
    },
    aiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    aiTitle: {
        color: colors.success,
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    aiGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    aiCard: {
        flex: 1,
        backgroundColor: colors.bg,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    aiLabel: {
        color: colors.textMuted,
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    aiValue: {
        fontSize: 18,
        fontWeight: '800',
    },
    aiError: {
        color: colors.danger,
        fontSize: 13,
        fontWeight: '600',
        marginTop: 6,
    },
    ocrBox: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    ocrText: {
        color: colors.textSecondary,
        fontSize: 12,
        lineHeight: 18,
        fontStyle: 'italic',
        fontWeight: '500',
    },
    docSection: {
        marginBottom: 32,
    },
    imagePlaceholder: {
        width: '100%',
        height: 180,
        backgroundColor: colors.cardAlt,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    imagePlaceholderText: {
        color: colors.textSecondary,
        fontSize: 13,
        fontWeight: '600',
        marginTop: 12,
    },
    linkText: {
        color: colors.brand,
        fontSize: 11,
        marginTop: 6,
        textAlign: 'center',
        fontWeight: '500',
    },
    rejectGroup: {
        marginBottom: 32,
    },
    reasonInput: {
        backgroundColor: colors.cardAlt,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.text,
        padding: 20,
        height: 100,
        textAlignVertical: 'top',
        fontSize: 15,
        fontWeight: '500',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 48,
    },
    modalBtn: {
        flex: 1,
        height: 60,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rejectBtn: {
        backgroundColor: colors.danger + '10',
        borderWidth: 1,
        borderColor: colors.danger + '30',
    },
    rejectText: {
        color: colors.danger,
        fontWeight: '800',
        fontSize: 15,
    },
    approveBtn: {
        backgroundColor: colors.success,
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    approveText: {
        color: colors.white,
        fontWeight: '800',
        fontSize: 15,
    }
});
