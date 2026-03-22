const portals = {
  worker: {
    label: 'Caseworker Portal',
    screens: {
      dashboard: { title: 'Dashboard', render: renderWorkerDashboard },
      cases: { title: 'My Cases', render: renderWorkerCases },
      caseDetail: { title: 'Case Detail', render: renderWorkerCaseDetail },
      requests: { title: 'Requests', render: renderWorkerRequests },
      placement: { title: 'Placement Search', render: renderPlacementSearch }
    }
  },
  admin: {
    label: 'DHR Admin Portal',
    screens: {
      dashboard: { title: 'Admin Dashboard', render: renderAdminDashboard },
      intake: { title: 'Intake Queue', render: renderIntakeQueue },
      vendors: { title: 'Vendor Review Queue', render: renderVendorQueue },
      permissions: { title: 'Users & Permissions', render: renderPermissions }
    }
  },
  parent: {
    label: 'Resource Parent Portal',
    screens: {
      dashboard: { title: 'Dashboard', render: renderParentDashboard },
      child: { title: 'Child Detail', render: renderParentChildDetail },
      requests: { title: 'My Requests', render: renderParentRequests },
      vendors: { title: 'Approved Vendors', render: renderParentVendors }
    }
  },
  vendor: {
    label: 'Vendor Portal',
    screens: {
      dashboard: { title: 'Dashboard', render: renderVendorDashboard },
      onboarding: { title: 'Onboarding', render: renderVendorOnboarding },
      documents: { title: 'Documents', render: renderVendorDocuments }
    }
  }
};

let state = {
  portal: 'worker',
  screen: 'dashboard'
};

const nav = document.getElementById('nav');
const screen = document.getElementById('screen');
const portalSelect = document.getElementById('portalSelect');
const portalLabel = document.getElementById('portalLabel');
const screenTitle = document.getElementById('screenTitle');

portalSelect.addEventListener('change', (e) => {
  state.portal = e.target.value;
  state.screen = Object.keys(portals[state.portal].screens)[0];
  render();
});

function setScreen(name) {
  state.screen = name;
  render();
}

function render() {
  const portal = portals[state.portal];
  const current = portal.screens[state.screen];
  portalSelect.value = state.portal;
  portalLabel.textContent = portal.label;
  screenTitle.textContent = current.title;

  nav.innerHTML = Object.entries(portal.screens)
    .map(([key, config]) => `
      <button class="${key === state.screen ? 'active' : ''}" onclick="setScreen('${key}')">${config.title}</button>
    `)
    .join('');

  screen.innerHTML = current.render();
}

window.setScreen = setScreen;

function cards(items) {
  return `<div class="cards-grid">${items.map(item => `
    <div class="card">
      <div class="muted">${item.label}</div>
      <div class="metric">${item.value}</div>
      <div class="muted">${item.note || ''}</div>
    </div>
  `).join('')}</div>`;
}

function renderWorkerDashboard() {
  return `
    ${cards([
      { label: 'Assigned Cases', value: '24', note: '3 need action today' },
      { label: 'Unread Messages', value: '11', note: '2 marked urgent' },
      { label: 'Open Requests', value: '8', note: '4 pending review' },
      { label: 'Appointments This Week', value: '17', note: '5 home visits' }
    ])}

    <div class="two-col">
      <div class="table-card">
        <div class="toolbar">
          <h3>This Week</h3>
          <div class="group">
            <button class="secondary-btn">Create Appointment</button>
            <button class="primary-btn" onclick="setScreen('cases')">Open Cases</button>
          </div>
        </div>
        <div class="list">
          <div class="list-item"><strong>Mon · 9:00 AM · Home Visit</strong>Case #FH-1042 — Jordan M. · Resource Home: Hill Family</div>
          <div class="list-item"><strong>Tue · 1:30 PM · Bio Parent Call</strong>Case #FH-1051 — Alina R. · Confirm supervision plan</div>
          <div class="list-item"><strong>Wed · 10:15 AM · School Meeting</strong>Case #FH-1038 — Marcus T. · Worker + foster parent</div>
        </div>
      </div>

      <div class="detail-card">
        <h3>Urgent Queue</h3>
        <div class="list">
          <div class="list-item"><strong>Service Request Pending</strong><span class="badge warning">Needs review</span><div class="muted">Camp approval request for Alina R.</div></div>
          <div class="list-item"><strong>Placement Response Received</strong><span class="badge success">Interested</span><div class="muted">Thompson Home responded for intake FH-2201.</div></div>
          <div class="list-item"><strong>Unread Parent Message</strong><span class="badge info">2 new</span><div class="muted">Medication refill question from Hill Family.</div></div>
        </div>
      </div>
    </div>
  `;
}

