import '@testing-library/jest-native/extend-expect';

// Silence non-critical warnings in tests
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation((msg) => {
  // Still surface real errors
  if (typeof msg === 'string' && msg.includes('Warning:')) return;
  console.info('[test error]', msg);
});

// Mock environment variables
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.EXPO_PUBLIC_REVENUECAT_API_KEY = 'test-rc-key';
