import { describe, it, expect } from 'vitest';
import { getStoryProvince } from '../app/lucky-stories';

describe('getStoryProvince', () => {
  it('should return null for empty or invalid input', () => {
    expect(getStoryProvince()).toBeNull();
    expect(getStoryProvince(null)).toBeNull();
    expect(getStoryProvince('')).toBeNull();
    expect(getStoryProvince('   ')).toBeNull();
  });

  it('should match exact province codes', () => {
    expect(getStoryProvince('BC').code).toBe('BC');
    expect(getStoryProvince('bc').code).toBe('BC');
    expect(getStoryProvince('AB').code).toBe('AB');
    expect(getStoryProvince('ON').code).toBe('ON');
  });

  it('should match codes with punctuation', () => {
    expect(getStoryProvince('B.C.').code).toBe('BC');
    expect(getStoryProvince('N.S.').code).toBe('NS');
    expect(getStoryProvince('P.E.I.').code).toBe('PE');
  });

  it('should match full province names', () => {
    expect(getStoryProvince('British Columbia').code).toBe('BC');
    expect(getStoryProvince('Nova Scotia').code).toBe('NS');
    expect(getStoryProvince('Newfoundland and Labrador').code).toBe('NL');
  });

  it('should match province names ignoring case and accents', () => {
    expect(getStoryProvince('québec').code).toBe('QC');
    expect(getStoryProvince('QUEBEC').code).toBe('QC');
    expect(getStoryProvince('british columbia').code).toBe('BC');
  });

  it('should match aliases', () => {
    expect(getStoryProvince('alta').code).toBe('AB');
    expect(getStoryProvince('sask').code).toBe('SK');
    expect(getStoryProvince('manitoba').code).toBe('MB');
    expect(getStoryProvince('ont').code).toBe('ON');
    expect(getStoryProvince('nfld').code).toBe('NL');
  });

  it('should extract province from a longer location string', () => {
    expect(getStoryProvince('Vancouver, BC').code).toBe('BC');
    expect(getStoryProvince('Halifax, Nova Scotia, Canada').code).toBe('NS');
    expect(getStoryProvince('St. John\'s, NL').code).toBe('NL');
    expect(getStoryProvince('Toronto, Ontario').code).toBe('ON');
    expect(getStoryProvince('Montreal QC').code).toBe('QC');
    expect(getStoryProvince('Calgary (AB)').code).toBe('AB');
    expect(getStoryProvince('Victoria, B.C.').code).toBe('BC');
    expect(getStoryProvince('Edmonton, Alta').code).toBe('AB');
  });

  it('should not match partial words as codes or aliases', () => {
    // "bc" is in "abc", should not match BC
    expect(getStoryProvince('abc')).toBeNull();
    // "on" is in "london", should not match ON
    expect(getStoryProvince('london')).toBeNull();
    // "ns" is in "mons", should not match NS
    expect(getStoryProvince('mons')).toBeNull();
    // "nt" is in "montreal", should not match NT
    expect(getStoryProvince('montreal')).toBeNull(); // It should match QC if QC was in the string, but here it's just 'montreal'
    // Actually montreal doesn't have QC in it, so it should be null. Wait, let's test montreal specifically
  });
});
