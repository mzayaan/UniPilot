import Purchases, {
  LOG_LEVEL,
  PurchasesPackage,
  CustomerInfo,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { supabase } from './supabase';

const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '';

// ── Entitlement / product IDs ─────────────────────────────────────────────────
export const ENTITLEMENTS = {
  pro:     'pro_access',
  proPLus: 'pro_plus_access',
};

// Maps RC product identifier → Supabase plan_name
const RC_PRODUCT_TO_PLAN: Record<string, string> = {
  pro_monthly:      'pro',
  pro_yearly:       'pro',
  pro_plus_monthly: 'pro_plus',
  pro_plus_yearly:  'pro_plus',
};

// ── Initialise (call once in _layout.tsx) ────────────────────────────────────
export async function initPurchases(userId?: string) {
  if (Platform.OS === 'web') return;
  // Skip if RevenueCat API key hasn't been configured yet
  if (!ANDROID_KEY || ANDROID_KEY.startsWith('YOUR_')) return;

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  const apiKey = Platform.select({ android: ANDROID_KEY, ios: ANDROID_KEY }) ?? '';
  Purchases.configure({ apiKey, appUserID: userId ?? null });
}

// ── Identify user after login ────────────────────────────────────────────────
export async function identifyUser(userId: string) {
  if (Platform.OS === 'web') return;
  try {
    await Purchases.logIn(userId);
  } catch (_) {}
}

// ── Log out (call on sign-out) ────────────────────────────────────────────────
export async function logOutPurchases() {
  if (Platform.OS === 'web') return;
  try {
    await Purchases.logOut();
  } catch (_) {}
}

// ── Fetch current offerings ───────────────────────────────────────────────────
export async function getOfferings() {
  if (Platform.OS === 'web') return null;
  try {
    return await Purchases.getOfferings();
  } catch {
    return null;
  }
}

// ── Purchase a package ────────────────────────────────────────────────────────
export async function purchasePackage(
  pkg: PurchasesPackage,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  if (Platform.OS === 'web') {
    return { success: false, error: 'Purchases not available on web.' };
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    await syncCustomerInfoToSupabase(customerInfo, userId);
    return { success: true };
  } catch (err: any) {
    if (err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return { success: false, error: 'cancelled' };
    }
    return { success: false, error: err.message ?? 'Purchase failed.' };
  }
}

// ── Restore purchases ─────────────────────────────────────────────────────────
export async function restorePurchases(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  if (Platform.OS === 'web') {
    return { success: false, error: 'Not available on web.' };
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    await syncCustomerInfoToSupabase(customerInfo, userId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Restore failed.' };
  }
}

// ── Get current customer info (for cold-start sync) ───────────────────────────
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (Platform.OS === 'web') return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

// ── Sync CustomerInfo → Supabase subscriptions table ─────────────────────────
export async function syncCustomerInfoToSupabase(
  customerInfo: CustomerInfo,
  userId: string,
) {
  const proActive     = customerInfo.entitlements.active[ENTITLEMENTS.pro];
  const proPlusActive = customerInfo.entitlements.active[ENTITLEMENTS.proPLus];

  let planName = 'free';
  let entitlement = 'free';
  let productId: string | null = null;
  let expiresAt: string | null = null;

  if (proPlusActive) {
    planName    = 'pro_plus';
    entitlement = ENTITLEMENTS.proPLus;
    productId   = proPlusActive.productIdentifier;
    expiresAt   = proPlusActive.expirationDate ?? null;
  } else if (proActive) {
    planName    = 'pro';
    entitlement = ENTITLEMENTS.pro;
    productId   = proActive.productIdentifier;
    expiresAt   = proActive.expirationDate ?? null;
  }

  const rcAppUserId = customerInfo.originalAppUserId;

  await supabase
    .from('subscriptions')
    .upsert(
      {
        user_id:                 userId,
        plan_name:               planName,
        entitlement:             entitlement,
        status:                  planName === 'free' ? 'inactive' : 'active',
        revenuecat_customer_id:  rcAppUserId,
        current_product_id:      productId,
        expires_at:              expiresAt,
        updated_at:              new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
}
