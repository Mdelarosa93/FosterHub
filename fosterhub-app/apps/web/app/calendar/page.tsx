'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../components/AppShell';

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type CalendarEvent = {
  id: string;
  caseLabel: string;
  children: string[];
  date: string;
  startTime: string;
  endTime: string;
  time: string;
  eventType: string;
  notes: string;
  location: string;
  invitees: string[];
  color: string;
};

const initialAppointments: CalendarEvent[] = [
  {
    id: '1',
    caseLabel: 'Hall - 123456',
    children: ['Archer Hall'],
    date: '2026-04-05',
    startTime: '14:00',
    endTime: '15:00',
    time: '2:00PM',
    eventType: 'Court',
    notes: 'Court review',
    location: 'Orange County Courthouse, 425 N Orange Ave, Orlando, FL',
    invitees: ['Attorney Maria Lopez'],
    color: '#10588c',
  },
  {
    id: '2',
    caseLabel: 'Johnson - 234567',
    children: ['Ava Johnson'],
    date: '2026-04-06',
    startTime: '09:00',
    endTime: '10:00',
    time: '9:00AM',
    eventType: 'Home Visit',
    notes: 'Home visit',
    location: 'Ava Johnson Foster Home, 803 Pine Grove Ct, Orlando, FL',
    invitees: ['Case Worker Taylor Reed'],
    color: '#046307',
  },
  {
    id: '3',
    caseLabel: 'Johnson - 234567',
    children: ['Ava Johnson'],
    date: '2026-04-18',
    startTime: '13:30',
    endTime: '14:30',
    time: '1:30PM',
    eventType: 'Sibling Visitation',
    notes: 'School meeting',
    location: 'FosterHub Office - Orlando, 100 S Orange Ave, Orlando, FL',
    invitees: ['School Liaison Marcus Green'],
    color: '#ff6fa7',
  },
  {
    id: '4',
    caseLabel: 'Hall - 123456',
    children: ['Archer Hall'],
    date: '2026-04-22',
    startTime: '11:00',
    endTime: '12:00',
    time: '11:00AM',
    eventType: 'Child Doctor Appointment',
    notes: 'Medical appointment',
    location: 'Arnold Palmer Hospital for Children, 92 W Miller St, Orlando, FL',
    invitees: ['Dr. Priya Shah'],
    color: '#50c4b7',
  },
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
const eventTypeColors: Record<string, string> = {
  'Biological Parent Visitation': '#d96c3c',
  Court: '#10588c',
  'Child Doctor Appointment': '#50c4b7',
  'Out of Office': '#8a5cf6',
  'Sibling Visitation': '#ff6fa7',
  'Home Visit': '#046307',
};
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

function formatTimeForCalendar(value: string) {
  const [rawHour, rawMinute] = value.split(':');
  let hour = Number(rawHour);
  const minute = rawMinute;
  const meridiem = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute}${meridiem}`;
}

function syncActivityEventToCaseStorage(event: CalendarEvent) {
  if (typeof window === 'undefined' || !event.id.startsWith('activity-')) return;

  const activityId = event.id.replace(/^activity-/, '');
  const storedActivitiesRaw = localStorage.getItem('fosterhub.caseActivities');
  const storedActivities = storedActivitiesRaw ? JSON.parse(storedActivitiesRaw) : {};
  const caseActivities = storedActivities[event.caseLabel] || [];

  storedActivities[event.caseLabel] = caseActivities.map((activity: any) =>
    activity.id === activityId
      ? {
          ...activity,
          type: event.eventType,
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
          notes: event.notes,
          invitees: event.invitees,
        }
      : activity,
  );

  localStorage.setItem('fosterhub.caseActivities', JSON.stringify(storedActivities));
}

function removeActivityEventFromCaseStorage(event: CalendarEvent) {
  if (typeof window === 'undefined' || !event.id.startsWith('activity-')) return;

  const activityId = event.id.replace(/^activity-/, '');
  const storedActivitiesRaw = localStorage.getItem('fosterhub.caseActivities');
  const storedActivities = storedActivitiesRaw ? JSON.parse(storedActivitiesRaw) : {};
  const caseActivities = storedActivities[event.caseLabel] || [];

  storedActivities[event.caseLabel] = caseActivities.filter((activity: any) => activity.id !== activityId);
  localStorage.setItem('fosterhub.caseActivities', JSON.stringify(storedActivities));
}

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<CalendarEvent[]>(() => {
    if (typeof window === 'undefined') return initialAppointments;
    const storedEventsRaw = localStorage.getItem('fosterhub.calendarEvents');
    const storedEvents = storedEventsRaw ? JSON.parse(storedEventsRaw) : [];
    return [...initialAppointments, ...storedEvents];
  });
  const [visibleDate, setVisibleDate] = useState(() => new Date());
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventModalMode, setEventModalMode] = useState<'create' | 'view' | 'edit'>('create');
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState(caseOptions[0]);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [storedChildrenByCase, setStoredChildrenByCase] = useState<Record<string, string[]>>({});
  const [selectedEventType, setSelectedEventType] = useState(eventTypeOptions[0]);
  const [eventTypeMenuOpen, setEventTypeMenuOpen] = useState(false);
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
  const [eventActionsOpen, setEventActionsOpen] = useState(false);

  const monthDays = useMemo(() => buildCalendarDays(visibleDate), [visibleDate]);
  const monthLabel = useMemo(() => formatMonthHeading(visibleDate), [visibleDate]);
  const activeMonth = visibleDate.getMonth();
  const formDisabled = eventModalMode === 'view';

  const appointmentMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const appointment of appointments) {
      const current = map.get(appointment.date) || [];
      map.set(
        appointment.date,
        [...current, appointment].sort((a, b) => timeToSortableNumber(a.time) - timeToSortableNumber(b.time)),
      );
    }
    return map;
  }, [appointments]);

  useEffect(() => {
    const storedChildrenRaw = localStorage.getItem('fosterhub.caseChildren');
    setStoredChildrenByCase(storedChildrenRaw ? JSON.parse(storedChildrenRaw) : {});
  }, []);

  useEffect(() => {
    const customEvents = appointments.filter(item => !initialAppointments.some(seed => seed.id === item.id));
    localStorage.setItem('fosterhub.calendarEvents', JSON.stringify(customEvents));
  }, [appointments]);

  const childOptions = useMemo(() => storedChildrenByCase[selectedCase] || childrenByCase[selectedCase] || [], [selectedCase, storedChildrenByCase]);
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
    if (eventModalMode === 'create') {
      setSelectedChildren([]);
      setSelectedUsers([]);
      setUserQuery('');
      setShowMoreInviteSuggestions(false);
      setLocationQuery('');
      setLocationChosen(false);
      setShowMoreLocationSuggestions(false);
    }
  }, [selectedCase, eventModalMode]);

  function changeMonth(direction: number) {
    setVisibleDate(current => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  }

  function toggleChild(child: string) {
    if (formDisabled) return;
    setSelectedChildren(current =>
      current.includes(child) ? current.filter(entry => entry !== child) : [...current, child],
    );
  }

  function addUser(user: string) {
    if (formDisabled) return;
    setSelectedUsers(current => (current.includes(user) ? current : [...current, user]));
    setUserQuery('');
  }

  function removeUser(user: string) {
    if (formDisabled) return;
    setSelectedUsers(current => current.filter(entry => entry !== user));
  }

  function resetEventForm() {
    setSelectedCase(caseOptions[0]);
    setSelectedChildren([]);
    setSelectedEventType(eventTypeOptions[0]);
    setEventTypeMenuOpen(false);
    setSelectedUsers([]);
    setUserQuery('');
    setShowMoreInviteSuggestions(false);
    setLocationQuery('');
    setLocationChosen(false);
    setShowMoreLocationSuggestions(false);
    setEventDate('2026-04-05');
    setStartTime('14:00');
    setEndTime('15:00');
    setNotes('');
    setActiveEventId(null);
    setEventActionsOpen(false);
  }

  function closeEventModal() {
    setEventModalOpen(false);
    setEventActionsOpen(false);
  }

  function deleteActiveEvent() {
    if (!activeEventId) return;

    const activeEvent = appointments.find(item => item.id === activeEventId);
    if (activeEvent) {
      removeActivityEventFromCaseStorage(activeEvent);
    }

    setAppointments(current => current.filter(item => item.id !== activeEventId));
    closeEventModal();
    resetEventForm();
  }

  function openExistingEvent(event: CalendarEvent) {
    setActiveEventId(event.id);
    setSelectedCase(event.caseLabel);
    setSelectedChildren(event.children);
    setSelectedEventType(event.eventType);
    setSelectedUsers(event.invitees);
    setUserQuery('');
    setShowMoreInviteSuggestions(false);
    setLocationQuery(event.location);
    setLocationChosen(true);
    setShowMoreLocationSuggestions(false);
    setEventDate(event.date);
    setStartTime(event.startTime);
    setEndTime(event.endTime);
    setNotes(event.notes);
    setEventModalMode('view');
    setEventActionsOpen(false);
    setEventModalOpen(true);
  }

  function handleSaveEvent() {
    const normalizedEvent = {
      caseLabel: selectedCase,
      children: selectedChildren,
      date: eventDate,
      startTime,
      endTime,
      time: formatTimeForCalendar(startTime),
      eventType: selectedEventType,
      notes,
      location: locationQuery,
      invitees: selectedUsers,
      color: eventTypeColors[selectedEventType] || '#10588c',
    };

    if (eventModalMode === 'edit' && activeEventId) {
      const updatedEvent = { id: activeEventId, ...normalizedEvent };
      syncActivityEventToCaseStorage(updatedEvent);
      setAppointments(current => current.map(item => (item.id === activeEventId ? updatedEvent : item)));
    } else {
      setAppointments(current => [...current, { id: `${Date.now()}`, ...normalizedEvent }]);
    }

    closeEventModal();
    resetEventForm();
  }

  return (
    <AppShell title="Calendar">
      <main className="page-stack">
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
              const appointmentsForDay = appointmentMap.get(isoDate) || [];
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
                    {appointmentsForDay.map(appointment => (
                      <button
                        key={appointment.id}
                        type="button"
                        onClick={() => openExistingEvent(appointment)}
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
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          textAlign: 'left',
                        }}
                        title={`${appointment.time} · ${appointment.caseLabel} · ${appointment.eventType}`}
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
                          {appointment.caseLabel}
                        </span>
                      </button>
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
            onClick={closeEventModal}
          >
            <div
              className="card"
              style={{ width: 'min(100%, 760px)', maxHeight: '88vh', overflow: 'auto', padding: 24, position: 'relative' }}
              onClick={event => event.stopPropagation()}
            >
              <div className="section-title" style={{ alignItems: 'flex-start' }}>
                <h2 style={{ marginBottom: 0 }}>{eventModalMode === 'create' ? 'New Event' : 'Event Details'}</h2>

                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className="button button-ghost"
                    aria-label="Event actions"
                    onClick={() => setEventActionsOpen(current => !current)}
                    style={{ minHeight: 42, minWidth: 42, padding: 0, fontSize: 20, lineHeight: 1 }}
                  >
                    ☰
                  </button>

                  {eventActionsOpen ? (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        zIndex: 30,
                        minWidth: 180,
                        background: 'white',
                        border: '1px solid #d9e5dd',
                        borderRadius: 18,
                        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
                        padding: 10,
                        display: 'grid',
                        gap: 6,
                      }}
                    >
                      {eventModalMode === 'view' ? (
                        <button
                          type="button"
                          className="button button-ghost"
                          style={{ justifyContent: 'flex-start' }}
                          onClick={() => {
                            setEventModalMode('edit');
                            setEventActionsOpen(false);
                          }}
                        >
                          Edit event
                        </button>
                      ) : null}

                      {eventModalMode === 'edit' ? (
                        <button
                          type="button"
                          className="button button-primary"
                          style={{ justifyContent: 'flex-start' }}
                          onClick={() => {
                            setEventActionsOpen(false);
                            handleSaveEvent();
                          }}
                        >
                          Save changes
                        </button>
                      ) : null}

                      {activeEventId ? (
                        <button
                          type="button"
                          className="button button-ghost"
                          style={{ justifyContent: 'flex-start', color: '#b42318' }}
                          onClick={() => {
                            setEventActionsOpen(false);
                            deleteActiveEvent();
                          }}
                        >
                          Delete event
                        </button>
                      ) : null}

                      <button
                        type="button"
                        className="button button-ghost"
                        style={{ justifyContent: 'flex-start' }}
                        onClick={() => {
                          setEventActionsOpen(false);
                          closeEventModal();
                        }}
                      >
                        Close window
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="case-select">Case</label>
                  <select id="case-select" className="select" value={selectedCase} onChange={e => setSelectedCase(e.target.value)} disabled={formDisabled}>
                    {caseOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Child / children</label>
                  <div
                    style={{
                      border: '1px solid #cbd8d0',
                      borderRadius: 16,
                      background: 'white',
                      padding: 12,
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      minHeight: 62,
                    }}
                  >
                    {selectedChildren.length ? (
                      selectedChildren.map(child => (
                        <button
                          key={child}
                          type="button"
                          className="button button-ghost"
                          style={{ minHeight: 34, padding: '8px 12px' }}
                          onClick={() => toggleChild(child)}
                          disabled={formDisabled}
                        >
                          {child} ×
                        </button>
                      ))
                    ) : (
                      <span style={{ color: '#567060', alignSelf: 'center' }}>Select child or children</span>
                    )}
                  </div>

                  <div className="card card-muted" style={{ padding: 14 }}>
                    <div className="eyebrow" style={{ marginBottom: 10 }}>Children on {selectedCase}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {childOptions.map(child => (
                        <button
                          key={child}
                          type="button"
                          className="button button-ghost"
                          style={{ minHeight: 36, opacity: selectedChildren.includes(child) ? 0.6 : 1 }}
                          onClick={() => toggleChild(child)}
                          disabled={formDisabled}
                        >
                          {child}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="field" style={{ position: 'relative' }}>
                  <label htmlFor="event-type-trigger">Event type</label>
                  {formDisabled ? (
                    <div className="input" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        aria-hidden="true"
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          background: eventTypeColors[selectedEventType] || '#10588c',
                          flexShrink: 0,
                        }}
                      />
                      <span>{selectedEventType}</span>
                    </div>
                  ) : (
                    <>
                      <button
                        id="event-type-trigger"
                        type="button"
                        className="input"
                        onClick={() => setEventTypeMenuOpen(current => !current)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <span
                            aria-hidden="true"
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 999,
                              background: eventTypeColors[selectedEventType] || '#10588c',
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {selectedEventType}
                          </span>
                        </span>
                        <span aria-hidden="true">▾</span>
                      </button>

                      {eventTypeMenuOpen ? (
                        <div
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            left: 0,
                            right: 0,
                            zIndex: 20,
                            background: 'white',
                            border: '1px solid #d9e5dd',
                            borderRadius: 18,
                            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
                            padding: 10,
                            display: 'grid',
                            gap: 6,
                          }}
                        >
                          {eventTypeOptions.map(option => (
                            <button
                              key={option}
                              type="button"
                              className="button button-ghost"
                              style={{ justifyContent: 'flex-start' }}
                              onClick={() => {
                                setSelectedEventType(option);
                                setEventTypeMenuOpen(false);
                              }}
                            >
                              <span
                                aria-hidden="true"
                                style={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: 999,
                                  background: eventTypeColors[option] || '#10588c',
                                  flexShrink: 0,
                                }}
                              />
                              <span>{option}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </>
                  )}
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
                        disabled={formDisabled}
                      >
                        {user} ×
                      </button>
                    ))}
                    <input
                      id="invite-search"
                      value={userQuery}
                      onChange={e => setUserQuery(e.target.value)}
                      placeholder={selectedUsers.length ? 'Add another user' : 'Search for users to invite'}
                      disabled={formDisabled}
                      style={{
                        flex: '1 1 180px',
                        minWidth: 180,
                        border: 'none',
                        outline: 'none',
                        fontSize: 16,
                        color: '#123122',
                        background: 'transparent',
                      }}
                    />
                  </div>

                  {!formDisabled ? (
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
                  ) : null}
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
                    disabled={formDisabled}
                  />
                  {!locationChosen && !formDisabled ? (
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
                    <input id="event-date" className="input" type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} disabled={formDisabled} />
                  </div>
                  <div className="field">
                    <label htmlFor="event-start-time">Start time</label>
                    <input id="event-start-time" className="input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} disabled={formDisabled} />
                  </div>
                  <div className="field">
                    <label htmlFor="event-end-time">End time</label>
                    <input id="event-end-time" className="input" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} disabled={formDisabled} />
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
                    disabled={formDisabled}
                  />
                </div>
              </div>

            </div>
          </div>
        ) : null}
      </main>
    </AppShell>
  );
}
