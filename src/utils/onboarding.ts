import { router } from 'expo-router';

import { AppKeys, appSet } from '@/utils/app-storage';

export function completeOnboarding(): void {
  appSet(AppKeys.ONBOARDING_COMPLETE, true);
  router.replace('/(tabs)');
}

export function resetOnboarding(): void {
  appSet(AppKeys.ONBOARDING_COMPLETE, false);
  router.replace('/onboarding');
}
