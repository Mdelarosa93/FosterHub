'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../components/AppShell';

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const sampleAppointments = [
  { id: '1', child: 'Archer Hall', date: '2026-04-05', time: '2:00PM', note: 'Court review', color: '#50c4b7' },
  { id: '2', child: 'Ava Johnson', date: '2026-04-06', time: '9:00AM', note: 'Home visit', color: '#046307' },
  { id: '3', child: 'Ava Johnson', date: '2026-04-18', time: '1:30PM', note: 'School meeting', color: '#10588c' },
  { id: '4', child: 'Archer Hall', date: '2026-04-22', time: '11:00AM', note: 'Medical appointment', color: '#d96c3c' },
];

const caseOptions = ['Hall - 123456', 'Johnson - 234567', 'Carter - 345678', 'Lewis - 456789'];
const childrenByCase: Record<string, string[]> = {
  'Hall - 123456': ['Archer Hall', 'Mia Hall'],
  'Johnson - 234567': ['Ava Johnson'],
  'Carter - 345678': ['Noah Carter', 'Liam Carter'],
  'Lewis - 456789': ['Emma Lewis'],
};
const userOptions = [
  'Sarah Hall',
  'David Hall',
  'Attorney Maria Lopez',
  'Case Worker Taylor Reed',
  'Biological Parent Janelle Hall',
  'Dr. Priya Shah',
  'School Liaison Marcus Green',
];
const recommendedUsersByCase: Record<string, string[]> = {
  'Hall - 123456': ['Sarah Hall', 'David Hall', 'Attorney Maria Lopez', 'Case Worker Taylor Reed'],
  'Johnson - 234567': ['Case Worker Taylor Reed', 'Dr. Priya Shah', 'School Liaison Marcus Green'],
  'Carter - 345678': ['Case Worker Taylor Reed', 'Attorney Maria Lopez'],
  'Lewis - 456789': ['Case Worker Taylor Reed'],
};
const eventTypeOptions = [
  'Biological Parent Visitation',
  'Court',
  'Child Doctor Appointment',
  'Out of Office',
  'Sibling Visitation',
  'Home Visit',
];
const placeSuggestions = [
  '126 Ridgewood Ave, Orlando, FL 32801',
  '126 Ridgewood St, Winter Park, FL 32789',
  '126 Ridgewood Dr, Kissimmee, FL 34744',
  'Orange County Courthouse, 425 N Orange Ave, Orlando, FL',
  'Arnold Palmer Hospital for Children, 92 W Miller St, Orlando, FL',
  'Lake Nona Medical Center, 6718 Lake Nona Blvd, Orlando, FL',
  'FosterHub Office - Orlando, 100 S Orange Ave, Orlando, FL',
  'Archer Hall Foster Home, 1452 Oak Terrace, Orlando, FL',
  'Ava Johnson Foster Home, 803 Pine Grove Ct, Orlando, FL',
  'Biological Parent Residence - Hall Family, 411 E Colonial Dr, Orlando, FL',
];
const recommendedLocationsByCase: Record<string, string[]> = {
  'Hall - 123456': [
    'Archer Hall Foster Home, 1452 Oak Terrace, Orlando, FL',
    'Biological Parent Residence - Hall Family, 411 E Colonial Dr, Orlando, FL',
    'Orange County Courthouse, 425 N Orange Ave, Orlando, FL',
  ],
  'Johnson - 234567': [
    'Ava Johnson Foster Home, 803 Pine Grove Ct, Orlando, FL',
    'Arnold Palmer Hospital for Children, 92 W Miller St, Orlando, FL',
    'Lake Nona Medical Center, 6718 Lake Nona Blvd, Orlando, FL',
  ],
  'Carter - 345678': ['FosterHub Office - Orlando, 100 S Orange Ave, Orlando, FL'],
  'Lewis - 456789': ['FosterHub Office - Orlando, 100 S Orange Ave, Orlando, FL'],
};

function formatMonthHeading(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function buildCalendarDays(baseDate: Date) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    return current;
  });
}

