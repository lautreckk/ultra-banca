'use client';

import { useState, useCallback, useEffect } from 'react';
import { getActiveAdsByTrigger, type Propaganda } from '@/lib/admin/actions/ads';

type AdTrigger = 'login' | 'saque' | 'deposito';

const STORAGE_KEY = 'ad_popup_shown';
const COOLDOWN_HOURS = 24;
const CLEANUP_DAYS = 7;

interface StoredAdData {
  [adId: string]: number; // timestamp when shown
}

function getStoredData(): StoredAdData {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

function setStoredData(data: StoredAdData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

function cleanupOldEntries(data: StoredAdData): StoredAdData {
  const now = Date.now();
  const maxAge = CLEANUP_DAYS * 24 * 60 * 60 * 1000;
  const cleaned: StoredAdData = {};

  for (const [id, timestamp] of Object.entries(data)) {
    if (now - timestamp < maxAge) {
      cleaned[id] = timestamp;
    }
  }

  return cleaned;
}

function canShowAd(adId: string, storedData: StoredAdData): boolean {
  const lastShown = storedData[adId];
  if (!lastShown) return true;

  const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
  return Date.now() - lastShown > cooldownMs;
}

function markAdAsShown(adId: string): void {
  const data = getStoredData();
  data[adId] = Date.now();
  const cleaned = cleanupOldEntries(data);
  setStoredData(cleaned);
}

export function useAdPopup(trigger: AdTrigger) {
  const [ads, setAds] = useState<Propaganda[]>([]);
  const [currentAd, setCurrentAd] = useState<Propaganda | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch ads on mount
  useEffect(() => {
    let mounted = true;

    const fetchAds = async () => {
      setIsLoading(true);
      try {
        const result = await getActiveAdsByTrigger(trigger);
        if (mounted) {
          setAds(result);
        }
      } catch (error) {
        console.error('Error fetching ads:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAds();

    return () => {
      mounted = false;
    };
  }, [trigger]);

  const showAd = useCallback(() => {
    if (ads.length === 0) return;

    const storedData = getStoredData();
    const cleanedData = cleanupOldEntries(storedData);

    // Find the first ad that can be shown (respecting cooldown)
    const adToShow = ads.find((ad) => canShowAd(ad.id, cleanedData));

    if (adToShow) {
      setCurrentAd(adToShow);
      setIsVisible(true);
      markAdAsShown(adToShow.id);
    }
  }, [ads]);

  const closeAd = useCallback(() => {
    setIsVisible(false);
    setCurrentAd(null);
  }, []);

  return {
    currentAd,
    isVisible,
    isLoading,
    showAd,
    closeAd,
    hasAds: ads.length > 0,
  };
}
