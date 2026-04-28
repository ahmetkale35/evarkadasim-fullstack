import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Home, Users, Sparkles } from 'lucide-react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    withDelay,
    interpolate,
    runOnJS,
} from 'react-native-reanimated';

interface LoadingScreenProps {
    onFinish: () => void;
}

const { width, height } = Dimensions.get('window');

export function LoadingScreen({ onFinish }: LoadingScreenProps) {
    // Animasyon değerleri
    const heartScale = useSharedValue(0);
    const homeScale = useSharedValue(0);
    const usersScale = useSharedValue(0);
    const sparklesRotation = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    const loadingProgress = useSharedValue(0);
    const screenOpacity = useSharedValue(1);

    useEffect(() => {
        // İkonlar için sıralı animasyon
        heartScale.value = withDelay(200, withSequence(
            withTiming(1.2, { duration: 600 }),
            withTiming(1, { duration: 300 })
        ));

        homeScale.value = withDelay(500, withSequence(
            withTiming(1.2, { duration: 600 }),
            withTiming(1, { duration: 300 })
        ));

        usersScale.value = withDelay(800, withSequence(
            withTiming(1.2, { duration: 600 }),
            withTiming(1, { duration: 300 })
        ));

        // Sparkles sürekli döner
        sparklesRotation.value = withRepeat(
            withTiming(360, { duration: 3000 }),
            -1,
            false
        );

        // Metin animasyonu
        textOpacity.value = withDelay(1000, withTiming(1, { duration: 800 }));

        // Loading progress
        loadingProgress.value = withDelay(1200, withTiming(1, { duration: 2000 }));

        // 3.5 saniye sonra ekranı kapat
        const timeout = setTimeout(() => {
            screenOpacity.value = withTiming(0, { duration: 500 }, () => {
                runOnJS(onFinish)();
            });
        }, 3500);

        return () => clearTimeout(timeout);
    }, []);

    // Animasyon stilleri
    const heartAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: heartScale.value }],
    }));

    const homeAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: homeScale.value }],
    }));

    const usersAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: usersScale.value }],
    }));

    const sparklesAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${sparklesRotation.value}deg` }],
    }));

    const textAnimatedStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [
            {
                translateY: interpolate(textOpacity.value, [0, 1], [20, 0])
            }
        ],
    }));

    const progressAnimatedStyle = useAnimatedStyle(() => ({
        width: `${loadingProgress.value * 100}%`,
    }));

    const screenAnimatedStyle = useAnimatedStyle(() => ({
        opacity: screenOpacity.value,
    }));

    return (
        <Animated.View style={[styles.container, screenAnimatedStyle]}>
            <LinearGradient
                colors={['#EC4899', '#8B5CF6', '#3B82F6']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.content}>
                    {/* Ana logo alanı */}
                    <View style={styles.logoContainer}>
                        <View style={styles.iconRow}>
                            <Animated.View style={[styles.iconContainer, heartAnimatedStyle]}>
                                <Heart size={40} color="#fff" fill="#fff" />
                            </Animated.View>

                            <Animated.View style={[styles.iconContainer, homeAnimatedStyle]}>
                                <Home size={40} color="#fff" fill="#fff" />
                            </Animated.View>

                            <Animated.View style={[styles.iconContainer, usersAnimatedStyle]}>
                                <Users size={40} color="#fff" fill="#fff" />
                            </Animated.View>
                        </View>

                        {/* Dönen yıldızlar */}
                        <Animated.View style={[styles.sparklesContainer, sparklesAnimatedStyle]}>
                            <Sparkles size={24} color="rgba(255,255,255,0.6)" />
                        </Animated.View>
                    </View>

                    {/* Başlık ve alt başlık */}
                    <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
                        <Text style={styles.title}>EvArkadaşım</Text>
                        <Text style={styles.subtitle}>
                            Perfect roommates are waiting for you
                        </Text>
                    </Animated.View>

                    {/* Loading bar */}
                    <View style={styles.loadingContainer}>
                        <View style={styles.loadingBar}>
                            <Animated.View style={[styles.loadingProgress, progressAnimatedStyle]} />
                        </View>
                        <Text style={styles.loadingText}>Finding your perfect match...</Text>
                    </View>
                </View>

                {/* Arka plan dekoratif öğeler */}
                <View style={styles.decorativeElements}>
                    <View style={[styles.circle, styles.circle1]} />
                    <View style={[styles.circle, styles.circle2]} />
                    <View style={[styles.circle, styles.circle3]} />
                </View>
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        zIndex: 1,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 60,
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 30,
        marginBottom: 20,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    sparklesContainer: {
        position: 'absolute',
        top: -10,
        right: -10,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 80,
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        fontWeight: '500',
    },
    loadingContainer: {
        alignItems: 'center',
        width: 250,
    },
    loadingBar: {
        width: '100%',
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 16,
    },
    loadingProgress: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 2,
    },
    loadingText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    decorativeElements: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    circle: {
        position: 'absolute',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 999,
    },
    circle1: {
        width: 100,
        height: 100,
        top: height * 0.1,
        left: width * 0.1,
    },
    circle2: {
        width: 150,
        height: 150,
        top: height * 0.7,
        right: width * 0.1,
    },
    circle3: {
        width: 80,
        height: 80,
        top: height * 0.3,
        right: width * 0.2,
    },
}); 