function renderWorkerCases() {
  return `
    <div class="table-card">
      <div class="toolbar">
        <div class="group">
          <button class="ghost-btn">Open</button>
          <button class="ghost-btn">Urgent</button>
          <button class="ghost-btn">Appointment Today</button>
        </div>
        <button class="primary-btn" onclick="setScreen('caseDetail')">Open Sample Case</button>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr><th>Child</th><th>Case #</th><th>Placement</th><th>Status</th><th>Next Appointment</th><th>Open Items</th></tr>
          </thead>
          <tbody>
            <tr><td>Jordan M.</td><td>FH-1042</td><td>Hill Family</td><td><span class="badge success">Stable</span></td><td>Mon 9:00 AM</td><td>Medication update</td></tr>
            <tr><td>Alina R.</td><td>FH-1051</td><td>Thompson Home</td><td><span class="badge warning">Needs review</span></td><td>Tue 1:30 PM</td><td>Camp request</td></tr>
            <tr><td>Marcus T.</td><td>FH-1038</td><td>Evans Home</td><td><span class="badge info">Open</span></td><td>Wed 10:15 AM</td><td>School follow-up</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderWorkerCaseDetail() {
  return `
    <div class="detail-card">
      <div class="toolbar">
        <div>
          <h3>Jordan M. · Case FH-1042</h3>
          <div class="muted">Assigned Worker: Mike Demo · Placement: Hill Family</div>
        </div>
        <div class="group">
          <button class="secondary-btn">Message Parent</button>
          <button class="ghost-btn">Upload Document</button>
          <button class="primary-btn">Add Note</button>
        </div>
      </div>

      <div class="fake-tabs">
        <div class="fake-tab active">Overview</div>
        <div class="fake-tab">Documents</div>
        <div class="fake-tab">Medical</div>
        <div class="fake-tab">Legal</div>
        <div class="fake-tab">Requests</div>
        <div class="fake-tab">Timeline</div>
      </div>
    </div>

    <div class="two-col">
      <div class="detail-card">
        <h3>Case Overview</h3>
        <div class="kv-grid">
          <div class="kv"><label>Date of Birth</label><div>2014-08-12</div></div>
          <div class="kv"><label>County</label><div>Jefferson</div></div>
          <div class="kv"><label>Placement Status</label><div>Placed with Hill Family</div></div>
          <div class="kv"><label>Next Appointment</label><div>Home Visit · Mon 9:00 AM</div></div>
          <div class="kv"><label>Open Requests</label><div>1 active</div></div>
          <div class="kv"><label>Care Notes</label><div>Medication refill due this week</div></div>
        </div>
      </div>

      <div class="detail-card">
        <h3>Recent Timeline</h3>
        <div class="timeline">
          <div class="timeline-item"><strong>Parent message received</strong><div class="muted">Hill Family asked about refill timing · 2h ago</div></div>
          <div class="timeline-item"><strong>Request submitted</strong><div class="muted">Transportation reimbursement · Yesterday</div></div>
          <div class="timeline-item"><strong>Case note added</strong><div class="muted">School counselor update logged · 2 days ago</div></div>
        </div>
      </div>
    </div>
  `;
}

function renderWorkerRequests() {
  return `
    <div class="table-card">
      <div class="toolbar">
        <h3>Request Queue</h3>
        <div class="group">
          <button class="ghost-btn">Pending Review</button>
          <button class="ghost-btn">Needs More Info</button>
          <button class="ghost-btn">Completed</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr><th>Type</th><th>Child</th><th>Submitted By</th><th>Status</th><th>Priority</th><th>Action</th></tr>
          </thead>
          <tbody>
            <tr><td>Camp Approval</td><td>Alina R.</td><td>Thompson Home</td><td><span class="badge warning">Pending</span></td><td>High</td><td><button class="secondary-btn">Review</button></td></tr>
            <tr><td>Mileage Reimbursement</td><td>Jordan M.</td><td>Hill Family</td><td><span class="badge info">Needs Info</span></td><td>Medium</td><td><button class="ghost-btn">Open</button></td></tr>
            <tr><td>Clothing Request</td><td>Marcus T.</td><td>Evans Home</td><td><span class="badge success">Approved</span></td><td>Low</td><td><button class="ghost-btn">View</button></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderPlacementSearch() {
  return `
    <div class="detail-card">
      <div class="toolbar">
        <div>
          <h3>Placement Search · Intake FH-2201</h3>
          <div class="muted">Age 9 · Jefferson County · Sibling group no · Urgency high</div>
        </div>
        <button class="primary-btn">Send Placement Request</button>
      </div>
    </div>

    <div class="two-col">
      <div class="table-card">
        <h3>Eligible Homes</h3>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr><th>Home</th><th>County</th><th>Capacity</th><th>Fit</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr><td>Thompson Home</td><td>Jefferson</td><td>1 / 3</td><td>Age fit, open bed</td><td><span class="badge success">Available</span></td></tr>
              <tr><td>Garcia Home</td><td>Jefferson</td><td>2 / 4</td><td>Emergency certified</td><td><span class="badge info">Open</span></td></tr>
              <tr><td>Evans Home</td><td>Shelby</td><td>3 / 3</td><td>Geographic mismatch</td><td><span class="badge danger">Full</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="detail-card">
        <h3>Responses</h3>
        <div class="list">
          <div class="list-item"><strong>Thompson Home</strong><span class="badge success">Interested</span><div class="muted">Can accept within 24 hours</div></div>
          <div class="list-item"><strong>Garcia Home</strong><span class="badge info">Need more info</span><div class="muted">Asked about school district</div></div>
        </div>
      </div>
    </div>
  `;
}

function renderAdminDashboard() {
  return `
    ${cards([
      { label: 'Open Intakes', value: '12', note: '4 high urgency' },
      { label: 'Pending Vendor Reviews', value: '6', note: '2 overdue' },
      { label: 'Open Placement Searches', value: '5', note: '3 active today' },
      { label: 'Pending Request Decisions', value: '14', note: 'Across 3 teams' }
    ])}
    <div class="three-col">
      <div class="detail-card">
        <h3>Team Snapshot</h3>
        <div class="list">
          <div class="list-item"><strong>North Team</strong><div class="muted">46 active cases · 2 worker vacancies</div></div>
          <div class="list-item"><strong>Central Team</strong><div class="muted">53 active cases · 5 high urgency requests</div></div>
        </div>
      </div>
      <div class="detail-card">
        <h3>Urgent Alerts</h3>
        <div class="list-item"><strong>Vendor insurance expiring</strong><div class="muted">Camp Horizon in 5 days</div></div>
      </div>
      <div class="detail-card">
        <h3>Quick Actions</h3>
        <div class="list">
          <button class="primary-btn" onclick="setScreen('intake')">Open Intake Queue</button>
          <button class="secondary-btn" onclick="setScreen('vendors')">Review Vendors</button>
          <button class="ghost-btn" onclick="setScreen('permissions')">Manage Permissions</button>
        </div>
      </div>
    </div>
  `;
}

function renderIntakeQueue() {
  return `
    <div class="table-card">
      <div class="toolbar">
        <h3>Intake Queue</h3>
        <div class="group">
          <button class="ghost-btn">High Urgency</button>
          <button class="ghost-btn">Ready for Assignment</button>
          <button class="primary-btn">Create Intake</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr><th>Child</th><th>Intake #</th><th>Status</th><th>County</th><th>Assigned Worker</th><th>Urgency</th></tr>
          </thead>
          <tbody>
            <tr><td>TBD / New Intake</td><td>FH-2201</td><td><span class="badge warning">Ready for placement</span></td><td>Jefferson</td><td>Unassigned</td><td>High</td></tr>
            <tr><td>Kendra P.</td><td>FH-2200</td><td><span class="badge info">In review</span></td><td>Shelby</td><td>Lisa Warren</td><td>Medium</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderVendorQueue() {
  return `
    <div class="table-card">
      <div class="toolbar">
        <h3>Vendor Review Queue</h3>
        <div class="group">
          <button class="ghost-btn">Pending</button>
          <button class="ghost-btn">Needs Docs</button>
          <button class="primary-btn">Invite Vendor</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr><th>Vendor</th><th>Category</th><th>Status</th><th>Missing Items</th><th>Visibility</th><th>Action</th></tr>
          </thead>
          <tbody>
            <tr><td>Camp Horizon</td><td>Youth Activities</td><td><span class="badge warning">Under review</span></td><td>Insurance renewal</td><td>Private</td><td><button class="secondary-btn">Review</button></td></tr>
            <tr><td>Bright Path Therapy</td><td>Therapy</td><td><span class="badge success">Approved</span></td><td>—</td><td>Public</td><td><button class="ghost-btn">Open</button></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderPermissions() {
  return `
    <div class="two-col">
      <div class="table-card">
        <h3>Users</h3>
        <div class="list">
          <div class="list-item"><strong>Lisa Warren</strong><div class="muted">Worker · Central Team</div></div>
          <div class="list-item"><strong>Andre Fields</strong><div class="muted">Manager · North Team</div></div>
          <div class="list-item"><strong>J. Thompson</strong><div class="muted">Resource Parent</div></div>
        </div>
      </div>
      <div class="detail-card">
        <h3>Permission Template</h3>
        <div class="kv-grid">
          <div class="kv"><label>Role Template</label><div>Worker</div></div>
          <div class="kv"><label>Override Mode</label><div>HubSpot-style custom</div></div>
        </div>
        <div class="list" style="margin-top:16px;">
          <div class="list-item"><strong>Can view assigned cases</strong><span class="badge success">Enabled</span></div>
          <div class="list-item"><strong>Can approve requests</strong><span class="badge warning">Custom override</span></div>
          <div class="list-item"><strong>Can send broadcasts</strong><span class="badge danger">Disabled</span></div>
        </div>
      </div>
    </div>
  `;
}

function renderParentDashboard() {
  return `
    ${cards([
      { label: 'Children in My Home', value: '2', note: 'Jordan M. · Alina R.' },
      { label: 'Open Requests', value: '3', note: '1 needs more info' },
      { label: 'Unread Messages', value: '4', note: 'Worker replied this morning' },
      { label: 'Upcoming Appointments', value: '5', note: '2 this week' }
    ])}
    <div class="two-col">
      <div class="detail-card">
        <h3>Children</h3>
        <div class="list">
          <div class="list-item"><strong>Jordan M.</strong><div class="muted">Next appointment: Mon 9:00 AM · Medication refill pending</div></div>
          <div class="list-item"><strong>Alina R.</strong><div class="muted">Camp request pending review · Worker: Mike Demo</div></div>
        </div>
      </div>
      <div class="detail-card">
        <h3>Quick Actions</h3>
        <div class="list">
          <button class="primary-btn" onclick="setScreen('child')">Open Child Detail</button>
          <button class="secondary-btn" onclick="setScreen('requests')">View My Requests</button>
          <button class="ghost-btn" onclick="setScreen('vendors')">Browse Approved Vendors</button>
        </div>
      </div>
    </div>
  `;
}

function renderParentChildDetail() {
  return `
    <div class="detail-card">
      <div class="toolbar">
        <div>
          <h3>Jordan M.</h3>
          <div class="muted">Placed in your home · Worker: Mike Demo</div>
        </div>
        <div class="group">
          <button class="secondary-btn">Message Worker</button>
          <button class="primary-btn">New Request</button>
        </div>
      </div>
      <div class="fake-tabs">
        <div class="fake-tab active">Overview</div>
        <div class="fake-tab">Contacts</div>
        <div class="fake-tab">Medical</div>
        <div class="fake-tab">Documents</div>
        <div class="fake-tab">Appointments</div>
      </div>
    </div>
    <div class="two-col">
      <div class="detail-card">
        <h3>Approved Information</h3>
        <div class="kv-grid">
          <div class="kv"><label>Date of Birth</label><div>2014-08-12</div></div>
          <div class="kv"><label>Worker</label><div>Mike Demo</div></div>
          <div class="kv"><label>School</label><div>Jefferson Elementary</div></div>
          <div class="kv"><label>Next Appointment</label><div>Mon 9:00 AM Home Visit</div></div>
        </div>
      </div>
      <div class="detail-card">
        <h3>Important Contacts</h3>
        <div class="list">
          <div class="list-item"><strong>Assigned Worker</strong><div class="muted">Mike Demo · message in app</div></div>
          <div class="list-item"><strong>Crisis Hotline</strong><div class="muted">Available 24/7</div></div>
        </div>
      </div>
    </div>
  `;
}

function renderParentRequests() {
  return `
    <div class="table-card">
      <div class="toolbar">
        <h3>My Requests</h3>
        <button class="primary-btn">Create Request</button>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr><th>Type</th><th>Child</th><th>Status</th><th>Updated</th></tr>
          </thead>
          <tbody>
            <tr><td>Camp Approval</td><td>Alina R.</td><td><span class="badge warning">Pending review</span></td><td>Today</td></tr>
            <tr><td>Mileage Reimbursement</td><td>Jordan M.</td><td><span class="badge info">Needs more info</span></td><td>Yesterday</td></tr>
            <tr><td>Clothing Request</td><td>Jordan M.</td><td><span class="badge success">Approved</span></td><td>2 days ago</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderParentVendors() {
  return `
    <div class="table-card">
      <div class="toolbar">
        <h3>Approved Vendors</h3>
        <div class="group">
          <button class="ghost-btn">Activities</button>
          <button class="ghost-btn">Therapy</button>
          <button class="ghost-btn">Tutoring</button>
        </div>
      </div>
      <div class="list">
        <div class="list-item"><strong>Camp Horizon</strong><div class="muted">Youth Activities · Summer camp programs · Public approved vendor</div></div>
        <div class="list-item"><strong>Bright Path Therapy</strong><div class="muted">Therapy services · Jefferson County</div></div>
      </div>
    </div>
  `;
}

function renderVendorDashboard() {
  return `
    ${cards([
      { label: 'Application Status', value: 'Under Review', note: '1 missing item' },
      { label: 'Documents Submitted', value: '3 / 4', note: 'Insurance still needed' },
      { label: 'Open Invoices', value: '0', note: 'Phase 2 flow' },
      { label: 'Messages from DHR', value: '2', note: 'Latest: reviewer note added' }
    ])}
    <div class="two-col">
      <div class="detail-card">
        <h3>Onboarding Progress</h3>
        <div class="list">
          <div class="list-item"><strong>Business Information</strong><span class="badge success">Complete</span></div>
          <div class="list-item"><strong>W-9</strong><span class="badge success">Complete</span></div>
          <div class="list-item"><strong>Insurance</strong><span class="badge warning">Missing</span></div>
          <div class="list-item"><strong>Agreement</strong><span class="badge success">Signed</span></div>
        </div>
      </div>
      <div class="detail-card">
        <h3>Quick Actions</h3>
        <div class="list">
          <button class="primary-btn" onclick="setScreen('onboarding')">Continue Onboarding</button>
          <button class="secondary-btn" onclick="setScreen('documents')">Open Documents</button>
        </div>
      </div>
    </div>
  `;
}

function renderVendorOnboarding() {
  return `
    <div class="detail-card">
      <div class="toolbar">
        <h3>Vendor Onboarding Checklist</h3>
        <button class="primary-btn">Submit for Review</button>
      </div>
      <div class="list">
        <div class="list-item"><strong>Business Information</strong><div class="muted">Completed and verified</div></div>
        <div class="list-item"><strong>W-9</strong><div class="muted">Uploaded and pending final approval</div></div>
        <div class="list-item"><strong>Insurance Certificate</strong><div class="muted">Still required before approval</div></div>
        <div class="list-item"><strong>Vendor Agreement</strong><div class="muted">Signed electronically</div></div>
      </div>
    </div>
  `;
}

function renderVendorDocuments() {
  return `
    <div class="table-card">
      <h3>Vendor Documents</h3>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr><th>Document</th><th>Status</th><th>Reviewer Note</th></tr>
          </thead>
          <tbody>
            <tr><td>W-9</td><td><span class="badge success">Received</span></td><td>Looks good</td></tr>
            <tr><td>Insurance</td><td><span class="badge warning">Missing</span></td><td>Please upload current coverage certificate</td></tr>
            <tr><td>Agreement</td><td><span class="badge success">Signed</span></td><td>No action needed</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

render();
