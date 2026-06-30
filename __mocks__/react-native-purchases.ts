// Mock for react-native-purchases

const Purchases = {
  configure: jest.fn(),
  logIn: jest.fn().mockResolvedValue({ customerInfo: {}, created: false }),
  logOut: jest.fn().mockResolvedValue({ customerInfo: {} }),
  getCustomerInfo: jest.fn().mockResolvedValue({
    customerInfo: {
      activeSubscriptions: [],
      entitlements: { active: {} },
    },
  }),
  getOfferings: jest.fn().mockResolvedValue({
    current: {
      availablePackages: [],
    },
  }),
  purchasePackage: jest.fn().mockResolvedValue({
    customerInfo: {
      activeSubscriptions: ['pro_monthly'],
      entitlements: { active: { pro_access: { isActive: true } } },
    },
  }),
  restorePurchases: jest.fn().mockResolvedValue({ customerInfo: {} }),
  addCustomerInfoUpdateListener: jest.fn().mockReturnValue(() => {}),
  removeCustomerInfoUpdateListener: jest.fn(),
  isConfigured: false,
};

export default Purchases;
export { Purchases };
