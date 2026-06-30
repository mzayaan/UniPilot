import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PLAN_LIMITS } from '../../src/types';

// ─── Tests for plan-gating logic used across screens ─────────────────────────
//
// Rather than rendering full screen components (which have many deps),
// these tests verify the gating logic functions in isolation, mirroring
// exactly how the screens compute canUseFeature.

type PlanName = 'free' | 'pro' | 'pro_plus';

// Helper that mirrors the pattern used in budget/index.tsx, group-projects/index.tsx etc.
function canUseFeature(plan: PlanName, feature: keyof (typeof PLAN_LIMITS)['free']): boolean {
  return PLAN_LIMITS[plan][feature] as boolean;
}

function isWithinLimit(plan: PlanName, count: number, feature: 'maxModules' | 'maxTasks'): boolean {
  return count < PLAN_LIMITS[plan][feature];
}

// ─── Budget tracker gating ────────────────────────────────────────────────────

describe('Budget tracker gating', () => {
  it('free user cannot access budget tracker', () => {
    expect(canUseFeature('free', 'budgetTracker')).toBe(false);
  });

  it('pro user can access budget tracker', () => {
    expect(canUseFeature('pro', 'budgetTracker')).toBe(true);
  });

  it('pro_plus user can access budget tracker', () => {
    expect(canUseFeature('pro_plus', 'budgetTracker')).toBe(true);
  });
});

// ─── Group projects gating ────────────────────────────────────────────────────

describe('Group projects gating', () => {
  it('free user cannot access group projects', () => {
    expect(canUseFeature('free', 'groupProjects')).toBe(false);
  });

  it('pro user cannot access group projects', () => {
    expect(canUseFeature('pro', 'groupProjects')).toBe(false);
  });

  it('pro_plus user can access group projects', () => {
    expect(canUseFeature('pro_plus', 'groupProjects')).toBe(true);
  });
});

// ─── AI features gating ───────────────────────────────────────────────────────

describe('AI features gating', () => {
  it('free user cannot access AI quizzes', () => {
    expect(canUseFeature('free', 'aiQuizzes')).toBe(false);
  });

  it('pro user can access AI quizzes', () => {
    expect(canUseFeature('pro', 'aiQuizzes')).toBe(true);
  });

  it('free user has limited AI generations', () => {
    expect(PLAN_LIMITS.free.aiGenerationsPerMonth).toBe(3);
  });
});

// ─── Module limit enforcement ─────────────────────────────────────────────────

describe('Module limit enforcement', () => {
  it('free user with 2 modules can add another', () => {
    expect(isWithinLimit('free', 2, 'maxModules')).toBe(true);
  });

  it('free user with 3 modules cannot add another', () => {
    expect(isWithinLimit('free', 3, 'maxModules')).toBe(false);
  });

  it('pro user with 20 modules can always add more', () => {
    expect(isWithinLimit('pro', 20, 'maxModules')).toBe(true);
  });
});

// ─── Task limit enforcement ───────────────────────────────────────────────────

describe('Task limit enforcement', () => {
  it('free user with 9 tasks can add one more', () => {
    expect(isWithinLimit('free', 9, 'maxTasks')).toBe(true);
  });

  it('free user with 10 tasks cannot add more', () => {
    expect(isWithinLimit('free', 10, 'maxTasks')).toBe(false);
  });

  it('pro user with 100 tasks can still add more', () => {
    expect(isWithinLimit('pro', 100, 'maxTasks')).toBe(true);
  });
});

// ─── CV Builder and file upload gating ────────────────────────────────────────

describe('CV Builder and file upload gating', () => {
  it('free user cannot use CV builder', () => {
    expect(canUseFeature('free', 'cvBuilder')).toBe(false);
  });

  it('pro user cannot use CV builder', () => {
    expect(canUseFeature('pro', 'cvBuilder')).toBe(false);
  });

  it('pro_plus user can use CV builder', () => {
    expect(canUseFeature('pro_plus', 'cvBuilder')).toBe(true);
  });

  it('free user cannot upload files', () => {
    expect(canUseFeature('free', 'fileUpload')).toBe(false);
  });

  it('pro user can upload files', () => {
    expect(canUseFeature('pro', 'fileUpload')).toBe(true);
  });
});
