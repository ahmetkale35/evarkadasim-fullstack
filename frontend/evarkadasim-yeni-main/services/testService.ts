import { TestResults, DetailedTestResults } from '@/types';
import { apiClient } from './apiClient';

export const testService = {
  submitBasic: async (results: TestResults): Promise<void> => {
    // Backend BasicTestResultDto ile birebir eşleşiyor — axios camelCase→PascalCase dönüşümünü JSON üzerinden halleder
    await apiClient.post('/test/Basic', {
      socialEnergy: results.socialEnergy,
      orderApproach: results.orderApproach,
      conflictManagement: results.conflictManagement,
      sharingStyle: results.sharingStyle,
      lifeRhythm: results.lifeRhythm,
      communicationStyle: results.communicationStyle,
    });
  },

  submitDetailed: async (results: DetailedTestResults): Promise<void> => {
    // Backend sadece ham cevap dizilerini alıyor; frontend'in finalScores hesaplama
    // formülü ((basicResult×2 + detailedAverage)/3) backend'e yansıtılmıyor.
    // İleride formül tutarlılığı sağlandığında bu endpoint güncellenecek.
    await apiClient.post('/test/Detailed', {
      detailedSocialEnergy: results.detailedSocialEnergy,
      detailedOrderApproach: results.detailedOrderApproach,
      detailedConflictManagement: results.detailedConflictManagement,
      detailedSharingStyle: results.detailedSharingStyle,
      detailedLifeRhythm: results.detailedLifeRhythm,
    });
  },
};
