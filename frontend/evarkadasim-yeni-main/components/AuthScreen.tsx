import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Home, Users, Mail, Lock, Eye, EyeOff, User, Search } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { authService } from '@/services/authService';

interface AuthScreenProps {
    onAuthSuccess: () => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [lookingFor, setLookingFor] = useState<'Roommate' | 'Room' | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Animasyon değerleri
    const formScale = useSharedValue(0.9);
    const formOpacity = useSharedValue(0);

    React.useEffect(() => {
        formScale.value = withSpring(1, { damping: 15 });
        formOpacity.value = withTiming(1, { duration: 800 });
    }, []);

    const formAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: formScale.value }],
        opacity: formOpacity.value,
    }));

    const handleAuth = async () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
            return;
        }
        if (!isLoginMode && (!firstName.trim() || !lastName.trim())) {
            Alert.alert('Hata', 'Lütfen ad ve soyadınızı girin.');
            return;
        }
        if (!isLoginMode && !lookingFor) {
            Alert.alert('Hata', 'Lütfen ne aradığınızı seçin.');
            return;
        }

        setLoading(true);
        try {
            if (isLoginMode) {
                await authService.login({ email: username.trim(), password });
            } else {
                await authService.register({
                    name: firstName.trim(),
                    lastName: lastName.trim(),
                    email: username.trim(),
                    password,
                    lookingFor: lookingFor!,
                });
            }
            onAuthSuccess();
        } catch (error: any) {
            const message = error.response?.data?.message ?? 'Bir hata oluştu. Lütfen tekrar dene.';
            Alert.alert('Hata', message);
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLoginMode(!isLoginMode);
        setUsername('');
        setPassword('');
        setFirstName('');
        setLastName('');
        setLookingFor(null);
    };

    return (
        <LinearGradient
            colors={['#FDF2F8', '#F3E8FF', '#EBF4FF']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Logo bölümü */}
                        <View style={styles.logoContainer}>
                            <View style={styles.iconRow}>
                                <View style={[styles.iconContainer, { backgroundColor: '#EC4899' }]}>
                                    <Heart size={24} color="#fff" fill="#fff" />
                                </View>
                                <View style={[styles.iconContainer, { backgroundColor: '#8B5CF6' }]}>
                                    <Home size={24} color="#fff" fill="#fff" />
                                </View>
                                <View style={[styles.iconContainer, { backgroundColor: '#3B82F6' }]}>
                                    <Users size={24} color="#fff" fill="#fff" />
                                </View>
                            </View>
                            <Text style={styles.appTitle}>EvArkadaşım</Text>
                            <Text style={styles.appSubtitle}>
                                En uygun ev arkadaşını bul
                            </Text>
                        </View>

                        {/* Form bölümü */}
                        <Animated.View style={[styles.formContainer, formAnimatedStyle]}>
                            <View style={styles.formCard}>
                                <Text style={styles.formTitle}>
                                    {isLoginMode ? 'Giriş Yap' : 'Üye Ol'}
                                </Text>
                                <Text style={styles.formSubtitle}>
                                    {isLoginMode
                                        ? 'Hesabına giriş yaparak devam et'
                                        : 'Yeni hesap oluştur ve arkadaşını bul'
                                    }
                                </Text>

                                {/* Ad + Soyad — sadece kayıt modunda */}
                                {!isLoginMode && (
                                    <View style={styles.nameRow}>
                                        <View style={[styles.inputContainer, styles.nameInput]}>
                                            <View style={styles.inputWrapper}>
                                                <User size={20} color="#9CA3AF" style={styles.inputIcon} />
                                                <TextInput
                                                    style={styles.textInput}
                                                    placeholder="Ad"
                                                    value={firstName}
                                                    onChangeText={setFirstName}
                                                    autoCorrect={false}
                                                    placeholderTextColor="#9CA3AF"
                                                />
                                            </View>
                                        </View>
                                        <View style={[styles.inputContainer, styles.nameInput]}>
                                            <View style={styles.inputWrapper}>
                                                <User size={20} color="#9CA3AF" style={styles.inputIcon} />
                                                <TextInput
                                                    style={styles.textInput}
                                                    placeholder="Soyad"
                                                    value={lastName}
                                                    onChangeText={setLastName}
                                                    autoCorrect={false}
                                                    placeholderTextColor="#9CA3AF"
                                                />
                                            </View>
                                        </View>
                                    </View>
                                )}

                                {/* Kullanıcı tipi seçimi — sadece kayıt modunda */}
                                {!isLoginMode && (
                                    <View style={styles.typeSelectContainer}>
                                        <Text style={styles.typeSelectLabel}>Ne arıyorsunuz?</Text>
                                        <View style={styles.typeSelectRow}>
                                            <TouchableOpacity
                                                style={[styles.typeBtn, lookingFor === 'Roommate' && styles.typeBtnActive]}
                                                onPress={() => setLookingFor('Roommate')}
                                            >
                                                <Home size={18} color={lookingFor === 'Roommate' ? '#fff' : '#059669'} />
                                                <Text style={[styles.typeBtnText, lookingFor === 'Roommate' && styles.typeBtnTextActive]}>Ev Sahibiyim</Text>
                                                <Text style={[styles.typeBtnSub, lookingFor === 'Roommate' && { color: 'rgba(255,255,255,0.8)' }]}>Ev arkadaşı arıyorum</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.typeBtn, lookingFor === 'Room' && styles.typeBtnRoomActive]}
                                                onPress={() => setLookingFor('Room')}
                                            >
                                                <Search size={18} color={lookingFor === 'Room' ? '#fff' : '#7C3AED'} />
                                                <Text style={[styles.typeBtnText, lookingFor === 'Room' && styles.typeBtnTextActive]}>Ev Arıyorum</Text>
                                                <Text style={[styles.typeBtnSub, lookingFor === 'Room' && { color: 'rgba(255,255,255,0.8)' }]}>Kalacak yer arıyorum</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}

                                {/* E-posta input */}
                                <View style={styles.inputContainer}>
                                    <View style={styles.inputWrapper}>
                                        <Mail size={20} color="#9CA3AF" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder="E-posta adresi"
                                            value={username}
                                            onChangeText={setUsername}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            keyboardType="email-address"
                                            placeholderTextColor="#9CA3AF"
                                        />
                                    </View>
                                </View>

                                {/* Şifre input */}
                                <View style={styles.inputContainer}>
                                    <View style={styles.inputWrapper}>
                                        <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder="Şifre"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            placeholderTextColor="#9CA3AF"
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowPassword(!showPassword)}
                                            style={styles.eyeButton}
                                        >
                                            {showPassword ? (
                                                <EyeOff size={20} color="#9CA3AF" />
                                            ) : (
                                                <Eye size={20} color="#9CA3AF" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Giriş butonu */}
                                <TouchableOpacity
                                    style={[styles.authButton, loading && styles.authButtonDisabled]}
                                    onPress={handleAuth}
                                    disabled={loading}
                                >
                                    <LinearGradient
                                        colors={loading ? ['#D1D5DB', '#9CA3AF'] : ['#EC4899', '#8B5CF6']}
                                        style={styles.buttonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={styles.authButtonText}>
                                            {loading ? 'Kontrol Ediliyor...' : (isLoginMode ? 'Giriş Yap' : 'Üye Ol')}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Mode değiştirme */}
                                <View style={styles.switchContainer}>
                                    <Text style={styles.switchText}>
                                        {isLoginMode ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}
                                    </Text>
                                    <TouchableOpacity onPress={toggleMode}>
                                        <Text style={styles.switchButton}>
                                            {isLoginMode ? 'Üye Ol' : 'Giriş Yap'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 50,
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginBottom: 20,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    appTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    appSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    formContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    formTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },
    formSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    inputContainer: {
        marginBottom: 20,
    },
    nameRow: {
        flexDirection: 'row',
        gap: 10,
    },
    nameInput: {
        flex: 1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    inputIcon: {
        marginRight: 12,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
        paddingVertical: 16,
    },
    eyeButton: {
        padding: 4,
    },
    demoInfo: {
        backgroundColor: '#EBF4FF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: '#3B82F6',
    },
    demoText: {
        fontSize: 14,
        color: '#1E40AF',
        fontWeight: '500',
        textAlign: 'center',
    },
    typeSelectContainer: {
        marginBottom: 20,
    },
    typeSelectLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 10,
    },
    typeSelectRow: {
        flexDirection: 'row',
        gap: 10,
    },
    typeBtn: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
        paddingVertical: 14,
        paddingHorizontal: 10,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
    },
    typeBtnActive: {
        borderColor: '#059669',
        backgroundColor: '#059669',
    },
    typeBtnRoomActive: {
        borderColor: '#7C3AED',
        backgroundColor: '#7C3AED',
    },
    typeBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151',
    },
    typeBtnTextActive: {
        color: '#fff',
    },
    typeBtnSub: {
        fontSize: 10,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    authButton: {
        marginBottom: 24,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#EC4899',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    authButtonDisabled: {
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    authButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    switchText: {
        fontSize: 16,
        color: '#6B7280',
        marginRight: 8,
    },
    switchButton: {
        fontSize: 16,
        fontWeight: '600',
        color: '#EC4899',
    },
}); 