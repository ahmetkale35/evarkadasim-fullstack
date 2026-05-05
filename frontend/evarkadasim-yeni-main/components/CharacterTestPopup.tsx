import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Brain, Timer, Target } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

interface CharacterTestPopupProps {
    visible: boolean;
    onClose: () => void;
    onStartTest: () => void;
}

export function CharacterTestPopup({ visible, onClose, onStartTest }: CharacterTestPopupProps) {
    const scale = useSharedValue(0.8);
    const opacity = useSharedValue(0);

    React.useEffect(() => {
        if (visible) {
            scale.value = withSpring(1, { damping: 15 });
            opacity.value = withTiming(1, { duration: 300 });
        } else {
            scale.value = withTiming(0.8, { duration: 200 });
            opacity.value = withTiming(0, { duration: 200 });
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <Animated.View style={[styles.container, animatedStyle]}>
                    <LinearGradient
                        colors={['#FDF2F8', '#F3E8FF']}
                        style={styles.gradient}
                    >
                        {/* Kapat butonu */}
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <X size={24} color="#6B7280" />
                        </TouchableOpacity>

                        {/* İçerik */}
                        <View style={styles.content}>
                            {/* Icon */}
                            <View style={styles.iconContainer}>
                                <LinearGradient
                                    colors={['#EC4899', '#8B5CF6']}
                                    style={styles.iconGradient}
                                >
                                    <Brain size={40} color="#fff" />
                                </LinearGradient>
                            </View>

                            {/* Başlık */}
                            <Text style={styles.title}>Karakter Profili Oluştur</Text>
                            <Text style={styles.subtitle}>
                                Sana en uygun ev arkadaşlarını bulabilmek için kısa bir karakter testini tamamlayabilirsin!
                            </Text>

                            {/* Özellikler */}
                            <View style={styles.features}>
                                <View style={styles.feature}>
                                    <Timer size={20} color="#10B981" />
                                    <Text style={styles.featureText}>Sadece 2-3 dakika</Text>
                                </View>
                                <View style={styles.feature}>
                                    <Target size={20} color="#3B82F6" />
                                    <Text style={styles.featureText}>12 basit soru</Text>
                                </View>
                                <View style={styles.feature}>
                                    <Brain size={20} color="#8B5CF6" />
                                    <Text style={styles.featureText}>Kişilik analizi</Text>
                                </View>
                            </View>

                            {/* Fayda açıklaması */}
                            <View style={styles.benefitBox}>
                                <Text style={styles.benefitText}>
                                    {'✨ Testi tamamladıktan sonra sana '}<Text style={styles.benefitHighlight}>{'%95\'e kadar uyumlu'}</Text>{' ev arkadaşı önerileri göreceğin!'}
                                </Text>
                            </View>

                            {/* Butonlar */}
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity style={styles.startButton} onPress={onStartTest}>
                                    <LinearGradient
                                        colors={['#EC4899', '#8B5CF6']}
                                        style={styles.startButtonGradient}
                                    >
                                        <Text style={styles.startButtonText}>Teste Başla</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.skipButton} onPress={onClose}>
                                    <Text style={styles.skipButtonText}>Şimdilik Atla</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 16,
    },
    gradient: {
        padding: 24,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        paddingTop: 20,
    },
    iconContainer: {
        marginBottom: 20,
    },
    iconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    features: {
        width: '100%',
        marginBottom: 20,
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    featureText: {
        fontSize: 16,
        color: '#374151',
        marginLeft: 12,
        fontWeight: '500',
    },
    benefitBox: {
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(236, 72, 153, 0.2)',
    },
    benefitText: {
        fontSize: 14,
        color: '#374151',
        textAlign: 'center',
        lineHeight: 20,
    },
    benefitHighlight: {
        fontWeight: '700',
        color: '#EC4899',
    },
    buttonContainer: {
        width: '100%',
    },
    startButton: {
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#EC4899',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    startButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    startButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    skipButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    skipButtonText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
}); 