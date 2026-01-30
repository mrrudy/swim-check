/**
 * HTML parsing logic for example pool scraper
 * This is a template scraper that demonstrates how to parse availability from HTML
 */

import * as cheerio from 'cheerio';
import type { LaneAvailability, TimeSlot } from '@swim-check/shared';

export interface ParsedBooking {
  laneNumber: number;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

/**
 * Parse HTML from a pool booking page
 * This example demonstrates the expected structure - real scrapers will customize for each pool
 */
export function parseAvailabilityHtml(
  html: string,
  date: Date,
  timeSlot: TimeSlot,
  laneIds: Map<number, string>
): LaneAvailability[] {
  const $ = cheerio.load(html);
  const availabilities: LaneAvailability[] = [];
  const now = new Date();

  // Example: Look for a table with lane availability
  // Real scrapers would adapt to the specific HTML structure of each pool's website

  // For the example, we'll generate mock availability based on lane IDs
  for (const [laneNumber, laneId] of laneIds) {
    // In a real scraper, we would parse the HTML to determine if this lane is available
    // For the example, we'll just mark all lanes as available
    availabilities.push({
      laneId,
      laneNumber,
      isAvailable: true,
      lastUpdated: now,
    });
  }

  return availabilities;
}

/**
 * Parse booking table from common pool website format
 * Many pool websites use a table layout with lanes as rows and times as columns
 */
export function parseBookingTable($: cheerio.CheerioAPI, selector: string): ParsedBooking[] {
  const bookings: ParsedBooking[] = [];

  $(selector).find('tr').each((rowIndex, row) => {
    if (rowIndex === 0) return; // Skip header row

    const laneNumber = parseInt($(row).find('td:first').text().trim()) || rowIndex;

    $(row).find('td.booking-slot').each((_, slot) => {
      const $slot = $(slot);
      const isBooked = $slot.hasClass('booked') || $slot.data('booked') === true;
      const startTime = $slot.data('start') as string;
      const endTime = $slot.data('end') as string;
      const date = $slot.data('date') as string;

      if (startTime && endTime && date) {
        bookings.push({
          laneNumber,
          date,
          startTime,
          endTime,
          isBooked,
        });
      }
    });
  });

  return bookings;
}

/**
 * Filter bookings for a specific time slot
 */
export function filterBookingsForTimeSlot(
  bookings: ParsedBooking[],
  date: string,
  timeSlot: TimeSlot
): ParsedBooking[] {
  return bookings.filter((booking) => {
    if (booking.date !== date) return false;

    // Check if booking overlaps with requested time slot
    const bookingStart = booking.startTime;
    const bookingEnd = booking.endTime;
    const requestStart = timeSlot.startTime;
    const requestEnd = timeSlot.endTime;

    // Overlap if: bookingStart < requestEnd AND bookingEnd > requestStart
    return bookingStart < requestEnd && bookingEnd > requestStart;
  });
}
