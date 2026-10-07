/**
 * Zeffy Donation Integration
 *
 * Central configuration for the Srinivasam Zeffy donation page.
 * All donate buttons across the site should use this URL and helper.
 */

export const ZEFFY_DONATION_URL =
  'https://www.zeffy.com/en-US/donation-form/donate-to-change-lives-25152';

/**
 * Opens the Zeffy donation page in a new browser tab.
 */
export function openZeffyDonation(url) {
  window.open(url || ZEFFY_DONATION_URL, '_blank', 'noopener,noreferrer');
}
