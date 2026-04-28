import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, Check, Users, Home, MessageSquare, Calendar, Heart, Settings } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface CharacterTestProps {
    onComplete: (results: TestResults) => void;
    onBack: () => void;
}

export interface TestResults {
    socialEnergy: number;        // İS1, İS2 (ters)
    orderApproach: number;       // İS3, İS4 (ters)
    conflictManagement: number;  // İS5, İS6 (ters)
    sharingStyle: number;        // İS7, İS8 (ters)
    lifeRhythm: number;         // İS9, İS10 (ters)
    communicationStyle: number;  // İS11, İS12 (ters)
}

interface Question {
    id: string;
    text: string;
    category: keyof TestResults;
    isReverse: boolean; // Ters kodlu sorular için
    icon: React.ReactNode;
    categoryName: string;
}

const questions: Question[] = [
    {
        id: 'IS1',
        text: 'Evde arkadaşlarımla uzun sohbetler yapmak beni enerjik hissettirir.',
        category: 'socialEnergy',
        isReverse: false,
        icon: <Users size={24} color="#EC4899" />,
        categoryName: 'Sosyal Enerji'
    },
    {
        id: 'IS2',
        text: 'Zor bir günden sonra evde tek başıma kalmayı tercih ederim.',
        category: 'socialEnergy',
        isReverse: true,
        icon: <Users size={24} color="#EC4899" />,
        categoryName: 'Sosyal Enerji'
    },
    {
        id: 'IS3',
        text: 'Her şeyin yerli yerinde olması benim için çok önemlidir.',
        category: 'orderApproach',
        isReverse: false,
        icon: <Settings size={24} color="#8B5CF6" />,
        categoryName: 'Düzen Yaklaşımı'
    },
    {
        id: 'IS4',
        text: 'Ortak alanlarda başkalarının eşyalarının durması beni rahatsız etmez.',
        category: 'orderApproach',
        isReverse: true,
        icon: <Settings size={24} color="#8B5CF6" />,
        categoryName: 'Düzen Yaklaşımı'
    },
    {
        id: 'IS5',
        text: 'Ev arkadaşımla bir sorun yaşadığımda doğrudan konuşmayı tercih ederim.',
        category: 'conflictManagement',
        isReverse: false,
        icon: <MessageSquare size={24} color="#10B981" />,
        categoryName: 'Çatışma Yönetimi'
    },
    {
        id: 'IS6',
        text: 'Beni rahatsız eden durumları genellikle görmezden gelirim.',
        category: 'conflictManagement',
        isReverse: true,
        icon: <MessageSquare size={24} color="#10B981" />,
        categoryName: 'Çatışma Yönetimi'
    },
    {
        id: 'IS7',
        text: 'Mutfak malzemelerimi ev arkadaşımla paylaşmaktan memnuniyet duyarım.',
        category: 'sharingStyle',
        isReverse: false,
        icon: <Heart size={24} color="#F59E0B" />,
        categoryName: 'Paylaşım Tarzı'
    },
    {
        id: 'IS8',
        text: 'Kendi özel alanımın olması benim için çok kritiktir.',
        category: 'sharingStyle',
        isReverse: true,
        icon: <Heart size={24} color="#F59E0B" />,
        categoryName: 'Paylaşım Tarzı'
    },
    {
        id: 'IS9',
        text: 'Günlük rutinlerimi sürdürmek benim için önemlidir.',
        category: 'lifeRhythm',
        isReverse: false,
        icon: <Calendar size={24} color="#3B82F6" />,
        categoryName: 'Yaşam Ritmi'
    },
    {
        id: 'IS10',
        text: 'Spontane aktiviteler ve ani planlar beni heyecanlandırır.',
        category: 'lifeRhythm',
        isReverse: true,
        icon: <Calendar size={24} color="#3B82F6" />,
        categoryName: 'Yaşam Ritmi'
    },
    {
        id: 'IS11',
        text: 'Duygularımı ev arkadaşımla açıkça paylaşırım.',
        category: 'communicationStyle',
        isReverse: false,
        icon: <Home size={24} color="#EF4444" />,
        categoryName: 'İletişim Stili'
    },
    {
        id: 'IS12',
        text: 'Ev arkadaşımın özel hayatıyla ilgili sorular sormaktan çekinirim.',
        category: 'communicationStyle',
        isReverse: true,
        icon: <Home size={24} color="#EF4444" />,
        categoryName: 'İletişim Stili'
    },
];

const scaleLabels = [
    'Kesinlikle\nKatılmıyorum',
    'Katılmıyorum',
    'Kararsızım',
    'Katılıyorum',
    'Kesinlikle\nKatılıyorum'
];

