import { describe, it, expect } from 'vitest';
import { getStormLevel, getStormLevelNumeric } from './solarData';

// NOAA G-scale thresholds: G0=Kp<5, G1=Kp5, G2=Kp6, G3=Kp7, G4=Kp8, G5=Kp9
// Wrong thresholds = false alarms or missed storms — these tests protect that.

describe('getStormLevel', () => {
  describe('G0 — Quiet', () => {
    it('classifies Kp 0 as G0', () => expect(getStormLevel(0).code).toBe('G0'));
    it('classifies Kp 4.99 as G0', () => expect(getStormLevel(4.99).code).toBe('G0'));
    it('classifies negative Kp as G0', () => expect(getStormLevel(-1).code).toBe('G0'));
  });

  describe('G1 — Minor', () => {
    it('classifies Kp 5.0 as G1', () => expect(getStormLevel(5.0).code).toBe('G1'));
    it('classifies Kp 5.5 as G1', () => expect(getStormLevel(5.5).code).toBe('G1'));
    it('classifies Kp 5.99 as G1', () => expect(getStormLevel(5.99).code).toBe('G1'));
  });

  describe('G2 — Moderate (isAlert threshold)', () => {
    it('classifies Kp 6.0 as G2', () => expect(getStormLevel(6.0).code).toBe('G2'));
    it('classifies Kp 6.5 as G2', () => expect(getStormLevel(6.5).code).toBe('G2'));
    it('classifies Kp 6.99 as G2', () => expect(getStormLevel(6.99).code).toBe('G2'));
  });

  describe('G3 — Strong', () => {
    it('classifies Kp 7.0 as G3', () => expect(getStormLevel(7.0).code).toBe('G3'));
    it('classifies Kp 7.99 as G3', () => expect(getStormLevel(7.99).code).toBe('G3'));
  });

  describe('G4 — Severe', () => {
    it('classifies Kp 8.0 as G4', () => expect(getStormLevel(8.0).code).toBe('G4'));
    it('classifies Kp 8.99 as G4', () => expect(getStormLevel(8.99).code).toBe('G4'));
  });

  describe('G5 — Extreme', () => {
    it('classifies Kp 9.0 as G5', () => expect(getStormLevel(9.0).code).toBe('G5'));
    it('classifies Kp 9.9 as G5', () => expect(getStormLevel(9.9).code).toBe('G5'));
  });

  describe('boundary precision', () => {
    it('G1/G0 boundary: 4.99 is G0, 5.0 is G1', () => {
      expect(getStormLevel(4.99).code).toBe('G0');
      expect(getStormLevel(5.0).code).toBe('G1');
    });
    it('G2/G1 boundary: 5.99 is G1, 6.0 is G2', () => {
      expect(getStormLevel(5.99).code).toBe('G1');
      expect(getStormLevel(6.0).code).toBe('G2');
    });
    it('G3/G2 boundary: 6.99 is G2, 7.0 is G3', () => {
      expect(getStormLevel(6.99).code).toBe('G2');
      expect(getStormLevel(7.0).code).toBe('G3');
    });
    it('G4/G3 boundary: 7.99 is G3, 8.0 is G4', () => {
      expect(getStormLevel(7.99).code).toBe('G3');
      expect(getStormLevel(8.0).code).toBe('G4');
    });
    it('G5/G4 boundary: 8.99 is G4, 9.0 is G5', () => {
      expect(getStormLevel(8.99).code).toBe('G4');
      expect(getStormLevel(9.0).code).toBe('G5');
    });
  });

  describe('label and color presence', () => {
    it('every G-scale has a non-empty label', () => {
      [0, 5, 6, 7, 8, 9].forEach((kp) => {
        expect(getStormLevel(kp).label.length).toBeGreaterThan(0);
      });
    });
    it('every G-scale has a non-empty hex color', () => {
      [0, 5, 6, 7, 8, 9].forEach((kp) => {
        expect(getStormLevel(kp).color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });
});

describe('getStormLevelNumeric', () => {
  it('returns 0 for quiet conditions', () => expect(getStormLevelNumeric(0)).toBe(0));
  it('returns 1 for G1', () => expect(getStormLevelNumeric(5)).toBe(1));
  it('returns 2 for G2 (alert threshold)', () => expect(getStormLevelNumeric(6)).toBe(2));
  it('returns 3 for G3', () => expect(getStormLevelNumeric(7)).toBe(3));
  it('returns 4 for G4', () => expect(getStormLevelNumeric(8)).toBe(4));
  it('returns 5 for G5', () => expect(getStormLevelNumeric(9)).toBe(5));
});
