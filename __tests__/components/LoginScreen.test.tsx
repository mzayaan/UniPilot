import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../../app/(auth)/login';

// ─── Module mocks ─────────────────────────────────────────────────────────────

const mockSignIn = jest.fn();
const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    signIn: mockSignIn,
    user: null,
    subscription: null,
  })),
}));

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    colors: {
      background: '#FFFFFF',
      text: '#000000',
      textSecondary: '#666666',
      textTertiary: '#999999',
      border: '#E0E0E0',
      input: '#F5F5F5',
      inputBorder: '#CCCCCC',
      placeholder: '#AAAAAA',
    },
  })),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders email and password inputs', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    expect(getByPlaceholderText('you@university.ac.uk')).toBeTruthy();
    expect(getByPlaceholderText('Your password')).toBeTruthy();
  });

  it('renders Sign In button', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('shows validation error when email is empty', async () => {
    const { getByText } = render(<LoginScreen />);

    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(getByText('Email is required')).toBeTruthy();
    });
  });

  it('shows validation error when password is empty', async () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('you@university.ac.uk'), 'user@test.com');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(getByText('Password is required')).toBeTruthy();
    });
  });

  it('calls signIn with email and password on valid form', async () => {
    mockSignIn.mockResolvedValue({ error: null });

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('you@university.ac.uk'), 'user@test.com');
    fireEvent.changeText(getByPlaceholderText('Your password'), 'password123');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('user@test.com', 'password123');
    });
  });

  it('lowercases email before signing in', async () => {
    mockSignIn.mockResolvedValue({ error: null });

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('you@university.ac.uk'), 'USER@TEST.COM');
    fireEvent.changeText(getByPlaceholderText('Your password'), 'password123');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('user@test.com', 'password123');
    });
  });

  it('does not call signIn when validation fails', async () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(mockSignIn).not.toHaveBeenCalled();
    });
  });

  it('navigates to register screen', () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Sign Up'));
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/register');
  });

  it('navigates back when back button pressed', () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('← Back'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('navigates to forgot-password when link pressed', () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Forgot Password?'));
    expect(mockPush).toHaveBeenCalledWith('/(auth)/forgot-password');
  });
});