export function CharacterTest({ onComplete, onBack }: CharacterTestProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});

    const progressWidth = useSharedValue(0);

    React.useEffect(() => {
        const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
        progressWidth.value = withSpring(progress);
    }, [currentQuestionIndex]);

    const progressAnimatedStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value}%`,
    }));

    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion.id];

    const handleAnswer = (value: number) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: value
        }));
    };

    const handleNext = () => {
        if (!currentAnswer) {
            Alert.alert('Uyarı', 'Lütfen bir seçenek seçin.');
            return;
        }

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            // Test tamamlandı, sonuçları hesapla
            calculateResults();
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const calculateResults = () => {
        const results: TestResults = {
            socialEnergy: 0,
            orderApproach: 0,
            conflictManagement: 0,
            sharingStyle: 0,
            lifeRhythm: 0,
            communicationStyle: 0,
        };

        // Her kategori için sonuçları hesapla
        Object.entries(results).forEach(([category, _]) => {
            const categoryQuestions = questions.filter(q => q.category === category);
            let total = 0;

            categoryQuestions.forEach(question => {
                const answer = answers[question.id] || 3; // Varsayılan değer
                // Ters kodlu sorular için skoru ters çevir
                const score = question.isReverse ? (6 - answer) : answer;
                total += score;
            });

            // Ortalama al (1-5 arası)
            results[category as keyof TestResults] = total / categoryQuestions.length;
        });

        onComplete(results);
    };

    return (
        <LinearGradient
            colors={['#FDF2F8', '#F3E8FF']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={onBack}>
                        <ArrowLeft size={24} color="#6B7280" />
                    </TouchableOpacity>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <Animated.View style={[styles.progressFill, progressAnimatedStyle]} />
                        </View>
                        <Text style={styles.progressText}>
                            {currentQuestionIndex + 1} / {questions.length}
                        </Text>
                    </View>
                </View>

                {/* Soru içeriği */}
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.questionCard}>
                        {/* Kategori */}
                        <View style={styles.categoryContainer}>
                            {currentQuestion.icon}
                            <Text style={styles.categoryText}>
                                {currentQuestion.categoryName}
                            </Text>
                        </View>

                        {/* Soru */}
                        <Text style={styles.questionText}>
                            {currentQuestion.text}
                        </Text>

                        {/* Ölçek açıklaması */}
                        <Text style={styles.scaleDescription}>
                            Aşağıdaki ifadeye ne kadar katılıyorsunuz?
                        </Text>

                        {/* Seçenekler */}
                        <View style={styles.optionsContainer}>
                            {scaleLabels.map((label, index) => {
                                const value = index + 1;
                                const isSelected = currentAnswer === value;

                                return (
                                    <TouchableOpacity
                                        key={value}
                                        style={[
                                            styles.option,
                                            isSelected && styles.selectedOption
                                        ]}
                                        onPress={() => handleAnswer(value)}
                                    >
                                        <View style={[
                                            styles.optionCircle,
                                            isSelected && styles.selectedCircle
                                        ]}>
                                            <Text style={[
                                                styles.optionNumber,
                                                isSelected && styles.selectedNumber
                                            ]}>
                                                {value}
                                            </Text>
                                            {isSelected && <Check size={16} color="#fff" />}
                                        </View>
                                        <Text style={[
                                            styles.optionLabel,
                                            isSelected && styles.selectedLabel
                                        ]}>
                                            {label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </ScrollView>

                {/* Alt navigasyon */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.navButton, currentQuestionIndex === 0 && styles.disabledButton]}
                        onPress={handlePrevious}
                        disabled={currentQuestionIndex === 0}
                    >
                        <ArrowLeft size={20} color={currentQuestionIndex === 0 ? "#D1D5DB" : "#6B7280"} />
                        <Text style={[styles.navButtonText, currentQuestionIndex === 0 && styles.disabledText]}>
                            Önceki
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.nextButton, !currentAnswer && styles.disabledNextButton]}
                        onPress={handleNext}
                        disabled={!currentAnswer}
                    >
                        <LinearGradient
                            colors={!currentAnswer ? ['#D1D5DB', '#9CA3AF'] : ['#EC4899', '#8B5CF6']}
                            style={styles.nextButtonGradient}
                        >
                            <Text style={styles.nextButtonText}>
                                {currentQuestionIndex === questions.length - 1 ? 'Tamamla' : 'Sonraki'}
                            </Text>
                            <ArrowRight size={20} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    progressContainer: {
        flex: 1,
    },
    progressBar: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#EC4899',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
        textAlign: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    questionCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    categoryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    categoryText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginLeft: 12,
    },
    questionText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        lineHeight: 28,
        marginBottom: 16,
        textAlign: 'center',
    },
    scaleDescription: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 32,
    },
    optionsContainer: {
        gap: 16,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#F9FAFB',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedOption: {
        backgroundColor: '#FDF2F8',
        borderColor: '#EC4899',
    },
    optionCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        flexDirection: 'row',
    },
    selectedCircle: {
        backgroundColor: '#EC4899',
    },
    optionNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    selectedNumber: {
        color: '#fff',
        marginRight: 4,
    },
    optionLabel: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
        flex: 1,
        textAlign: 'center',
    },
    selectedLabel: {
        color: '#EC4899',
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    disabledButton: {
        opacity: 0.5,
    },
    navButtonText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
        marginLeft: 8,
    },
    disabledText: {
        color: '#D1D5DB',
    },
    nextButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#EC4899',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    disabledNextButton: {
        shadowOpacity: 0,
        elevation: 0,
    },
    nextButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginRight: 8,
    },
}); 