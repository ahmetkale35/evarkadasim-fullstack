import { useState, useEffect } from 'react';
import { TestResults, DetailedTestResults } from '@/types';

// Global state için basit bir store
let globalBasicTestResults: TestResults | null = null;
let globalDetailedTestResults: DetailedTestResults | null = null;
let listeners: Set<() => void> = new Set();

const notifyListeners = () => {
    listeners.forEach(listener => listener());
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

        return () => {
            listeners.delete(listener);
        };
    }, []);

    const setBasicTestResultsGlobal = (results: TestResults | null) => {
        globalBasicTestResults = results;
        setBasicTestResults(results);
        notifyListeners();
    };

    const setDetailedTestResultsGlobal = (results: DetailedTestResults | null) => {
        globalDetailedTestResults = results;
        setDetailedTestResults(results);
        notifyListeners();
    };

    const hasCompletedBasicTest = (): boolean => {
        return globalBasicTestResults !== null;
    };

    const hasCompletedDetailedTest = (): boolean => {
        return globalDetailedTestResults !== null;
    };

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
            'IFH': 'Sakin Esnek Hassas'
        };
        return descriptions[type] || 'Bilinmeyen Tip';
    };

    return {
        basicTestResults,
        detailedTestResults,
        setBasicTestResults: setBasicTestResultsGlobal,
        setDetailedTestResults: setDetailedTestResultsGlobal,
        hasCompletedBasicTest,
        hasCompletedDetailedTest,
        getPersonalityType,
        getPersonalityDescription
    };
} 