import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TestResults, DetailedTestResults } from '@/types';
import { testService } from '@/services/testService';
import { storage } from '@/services/storage';

let globalBasicTestResults: TestResults | null = null;
let globalDetailedTestResults: DetailedTestResults | null = null;
let listeners: Set<() => void> = new Set();
let storageLoaded = false;

const notifyListeners = () => listeners.forEach(l => l());

const userKey = (base: string, userId: string) => `${base}_${userId}`;

const loadFromStorage = async () => {
  if (storageLoaded) return;
  storageLoaded = true;
  try {
    const userId = await storage.getUserId();
    if (!userId) return;
    const basic = await AsyncStorage.getItem(userKey('char_test_basic', userId));
    if (basic) globalBasicTestResults = JSON.parse(basic);
    const detailed = await AsyncStorage.getItem(userKey('char_test_detailed', userId));
    if (detailed) globalDetailedTestResults = JSON.parse(detailed);
    notifyListeners();
  } catch {}
};

// Logout: global state sıfırla, storage'a dokunma (aynı kullanıcı geri gelince verisi hazır)
export const clearCharacterTestStorage = () => {
  globalBasicTestResults = null;
  globalDetailedTestResults = null;
  storageLoaded = false;
  notifyListeners();
};

export function useCharacterTest() {
    const [basicTestResults, setBasicTestResults] = useState<TestResults | null>(globalBasicTestResults);
    const [detailedTestResults, setDetailedTestResults] = useState<DetailedTestResults | null>(globalDetailedTestResults);

    useEffect(() => {
        const listener = () => {
            setBasicTestResults(globalBasicTestResults);
            setDetailedTestResults(globalDetailedTestResults);
        };
        listeners.add(listener);
        loadFromStorage();
        return () => { listeners.delete(listener); };
    }, []);

    const setBasicTestResultsGlobal = async (results: TestResults | null) => {
        globalBasicTestResults = results;
        setBasicTestResults(results);
        notifyListeners();
        try {
            const userId = await storage.getUserId();
            if (userId) {
                if (results) {
                    await AsyncStorage.setItem(userKey('char_test_basic', userId), JSON.stringify(results));
                } else {
                    await AsyncStorage.removeItem(userKey('char_test_basic', userId));
                }
            }
        } catch {}
        if (results) testService.submitBasic(results).catch(() => {});
    };

    const setDetailedTestResultsGlobal = async (results: DetailedTestResults | null) => {
        globalDetailedTestResults = results;
        setDetailedTestResults(results);
        notifyListeners();
        try {
            const userId = await storage.getUserId();
            if (userId) {
                if (results) {
                    await AsyncStorage.setItem(userKey('char_test_detailed', userId), JSON.stringify(results));
                } else {
                    await AsyncStorage.removeItem(userKey('char_test_detailed', userId));
                }
            }
        } catch {}
        if (results) testService.submitDetailed(results).catch(() => {});
    };

    // Backend'den gelen sonucu local'e sync eder — API'ye tekrar göndermez
    const syncBasicTestFromServer = async (results: TestResults) => {
        if (globalBasicTestResults !== null) return;
        globalBasicTestResults = results;
        setBasicTestResults(results);
        notifyListeners();
        try {
            const userId = await storage.getUserId();
            if (userId) await AsyncStorage.setItem(userKey('char_test_basic', userId), JSON.stringify(results));
        } catch {}
    };

    const hasCompletedBasicTest = (): boolean => globalBasicTestResults !== null;
    const hasCompletedDetailedTest = (): boolean => globalDetailedTestResults !== null;

    const getPersonalityType = (results: TestResults) => {
        const e_i = results.socialEnergy > 3 ? 'E' : 'I';
        const s_f = results.orderApproach > 3 ? 'S' : 'F';
        const d_h = results.conflictManagement > 3 ? 'D' : 'H';
        return `${e_i}${s_f}${d_h}`;
    };

    const getPersonalityDescription = (type: string) => {
        const descriptions: Record<string, string> = {
            'ESD': 'Sosyal Organize Doğrudan',
            'ESH': 'Sosyal Organize Hassas',
            'EFD': 'Sosyal Esnek Doğrudan',
            'EFH': 'Sosyal Esnek Hassas',
            'ISD': 'Sakin Organize Doğrudan',
            'ISH': 'Sakin Organize Hassas',
            'IFD': 'Sakin Esnek Doğrudan',
            'IFH': 'Sakin Esnek Hassas',
        };
        return descriptions[type] || 'Bilinmeyen Tip';
    };

    return {
        basicTestResults,
        detailedTestResults,
        setBasicTestResults: setBasicTestResultsGlobal,
        setDetailedTestResults: setDetailedTestResultsGlobal,
        syncBasicTestFromServer,
        hasCompletedBasicTest,
        hasCompletedDetailedTest,
        getPersonalityType,
        getPersonalityDescription,
    };
}