function timeToSortableNumber(value: string) {
  const match = value.match(/(\d+):(\d+)(AM|PM)/i);
  if (!match) return 0;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;

  return hour * 60 + minute;
}

export default function CalendarPage() {
  const [visibleDate, setVisibleDate] = useState(() => new Date());
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(caseOptions[0]);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [selectedEventType, setSelectedEventType] = useState(eventTypeOptions[0]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [showMoreInviteSuggestions, setShowMoreInviteSuggestions] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationChosen, setLocationChosen] = useState(false);
  const [showMoreLocationSuggestions, setShowMoreLocationSuggestions] = useState(false);
  const [eventDate, setEventDate] = useState('2026-04-05');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('15:00');
  const [notes, setNotes] = useState('');

  const monthDays = useMemo(() => buildCalendarDays(visibleDate), [visibleDate]);
  const monthLabel = useMemo(() => formatMonthHeading(visibleDate), [visibleDate]);
  const activeMonth = visibleDate.getMonth();

  const appointmentMap = useMemo(() => {
    const map = new Map<string, typeof sampleAppointments>();
    for (const appointment of sampleAppointments) {
      const current = map.get(appointment.date) || [];
      map.set(
        appointment.date,
        [...current, appointment].sort((a, b) => timeToSortableNumber(a.time) - timeToSortableNumber(b.time)),
      );
    }
    return map;
  }, []);

  const childOptions = useMemo(() => childrenByCase[selectedCase] || [], [selectedCase]);
  const recommendedUsers = useMemo(() => recommendedUsersByCase[selectedCase] || [], [selectedCase]);

  const filteredUserSuggestions = useMemo(() => {
    const pool = userOptions.filter(user => !recommendedUsers.includes(user));
    return pool.filter(user => user.toLowerCase().includes(userQuery.toLowerCase())).slice(0, 12);
  }, [recommendedUsers, userQuery]);

  const recommendedLocations = useMemo(() => recommendedLocationsByCase[selectedCase] || [], [selectedCase]);

  const filteredSuggestions = useMemo(() => {
    const pool = Array.from(new Set([...recommendedLocations, ...placeSuggestions]));
    if (!locationQuery.trim()) return pool.slice(0, 5);

    const query = locationQuery.toLowerCase().trim();
    return pool
      .map(place => {
        const normalized = place.toLowerCase();
        let score = 0;
        if (normalized.startsWith(query)) score += 5;
        if (normalized.includes(query)) score += 3;
        const queryParts = query.split(/\s+/).filter(Boolean);
        score += queryParts.filter(part => normalized.includes(part)).length;
        return { place, score };
      })
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.place)
      .slice(0, 6);
  }, [recommendedLocations, locationQuery]);

  useEffect(() => {
    setSelectedChildren([]);
    setSelectedUsers([]);
    setUserQuery('');
    setShowMoreInviteSuggestions(false);
    setLocationQuery('');
    setLocationChosen(false);
    setShowMoreLocationSuggestions(false);
  }, [selectedCase]);

  function changeMonth(direction: number) {
    setVisibleDate(current => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  }

  function toggleChild(child: string) {
    setSelectedChildren(current =>
      current.includes(child) ? current.filter(entry => entry !== child) : [...current, child],
    );
  }

  function addUser(user: string) {
    setSelectedUsers(current => (current.includes(user) ? current : [...current, user]));
    setUserQuery('');
  }

  function removeUser(user: string) {
    setSelectedUsers(current => current.filter(entry => entry !== user));
  }

  return (
    <AppShell title="Calendar">
      <main className="page-stack">
        <section className="card">
          <div className="section-title">
            <div>
              <div className="eyebrow">Up next</div>
              <h2 style={{ marginBottom: 0 }}>Upcoming appointments</h2>
            </div>
          </div>

          <div className="record-list">
            {sampleAppointments.slice(0, 2).map(item => (
              <article key={item.id} className="record-item">
                <strong>{item.child}</strong>
                <div className="record-meta">
                  <span>{new Date(item.date).toLocaleDateString()}</span>
                  <span>{item.time}</span>
                  <span>{item.note}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="section-title" style={{ alignItems: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                className="button button-ghost"
                style={{ minHeight: 42, minWidth: 42, padding: 0 }}
                onClick={() => changeMonth(-1)}
                aria-label="Previous month"
              >
                ←
              </button>
              <h2 style={{ marginBottom: 0 }}>{monthLabel}</h2>
              <button
                type="button"
                className="button button-ghost"
                style={{ minHeight: 42, minWidth: 42, padding: 0 }}
                onClick={() => changeMonth(1)}
                aria-label="Next month"
              >
                →
              </button>
            </div>

            <button type="button" className="button button-primary" onClick={() => setEventModalOpen(true)}>
              New Event
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gap: 10,
            }}
          >
            {weekdayLabels.map(label => (
              <div key={label} style={{ fontWeight: 800, color: '#10588c', padding: '6px 8px' }}>
                {label}
              </div>
            ))}

            {monthDays.map(day => {
              const isoDate = day.toISOString().slice(0, 10);
              const appointments = appointmentMap.get(isoDate) || [];
              const isCurrentMonth = day.getMonth() === activeMonth;
              const isToday = day.toDateString() === new Date().toDateString();

              return (
                <div
                  key={isoDate}
                  style={{
                    minHeight: 124,
                    borderRadius: 18,
                    border: isToday ? '2px solid rgba(4, 99, 7, 0.35)' : '1px solid #d9e5dd',
                    background: isCurrentMonth ? '#ffffff' : '#f8fbf9',
                    padding: 12,
                    display: 'grid',
                    gap: 8,
                    alignContent: 'start',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      color: isCurrentMonth ? '#123122' : '#8a9b90',
                    }}
                  >
                    {day.getDate()}
                  </div>

                  <div style={{ display: 'grid', gap: 6, minWidth: 0 }}>
                    {appointments.map(appointment => (
                      <div
                        key={appointment.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          minWidth: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontSize: 13,
                          color: '#123122',
                        }}
                        title={`${appointment.time} ${appointment.child}`}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 999,
                            background: appointment.color,
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontWeight: 700, flexShrink: 0 }}>{appointment.time}</span>
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {appointment.child}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {eventModalOpen ? (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.35)',
              display: 'grid',
              placeItems: 'center',
              padding: 24,
              zIndex: 50,
            }}
            onClick={() => setEventModalOpen(false)}
          >
            <div
              className="card"
              style={{ width: 'min(100%, 760px)', maxHeight: '88vh', overflow: 'auto', padding: 24 }}
              onClick={event => event.stopPropagation()}
            >
              <div className="section-title">
                <h2 style={{ marginBottom: 0 }}>New Event</h2>
                <button type="button" className="button button-ghost" onClick={() => setEventModalOpen(false)}>
                  Close
                </button>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="case-select">Case</label>
                  <select id="case-select" className="select" value={selectedCase} onChange={e => setSelectedCase(e.target.value)}>
                    {caseOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Child / children</label>
                  <div className="card card-muted" style={{ padding: 14 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {childOptions.map(child => (
                        <button
                          key={child}
                          type="button"
                          className="button button-ghost"
                          style={{ minHeight: 36, opacity: selectedChildren.includes(child) ? 0.6 : 1 }}
                          onClick={() => toggleChild(child)}
                        >
                          {child}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="event-type-select">Event type</label>
                  <select
                    id="event-type-select"
                    className="select"
                    value={selectedEventType}
                    onChange={e => setSelectedEventType(e.target.value)}
                  >
                    {eventTypeOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="invite-search">Invite FosterHub users</label>
                  <div
                    style={{
                      border: '1px solid #cbd8d0',
                      borderRadius: 16,
                      background: 'white',
                      padding: 12,
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    {selectedUsers.map(user => (
                      <button
                        key={user}
                        type="button"
                        className="button button-ghost"
                        style={{ minHeight: 34, padding: '8px 12px' }}
                        onClick={() => removeUser(user)}
                      >
                        {user} ×
                      </button>
                    ))}
                    <input
                      id="invite-search"
                      value={userQuery}
                      onChange={e => setUserQuery(e.target.value)}
                      placeholder={selectedUsers.length ? 'Add another user' : 'Search for users to invite'}
                      style={{
                        flex: '1 1 180px',
                        minWidth: 180,
                        border: 'none',
                        outline: 'none',
                        fontSize: 16,
                        color: '#123122',
                      }}
                    />
                  </div>

                  <div className="card card-muted" style={{ padding: 14 }}>
                    <div className="eyebrow" style={{ marginBottom: 10 }}>Recommended for {selectedCase}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {recommendedUsers.map(user => (
                        <button
                          key={user}
                          type="button"
                          className="button button-ghost"
                          style={{ minHeight: 36 }}
                          onClick={() => addUser(user)}
                          disabled={selectedUsers.includes(user)}
                        >
                          {user}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowMoreInviteSuggestions(current => !current)}
                      style={{
                        marginTop: 14,
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        color: '#10588c',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {showMoreInviteSuggestions ? '▾' : '▸'} View more recommendations
                    </button>

                    {showMoreInviteSuggestions ? (
                      <div
                        style={{
                          marginTop: 12,
                          maxHeight: 180,
                          overflowY: 'auto',
                          display: 'grid',
                          gap: 8,
                          paddingRight: 4,
                        }}
                      >
                        {filteredUserSuggestions.map(user => (
                          <button
                            key={user}
                            type="button"
                            className="button button-ghost"
                            style={{ justifyContent: 'flex-start', opacity: selectedUsers.includes(user) ? 0.45 : 1 }}
                            onClick={() => addUser(user)}
                            disabled={selectedUsers.includes(user)}
                          >
                            {user}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="location-input">Location</label>
                  <input
                    id="location-input"
                    className="input"
                    value={locationQuery}
                    onChange={e => {
                      setLocationQuery(e.target.value);
                      setLocationChosen(false);
                    }}
                    placeholder="Search address or place"
                  />
                  {!locationChosen ? (
                    <div className="card card-muted" style={{ padding: 14 }}>
                      <div className="eyebrow" style={{ marginBottom: 10 }}>
                        {locationQuery.trim() ? 'Suggested results' : 'Recommended locations'}
                      </div>
                      <div className="stack" style={{ gap: 8 }}>
                        {filteredSuggestions.slice(0, showMoreLocationSuggestions ? filteredSuggestions.length : 3).map(place => (
                          <button
                            key={place}
                            type="button"
                            className="button button-ghost"
                            style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                            onClick={() => {
                              setLocationQuery(place);
                              setLocationChosen(true);
                              setShowMoreLocationSuggestions(false);
                            }}
                          >
                            {place}
                          </button>
                        ))}
                      </div>
                      {filteredSuggestions.length > 3 ? (
                        <button
                          type="button"
                          onClick={() => setShowMoreLocationSuggestions(current => !current)}
                          style={{
                            marginTop: 14,
                            border: 'none',
                            background: 'transparent',
                            padding: 0,
                            color: '#10588c',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          {showMoreLocationSuggestions ? '▾' : '▸'} View more locations
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
                  <div className="field">
                    <label htmlFor="event-date">Date</label>
                    <input id="event-date" className="input" type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor="event-start-time">Start time</label>
                    <input id="event-start-time" className="input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor="event-end-time">End time</label>
                    <input id="event-end-time" className="input" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="event-notes">Notes</label>
                  <textarea
                    id="event-notes"
                    className="textarea"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={5}
                    placeholder="Add details, reminders, or coordination notes"
                  />
                </div>
              </div>

              <div className="actions-row" style={{ justifyContent: 'flex-end', marginTop: 22 }}>
                <button type="button" className="button button-ghost" onClick={() => setEventModalOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="button button-primary">
                  Save event
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </AppShell>
  );
}
