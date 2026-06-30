// Mock for expo-web-browser

export const openAuthSessionAsync = jest.fn().mockResolvedValue({
  type: 'success',
  url: 'unipilot://auth/callback?code=mock-auth-code',
});
export const openBrowserAsync = jest.fn().mockResolvedValue({ type: 'opened' });
export const dismissBrowser = jest.fn();
export const maybeCompleteAuthSession = jest.fn().mockReturnValue({ type: 'success' });
export const warmUpAsync = jest.fn().mockResolvedValue(undefined);
export const coolDownAsync = jest.fn().mockResolvedValue(undefined);
