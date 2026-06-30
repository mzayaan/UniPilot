import { PLAN_LIMITS, PlanName } from '../../src/types';

describe('PLAN_LIMITS', () => {
  describe('free plan', () => {
    const free = PLAN_LIMITS.free;

    it('caps modules at 3', () => {
      expect(free.maxModules).toBe(3);
    });

    it('caps tasks at 10', () => {
      expect(free.maxTasks).toBe(10);
    });

    it('allows 3 AI generations per month', () => {
      expect(free.aiGenerationsPerMonth).toBe(3);
    });

    it('disables all premium features', () => {
      expect(free.budgetTracker).toBe(false);
      expect(free.aiQuizzes).toBe(false);
      expect(free.fileUpload).toBe(false);
      expect(free.groupProjects).toBe(false);
      expect(free.cvBuilder).toBe(false);
      expect(free.advancedPriority).toBe(false);
    });
  });

  describe('pro plan', () => {
    const pro = PLAN_LIMITS.pro;

    it('has unlimited modules', () => {
      expect(pro.maxModules).toBe(Infinity);
    });

    it('has unlimited tasks', () => {
      expect(pro.maxTasks).toBe(Infinity);
    });

    it('allows 100 AI generations per month', () => {
      expect(pro.aiGenerationsPerMonth).toBe(100);
    });

    it('enables core premium features', () => {
      expect(pro.budgetTracker).toBe(true);
      expect(pro.aiQuizzes).toBe(true);
      expect(pro.fileUpload).toBe(true);
      expect(pro.advancedPriority).toBe(true);
    });

    it('does NOT include group projects or cv builder', () => {
      expect(pro.groupProjects).toBe(false);
      expect(pro.cvBuilder).toBe(false);
    });
  });

  describe('pro_plus plan', () => {
    const pro_plus = PLAN_LIMITS.pro_plus;

    it('has unlimited modules and tasks', () => {
      expect(pro_plus.maxModules).toBe(Infinity);
      expect(pro_plus.maxTasks).toBe(Infinity);
    });

    it('allows 300 AI generations per month', () => {
      expect(pro_plus.aiGenerationsPerMonth).toBe(300);
    });

    it('enables all premium features', () => {
      expect(pro_plus.budgetTracker).toBe(true);
      expect(pro_plus.aiQuizzes).toBe(true);
      expect(pro_plus.fileUpload).toBe(true);
      expect(pro_plus.groupProjects).toBe(true);
      expect(pro_plus.cvBuilder).toBe(true);
      expect(pro_plus.advancedPriority).toBe(true);
    });
  });

  describe('plan hierarchy', () => {
    it('pro_plus has more AI generations than pro', () => {
      expect(PLAN_LIMITS.pro_plus.aiGenerationsPerMonth).toBeGreaterThan(
        PLAN_LIMITS.pro.aiGenerationsPerMonth
      );
    });

    it('pro has more AI generations than free', () => {
      expect(PLAN_LIMITS.pro.aiGenerationsPerMonth).toBeGreaterThan(
        PLAN_LIMITS.free.aiGenerationsPerMonth
      );
    });

    it('free has a hard module cap', () => {
      // Free users cannot add a 4th module
      const userModuleCount = 3;
      expect(userModuleCount >= PLAN_LIMITS.free.maxModules).toBe(true);
    });
  });

  describe('feature gating helper pattern', () => {
    // Simulates how screens use PLAN_LIMITS
    function canUseFeature(plan: PlanName, feature: keyof typeof PLAN_LIMITS.free): boolean {
      return PLAN_LIMITS[plan][feature] as boolean;
    }

    it('free user cannot access budget tracker', () => {
      expect(canUseFeature('free', 'budgetTracker')).toBe(false);
    });

    it('pro user can access budget tracker', () => {
      expect(canUseFeature('pro', 'budgetTracker')).toBe(true);
    });

    it('free user cannot access group projects', () => {
      expect(canUseFeature('free', 'groupProjects')).toBe(false);
    });

    it('pro user cannot access group projects', () => {
      expect(canUseFeature('pro', 'groupProjects')).toBe(false);
    });

    it('pro_plus user can access group projects', () => {
      expect(canUseFeature('pro_plus', 'groupProjects')).toBe(true);
    });

    it('pro_plus user can access cv builder', () => {
      expect(canUseFeature('pro_plus', 'cvBuilder')).toBe(true);
    });
  });
});
