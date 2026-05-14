import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, Check, Users, Settings, MessageSquare, Heart, Calendar } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { DetailedTestResults, TestResults } from '@/types';

interface DetailedCharacterTestProps {
    onComplete: (results: DetailedTestResults) => void;
    onBack: () => void;
    basicResults: TestResults;
}

interface DetailedQuestion {
    id: string;
    text: string;
    category: string;
    categoryName: string;
    icon: React.ReactNode;
    isReverse?: boolean;
}

const detailedQuestions: DetailedQuestion[] = [
    // Sosyal Enerji (6 soru)
    {
        id: 'DS1',
        text: 'Evde sessizlik olması beni tedirgin eder.',
        category: 'socialEnergy',
        categoryName: 'Sosyal Enerji',
        icon: <Users size={24} color="#EC4899" />
    },
    {
        id: 'DS2',
        text: 'Ortak alanlarda kitap okumak/çalışmak yerine odamda olmayı tercih ederim.',
        category: 'socialEnergy',
        categoryName: 'Sosyal Enerji',
        icon: <Users size={24} color="#EC4899" />,
        isReverse: true
    },
    {
        id: 'DS3',
        text: 'Ev arkadaşlarımla günlük yaşantımızı paylaşmaktan hoşlanırım.',
        category: 'socialEnergy',
        categoryName: 'Sosyal Enerji',
        icon: <Users size={24} color="#EC4899" />
    },
    {
        id: 'DS4',
        text: 'Ev arkadaşlarımın arkadaşlarıyla tanışmaktan hoşlanırım.',
        category: 'socialEnergy',
        categoryName: 'Sosyal Enerji',
        icon: <Users size={24} color="#EC4899" />
    },
    {
        id: 'DS5',
        text: 'Hafta sonları evde sosyal aktiviteler organize etmeyi severim.',
        category: 'socialEnergy',
        categoryName: 'Sosyal Enerji',
        icon: <Users size={24} color="#EC4899" />
    },
    {
        id: 'DS6',
        text: 'Evde yalnız kaldığımda kendimi rahat hissederim.',
        category: 'socialEnergy',
        categoryName: 'Sosyal Enerji',
        icon: <Users size={24} color="#EC4899" />,
        isReverse: true
    },

    // Düzen Yaklaşımı (6 soru)
    {
        id: 'DS7',
        text: 'Ev işleri için belirli bir program yapmayı severim.',
        category: 'orderApproach',
        categoryName: 'Düzen Yaklaşımı',
        icon: <Settings size={24} color="#8B5CF6" />
    },
    {
        id: 'DS8',
        text: 'Temizlik kurallarının net bir şekilde belirlenmesi gerektiğini düşünürüm.',
        category: 'orderApproach',
        categoryName: 'Düzen Yaklaşımı',
        icon: <Settings size={24} color="#8B5CF6" />
    },
    {
        id: 'DS9',
        text: 'Mutfakta kullandığım her şeyi hemen temizler ve yerine koyarım.',
        category: 'orderApproach',
        categoryName: 'Düzen Yaklaşımı',
        icon: <Settings size={24} color="#8B5CF6" />
    },
    {
        id: 'DS10',
        text: 'Evin genel düzeni için herkesin kendi tarzı olabilir.',
        category: 'orderApproach',
        categoryName: 'Düzen Yaklaşımı',
        icon: <Settings size={24} color="#8B5CF6" />,
        isReverse: true
    },
    {
        id: 'DS11',
        text: 'Bir odaya girdiğimde ilk dikkat ettiğim şey düzen durumudur.',
        category: 'orderApproach',
        categoryName: 'Düzen Yaklaşımı',
        icon: <Settings size={24} color="#8B5CF6" />
    },
    {
        id: 'DS12',
        text: 'Temizlik günlerini önceden planlamayı tercih ederim.',
        category: 'orderApproach',
        categoryName: 'Düzen Yaklaşımı',
        icon: <Settings size={24} color="#8B5CF6" />
    },

    // Çatışma Yönetimi (6 soru)
    {
        id: 'DS13',
        text: 'Ev içi anlaşmazlıklarda uzlaşma bulmaya odaklanırım.',
        category: 'conflictManagement',
        categoryName: 'Çatışma Yönetimi',
        icon: <MessageSquare size={24} color="#10B981" />
    },
    {
        id: 'DS14',
        text: 'Ev kuralları konusunda taviz vermekte zorlanırım.',
        category: 'conflictManagement',
        categoryName: 'Çatışma Yönetimi',
        icon: <MessageSquare size={24} color="#10B981" />,
        isReverse: true
    },
    {
        id: 'DS15',
        text: 'Ev arkadaşımın duygusal durumunu anlamaya çalışırım.',
        category: 'conflictManagement',
        categoryName: 'Çatışma Yönetimi',
        icon: <MessageSquare size={24} color="#10B981" />
    },
    {
        id: 'DS16',
        text: 'Tartışmalar sırasında sakin kalmayı başarırım.',
        category: 'conflictManagement',
        categoryName: 'Çatışma Yönetimi',
        icon: <MessageSquare size={24} color="#10B981" />
    },
    {
        id: 'DS17',
        text: 'Problemleri çözmek için mediatör bir arkadaşın yardımını alabilirim.',
        category: 'conflictManagement',
        categoryName: 'Çatışma Yönetimi',
        icon: <MessageSquare size={24} color="#10B981" />
    },
    {
        id: 'DS18',
        text: 'Ev içi gerginlikleri mizahla çözmeye çalışırım.',
        category: 'conflictManagement',
        categoryName: 'Çatışma Yönetimi',
        icon: <MessageSquare size={24} color="#10B981" />
    },

    // Paylaşım Tarzı (6 soru)
    {
        id: 'DS19',
        text: 'Ortak alışveriş yapmayı ve hesapları bölmeyi tercih ederim.',
        category: 'sharingStyle',
        categoryName: 'Paylaşım Tarzı',
        icon: <Heart size={24} color="#F59E0B" />
    },
    {
        id: 'DS20',
        text: 'Netflix, Spotify gibi abonelikleri paylaşmayı normal karşılarım.',
        category: 'sharingStyle',
        categoryName: 'Paylaşım Tarzı',
        icon: <Heart size={24} color="#F59E0B" />
    },
    {
        id: 'DS21',
        text: 'Ev arkadaşımın kişisel eşyalarına dokunmadan önce mutlaka sorarım.',
        category: 'sharingStyle',
        categoryName: 'Paylaşım Tarzı',
        icon: <Heart size={24} color="#F59E0B" />
    },
    {
        id: 'DS22',
        text: 'Ev işlerini beraber yapmayı tek başıma yapmaya tercih ederim.',
        category: 'sharingStyle',
        categoryName: 'Paylaşım Tarzı',
        icon: <Heart size={24} color="#F59E0B" />
    },
    {
        id: 'DS23',
        text: 'Kıyafetlerimi ev arkadaşımla paylaşabilirim.',
        category: 'sharingStyle',
        categoryName: 'Paylaşım Tarzı',
        icon: <Heart size={24} color="#F59E0B" />
    },
    {
        id: 'DS24',
        text: 'Ortak kullanım eşyalarının kalitesi benim için önemlidir.',
        category: 'sharingStyle',
        categoryName: 'Paylaşım Tarzı',
        icon: <Heart size={24} color="#F59E0B" />
    },

    // Yaşam Ritmi (6 soru)
    {
        id: 'DS25',
        text: 'Hafta sonu planlarımı genellikle önceden yaparım.',
        category: 'lifeRhythm',
        categoryName: 'Yaşam Ritmi',
        icon: <Calendar size={24} color="#3B82F6" />
    },
    {
        id: 'DS26',
        text: 'Uyku saatlerimde düzensizlik beni rahatsız etmez.',
        category: 'lifeRhythm',
        categoryName: 'Yaşam Ritmi',
        icon: <Calendar size={24} color="#3B82F6" />,
        isReverse: true
    },
    {
        id: 'DS27',
        text: 'Ev arkadaşımın farklı yaşam ritmi olması beni etkilemez.',
        category: 'lifeRhythm',
        categoryName: 'Yaşam Ritmi',
        icon: <Calendar size={24} color="#3B82F6" />,
        isReverse: true
    },
    {
        id: 'DS28',
        text: 'Evdeki gürültü seviyesinin belirli saatlerde kontrol altında olmasını isterim.',
        category: 'lifeRhythm',
        categoryName: 'Yaşam Ritmi',
        icon: <Calendar size={24} color="#3B82F6" />
    },
    {
        id: 'DS29',
        text: 'Sabah rutinlerimi yapmadan güne başlayamam.',
        category: 'lifeRhythm',
        categoryName: 'Yaşam Ritmi',
        icon: <Calendar size={24} color="#3B82F6" />
    },
    {
        id: 'DS30',
        text: 'Gece geç saatlerde aktivite yapmaktan hoşlanırım.',
        category: 'lifeRhythm',
        categoryName: 'Yaşam Ritmi',
        icon: <Calendar size={24} color="#3B82F6" />,
        isReverse: true
    },

    // İletişim Tarzı (6 soru)
    {
        id: 'DS31',
        text: 'Ev arkadaşımla sorun yaşadığımda doğrudan konuşmayı tercih ederim.',
        category: 'communicationStyle',
        categoryName: 'İletişim Tarzı',
        icon: <MessageSquare size={24} color="#EC4899" />
    },
    {
        id: 'DS32',
        text: 'Ev arkadaşımın beni rahatsız eden bir davranışı olsa bile genellikle söylemem.',
        category: 'communicationStyle',
        categoryName: 'İletişim Tarzı',
        icon: <MessageSquare size={24} color="#EC4899" />,
        isReverse: true
    },
    {
        id: 'DS33',
        text: 'İhtiyaçlarımı ve sınırlarımı ev arkadaşıma açıkça ifade edebilirim.',
        category: 'communicationStyle',
        categoryName: 'İletişim Tarzı',
        icon: <MessageSquare size={24} color="#EC4899" />
    },
    {
        id: 'DS34',
        text: 'Ev içi anlaşmazlıklarda ne hissettiğimi paylaşmakta zorlanırım.',
        category: 'communicationStyle',
        categoryName: 'İletişim Tarzı',
        icon: <MessageSquare size={24} color="#EC4899" />,
        isReverse: true
    },
    {
        id: 'DS35',
        text: 'Ev kuralları konusunda net ve açık konuşmalar yapmayı tercih ederim.',
        category: 'communicationStyle',
        categoryName: 'İletişim Tarzı',
        icon: <MessageSquare size={24} color="#EC4899" />
    },
    {
        id: 'DS36',
        text: 'Ev arkadaşımla aramızdaki gerginlikleri konuşmak yerine zamanla geçmesini beklerim.',
        category: 'communicationStyle',
        categoryName: 'İletişim Tarzı',
        icon: <MessageSquare size={24} color="#EC4899" />,
        isReverse: true
    }
];

