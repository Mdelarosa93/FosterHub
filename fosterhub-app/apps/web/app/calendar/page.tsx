'use client';

import { useMemo } from 'react';
import { AppShell } from '../../components/AppShell';

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const sampleAppointments = [
  { id: '1', child: 'Archer Hall', date: '2026-04-05', time: '2:00PM', note: 'Court review' },
  { id: '2', child: 'Ava Johnson', date: '2026-04-06', time: '9:00AM', note: 'Home visit' },
  { id: '3', child: 'Ava Johnson', date: '2026-04-18', time: '1:30PM', note: 'School meeting' },
  { id: '4', child: 'Archer Hall', date: '2026-04-22', time: '11:00AM', note: 'Medical appointment' },
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

export default function CalendarPage() {
  const today = useMemo(() => new Date(), []);
  const monthDays = useMemo(() => buildCalendarDays(today), [today]);
  const monthLabel = useMemo(() => formatMonthHeading(today), [today]);
  const activeMonth = today.getMonth();

  const appointmentMap = useMemo(() => {
    const map = new Map<string, typeof sampleAppointments>();
    for (const appointment of sampleAppointments) {
      const current = map.get(appointment.date) || [];
      map.set(appointment.date, [...current, appointment]);
    }
    return map;
  }, []);

  return (
    <AppShell title="Calendar">
      <main className="page-stack">
        <section className="card">
          <div className="section-title">
            <div>
              <div className="eyebrow">Case scheduling</div>
              <h2 style={{ marginBottom: 8 }}>{monthLabel}</h2>
              <p style={{ marginBottom: 0 }}>
                Central scheduling for child appointments, case meetings, home visits, and future work calendar sync.
              </p>
            </div>
            <button type="button" className="button button-primary">Add calendar event</button>
          </div>
        </section>

        <section className="card">
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
              const isToday = day.toDateString() === today.toDateString();

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

                  <div style={{ display: 'grid', gap: 6 }}>
                    {appointments.map(appointment => (
                      <div
                        key={appointment.id}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 12,
                          background: 'rgba(80, 196, 183, 0.14)',
                          border: '1px solid rgba(16, 88, 140, 0.08)',
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#046307' }}>{appointment.time}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#123122', marginTop: 4 }}>{appointment.child}</div>
                        <div style={{ fontSize: 12, color: '#567060', marginTop: 2 }}>{appointment.note}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid">
          <article className="card">
            <div className="eyebrow">Upcoming appointments</div>
            <div className="record-list">
              {sampleAppointments.slice(0, 2).map(item => (
                <article key={item.id} className="record-item">
                  <strong>{item.child}</strong>
                  <div className="record-meta">
                    <span>{item.date}</span>
                    <span>{item.time}</span>
                    <span>{item.note}</span>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="card card-muted">
            <div className="eyebrow">Future direction</div>
            <h3 style={{ marginBottom: 10 }}>Calendar integration path</h3>
            <p style={{ marginBottom: 0 }}>
              This page is ready to evolve into case-based scheduling with work calendar sync, likely through Microsoft or Google connections later.
            </p>
          </article>
        </section>
      </main>
    </AppShell>
  );
}
