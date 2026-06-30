// Mock for expo-linking

export const createURL = jest.fn((path: string) => `unipilot://${path}`);
export const getInitialURL = jest.fn().mockResolvedValue(null);
export const addEventListener = jest.fn().mockReturnValue({ remove: jest.fn() });
export const openURL = jest.fn().mockResolvedValue(undefined);
export const canOpenURL = jest.fn().mockResolvedValue(true);
export const parse = jest.fn((url: string) => ({ scheme: 'unipilot', path: url }));