const scaleLabels = [
    'Kesinlikle\nKatılmıyorum',
    'Katılmıyorum',
    'Kararsızım',
    'Katılıyorum',
    'Kesinlikle\nKatılıyorum'
];

export function DetailedCharacterTest({ onComplete, onBack, basicResults }: DetailedCharacterTestProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});

    const progressWidth = useSharedValue(0);

    React.useEffect(() => {
        const progress = ((currentQuestionIndex + 1) / detailedQuestions.length) * 100;
        progressWidth.value = withSpring(progress);
    }, [currentQuestionIndex]);

    const progressAnimatedStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value}%`,
    }));

    const currentQuestion = detailedQuestions[currentQuestionIndex];
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

        if (currentQuestionIndex < detailedQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            // Test tamamlandı, sonuçları hesapla
            calculateDetailedResults();
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const calculateDetailedResults = () => {
        // Detaylı sonuçları kategorilere göre grupla
        const categoryAnswers: Record<string, number[]> = {
            socialEnergy: [],
            orderApproach: [],
            conflictManagement: [],
            sharingStyle: [],
            lifeRhythm: [],
            communicationStyle: []
        };

        detailedQuestions.forEach(question => {
            const answer = answers[question.id] || 3;
            const score = question.isReverse ? (6 - answer) : answer;
            categoryAnswers[question.category].push(score);
        });

        const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

        // Backend ile tutarlı: detaylı test basic testi geçersiz kılar, 6 sorunun ortalaması final skordur
        const finalScores: TestResults = {
            socialEnergy: avg(categoryAnswers.socialEnergy),
            orderApproach: avg(categoryAnswers.orderApproach),
            conflictManagement: avg(categoryAnswers.conflictManagement),
            sharingStyle: avg(categoryAnswers.sharingStyle),
            lifeRhythm: avg(categoryAnswers.lifeRhythm),
            communicationStyle: avg(categoryAnswers.communicationStyle),
        };

        // Kişilik tipi hesapla
        const e_i = finalScores.socialEnergy > 3 ? 'E' : 'I';
        const s_f = finalScores.orderApproach > 3 ? 'S' : 'F';
        const d_h = finalScores.conflictManagement > 3 ? 'D' : 'H';
        const personalityType = `${e_i}${s_f}${d_h}`;

        const results: DetailedTestResults = {
            basicResults,
            detailedSocialEnergy: categoryAnswers.socialEnergy,
            detailedOrderApproach: categoryAnswers.orderApproach,
            detailedConflictManagement: categoryAnswers.conflictManagement,
            detailedSharingStyle: categoryAnswers.sharingStyle,
            detailedLifeRhythm: categoryAnswers.lifeRhythm,
            detailedCommunicationStyle: categoryAnswers.communicationStyle,
            finalScores,
            personalityType
        };

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
                        <Text style={styles.testTitle}>Detaylı Karakter Testi</Text>
                        <View style={styles.progressBar}>
                            <Animated.View style={[styles.progressFill, progressAnimatedStyle]} />
                        </View>
                        <Text style={styles.progressText}>
                            {currentQuestionIndex + 1} / {detailedQuestions.length}
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
                            colors={!currentAnswer ? ['#D1D5DB', '#9CA3AF'] : ['#8B5CF6', '#7C3AED']}
                            style={styles.nextButtonGradient}
                        >
                            <Text style={styles.nextButtonText}>
                                {currentQuestionIndex === detailedQuestions.length - 1 ? 'Tamamla' : 'Sonraki'}
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
    testTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
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
        backgroundColor: '#8B5CF6',
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
        backgroundColor: '#F3E8FF',
        borderColor: '#8B5CF6',
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
        backgroundColor: '#8B5CF6',
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
        color: '#8B5CF6',
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
        shadowColor: '#8B5CF6',
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