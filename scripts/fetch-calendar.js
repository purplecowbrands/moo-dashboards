#!/usr/bin/env node

/**
 * Fetch Google Calendar events and write to data/calendar.json
 * 
 * This script uses the Google Calendar API with a service account
 * to fetch Ben's calendar events and save them in a format the
 * dashboard can consume.
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Paths
const CREDENTIALS_PATH = path.join(__dirname, '../credentials/service-account-key.json');
const OUTPUT_PATH = path.join(__dirname, '../data/calendar.json');

// Ben's calendar ID
const CALENDAR_ID = 'ben@purplecowbrands.com';

// Scopes for calendar read-only access
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

async function fetchCalendarEvents() {
  try {
    // Load service account credentials
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    
    // Create JWT auth client
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      SCOPES
    );

    // Create calendar client
    const calendar = google.calendar({ version: 'v3', auth });

    // Get today's date range
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Get next 7 days for preview
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    console.log('Fetching today\'s events...');
    
    // Fetch today's events
    const todayResponse = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    console.log('Fetching next 7 days...');
    
    // Fetch next week's events
    const weekResponse = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: now.toISOString(),
      timeMax: nextWeek.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    // Process events
    const todayEvents = todayResponse.data.items || [];
    const weekEvents = weekResponse.data.items || [];

    // Detect current meeting
    const currentMeeting = todayEvents.find(event => {
      if (!event.start || !event.end) return false;
      const start = new Date(event.start.dateTime || event.start.date);
      const end = new Date(event.end.dateTime || event.end.date);
      return now >= start && now <= end;
    });

    // Count 121 meetings (meetings with "121" or "1:1" or "one-on-one" in title)
    const oneOnOneRegex = /\b(121|1:1|one[- ]on[- ]one)\b/i;
    const oneOnOneMeetingsThisWeek = weekEvents.filter(event => {
      const title = event.summary || '';
      return oneOnOneRegex.test(title);
    }).length;

    // Format events for dashboard
    const formatEvent = (event) => ({
      id: event.id,
      title: event.summary || '(No title)',
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      location: event.location || null,
      description: event.description || null,
      attendees: (event.attendees || []).map(a => ({
        email: a.email,
        responseStatus: a.responseStatus,
        displayName: a.displayName || null,
      })),
      htmlLink: event.htmlLink,
      isAllDay: !event.start.dateTime,
    });

    const output = {
      lastFetched: new Date().toISOString(),
      today: {
        date: startOfDay.toISOString(),
        events: todayEvents.map(formatEvent),
        count: todayEvents.length,
      },
      currentMeeting: currentMeeting ? formatEvent(currentMeeting) : null,
      upcoming: {
        nextSevenDays: weekEvents.map(formatEvent),
        count: weekEvents.length,
      },
      metrics: {
        oneOnOneMeetingsThisWeek: oneOnOneMeetingsThisWeek,
      },
    };

    // Write to file
    const outputDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');
    
    console.log(`✓ Calendar data saved to ${OUTPUT_PATH}`);
    console.log(`  - Today's events: ${todayEvents.length}`);
    console.log(`  - Current meeting: ${currentMeeting ? currentMeeting.summary : 'None'}`);
    console.log(`  - Next 7 days: ${weekEvents.length} events`);
    console.log(`  - 121s this week: ${oneOnOneMeetingsThisWeek}`);

  } catch (error) {
    console.error('Error fetching calendar:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the script
fetchCalendarEvents();
