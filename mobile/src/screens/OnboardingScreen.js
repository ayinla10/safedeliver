import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme';

const { width } = Dimensions.get('window');

const slides = [
    { icon: '🛡️', title: 'Welcome to SafeDeliver', desc: 'The escrow layer for social commerce in Ghana. Protect every transaction.' },
    { icon: '🔗', title: 'Create Checkout Links', desc: 'Create a secure checkout link in 60 seconds. Share on WhatsApp, Instagram, anywhere.' },
    { icon: '💰', title: 'Get Paid Safely', desc: 'Money held in escrow. Buyer confirms delivery. You get paid instantly.' },
];

export default function OnboardingScreen({ navigation }) {
    const [page, setPage] = React.useState(0);

    return (
        <View style={styles.container}>
            <View style={styles.slideContainer}>
                <Text style={styles.icon}>{slides[page].icon}</Text>
                <Text style={styles.title}>{slides[page].title}</Text>
                <Text style={styles.desc}>{slides[page].desc}</Text>
            </View>

            <View style={styles.dots}>
                {slides.map((_, i) => (
                    <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
                ))}
            </View>

            <View style={styles.buttons}>
                {page < slides.length - 1 ? (
                    <>
                        <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.skipBtn}>
                            <Text style={styles.skipText}>Skip</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setPage(page + 1)} style={styles.nextBtn}>
                            <Text style={styles.nextText}>Next →</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity onPress={() => navigation.replace('Login')} style={[styles.nextBtn, { flex: 1 }]}>
                        <Text style={styles.nextText}>Get Started</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
    slideContainer: { alignItems: 'center', flex: 1, justifyContent: 'center' },
    icon: { fontSize: 80, marginBottom: Spacing.lg },
    title: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.brand, textAlign: 'center', marginBottom: Spacing.md },
    desc: { fontSize: FontSizes.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: width * 0.8 },
    dots: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
    dotActive: { backgroundColor: Colors.brand, width: 24 },
    buttons: { flexDirection: 'row', gap: Spacing.md, width: '100%' },
    skipBtn: { flex: 1, padding: Spacing.md, alignItems: 'center' },
    skipText: { fontSize: FontSizes.md, color: Colors.textSecondary },
    nextBtn: { flex: 1, backgroundColor: Colors.brand, padding: Spacing.md, borderRadius: BorderRadius.sm, alignItems: 'center' },
    nextText: { fontSize: FontSizes.md, fontWeight: '600', color: '#fff' },
});
