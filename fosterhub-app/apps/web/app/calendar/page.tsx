'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '../../components/AppShell';

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const sampleAppointments = [
  { id: '1', child: 'Archer Hall', date: '2026-04-05', time: '2:00PM', note: 'Court review', color: '#50c4b7' },
  { id: '2', child: 'Ava Johnson', date: '2026-04-06', time: '9:00AM', note: 'Home visit', color: '#046307' },
  { id: '3', child: 'Ava Johnson', date: '2026-04-18', time: '1:30PM', note: 'School meeting', color: '#10588c' },
  { id: '4', child: 'Archer Hall', date: '2026-04-22', time: '11:00AM', note: 'Medical appointment', color: '#d96c3c' },
];

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

  function changeMonth(direction: number) {
    setVisibleDate(current => new Date(current.getFullYear(), current.getMonth() + direction, 1));
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

            <button type="button" className="button button-primary">New Event</button>
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
      </main>
    </AppShell>
  );
}
