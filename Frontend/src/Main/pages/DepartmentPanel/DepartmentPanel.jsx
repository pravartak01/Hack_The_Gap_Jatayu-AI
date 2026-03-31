import React, { useMemo, useState } from 'react'
import { Building2, Users, UserPlus, Briefcase, Phone, Shield, Search, Clock3 } from 'lucide-react'

const INITIAL_DEPARTMENTS = [
  { id: 'police', name: 'Police', code: 'POL', primaryContact: 'Control room' },
  { id: 'fire', name: 'Fire & Rescue', code: 'FIR', primaryContact: 'Fire station central desk' },
  { id: 'municipal', name: 'Municipal', code: 'MUN', primaryContact: 'Sanitation supervisor' },
  { id: 'traffic', name: 'Traffic', code: 'TRF', primaryContact: 'Traffic control room' },
  { id: 'admin', name: 'Admin', code: 'ADM', primaryContact: 'Command centre admin' },
]

const INITIAL_EMPLOYEES = [
  {
    id: 'emp-01',
    name: 'Inspector Singh',
    departmentId: 'police',
    role: 'Control room in-charge',
    shift: 'Day',
    status: 'Active',
  },
  {
    id: 'emp-02',
    name: 'Officer Rao',
    departmentId: 'traffic',
    role: 'Field supervisor',
    shift: 'Morning',
    status: 'Active',
  },
  {
    id: 'emp-03',
    name: 'Ms. Desai',
    departmentId: 'municipal',
    role: 'Ward sanitation officer',
    shift: 'Rotational',
    status: 'On leave',
  },
]

function statusTone(status) {
  if (status === 'Active') return 'dp-status-active'
  if (status === 'On leave') return 'dp-status-leave'
  return 'dp-status-inactive'
}

function metricCard(icon, label, value, tone) {
  return {
    icon,
    label,
    value,
    tone,
  }
}

export default function DepartmentPanel() {
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS)
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES)

  const [selectedDepartmentId, setSelectedDepartmentId] = useState('all')
  const [employeeSearch, setEmployeeSearch] = useState('')

  const [newDepartment, setNewDepartment] = useState({
    name: '',
    code: '',
    primaryContact: '',
  })

  const [newEmployee, setNewEmployee] = useState({
    name: '',
    role: '',
    departmentId: 'police',
    shift: 'Day',
    status: 'Active',
  })

  const totals = useMemo(() => {
    const byDepartment = departments.reduce((acc, dept) => {
      acc[dept.id] = employees.filter((emp) => emp.departmentId === dept.id).length
      return acc
    }, {})

    const active = employees.filter((employee) => employee.status === 'Active').length
    const onLeave = employees.filter((employee) => employee.status === 'On leave').length

    return {
      totalEmployees: employees.length,
      active,
      onLeave,
      byDepartment,
    }
  }, [departments, employees])

  const filteredEmployees = useMemo(() => {
    const byDepartment =
      selectedDepartmentId === 'all'
        ? employees
        : employees.filter((employee) => employee.departmentId === selectedDepartmentId)

    const query = employeeSearch.trim().toLowerCase()
    if (!query) return byDepartment

    return byDepartment.filter((employee) => {
      const deptName = departments.find((department) => department.id === employee.departmentId)?.name || ''
      const blob = `${employee.name} ${employee.role} ${employee.shift} ${employee.status} ${deptName}`.toLowerCase()
      return blob.includes(query)
    })
  }, [departments, employeeSearch, employees, selectedDepartmentId])

  const dashboardCards = useMemo(
    () => [
      metricCard(<Building2 size={14} />, 'Departments', departments.length, 'dp-metric-indigo'),
      metricCard(<Users size={14} />, 'Total Employees', totals.totalEmployees, 'dp-metric-sky'),
      metricCard(<Shield size={14} />, 'Active', totals.active, 'dp-metric-emerald'),
      metricCard(<Clock3 size={14} />, 'On Leave', totals.onLeave, 'dp-metric-amber'),
    ],
    [departments.length, totals.active, totals.onLeave, totals.totalEmployees],
  )

  const handleDepartmentChange = (event) => {
    const { name, value } = event.target
    setNewDepartment((previous) => ({ ...previous, [name]: value }))
  }

  const handleEmployeeChange = (event) => {
    const { name, value } = event.target
    setNewEmployee((previous) => ({ ...previous, [name]: value }))
  }

  const handleAddDepartment = (event) => {
    event.preventDefault()
    const trimmedName = newDepartment.name.trim()
    if (!trimmedName) return

    const idBase = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'dept'
    const id = `${idBase}-${departments.length + 1}`

    setDepartments((previous) => [
      ...previous,
      {
        id,
        name: trimmedName,
        code: newDepartment.code.trim().toUpperCase() || idBase.substring(0, 3).toUpperCase(),
        primaryContact: newDepartment.primaryContact.trim() || 'Not set',
      },
    ])

    setNewDepartment({ name: '', code: '', primaryContact: '' })
  }

  const handleAddEmployee = (event) => {
    event.preventDefault()
    const trimmedName = newEmployee.name.trim()
    const trimmedRole = newEmployee.role.trim()
    if (!trimmedName || !trimmedRole) return

    setEmployees((previous) => [
      {
        id: `emp-${String(previous.length + 1).padStart(2, '0')}`,
        name: trimmedName,
        departmentId: newEmployee.departmentId,
        role: trimmedRole,
        shift: newEmployee.shift,
        status: newEmployee.status,
      },
      ...previous,
    ])

    setNewEmployee((previous) => ({ ...previous, name: '', role: '' }))
  }

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="dp-root">
        <header className="dp-head">
          <div>
            <p className="dp-eyebrow">Operations Directory</p>
            <h2 className="dp-title">Department Panel</h2>
            <p className="dp-subtitle">
              Maintain team structure, assign workforce, and keep real-time staffing visibility across all command units.
            </p>
          </div>
          <div className="dp-admin-chip">
            <Shield size={13} />
            Admin Controls Enabled
          </div>
        </header>

        <section className="dp-metrics">
          {dashboardCards.map((card) => (
            <article key={card.label} className={`dp-metric ${card.tone}`}>
              <span className="dp-metric-icon">{card.icon}</span>
              <div>
                <div className="dp-metric-value">{card.value}</div>
                <div className="dp-metric-label">{card.label}</div>
              </div>
            </article>
          ))}
        </section>

        <section className="dp-main-grid">
          <div className="dp-panel">
            <div className="dp-panel-head">
              <h3>Department Directory</h3>
              <span>{departments.length} listed</span>
            </div>

            <div className="dp-department-list">
              {departments.map((department) => (
                <article key={department.id} className="dp-department-item">
                  <div className="dp-department-left">
                    <span className="dp-code-badge">{department.code}</span>
                    <div>
                      <p className="dp-department-name">{department.name}</p>
                      <p className="dp-department-contact">
                        <Phone size={12} />
                        {department.primaryContact}
                      </p>
                    </div>
                  </div>
                  <div className="dp-department-right">{totals.byDepartment[department.id] ?? 0} staff</div>
                </article>
              ))}
            </div>
          </div>

          <div className="dp-form-column">
            <form onSubmit={handleAddDepartment} className="dp-panel dp-form-panel">
              <div className="dp-panel-head">
                <h3>Add Department</h3>
              </div>
              <div className="dp-form-grid">
                <label>
                  Name
                  <input
                    type="text"
                    name="name"
                    value={newDepartment.name}
                    onChange={handleDepartmentChange}
                    placeholder="Disaster Response"
                  />
                </label>

                <div className="dp-two-col">
                  <label>
                    Code
                    <input
                      type="text"
                      name="code"
                      value={newDepartment.code}
                      onChange={handleDepartmentChange}
                      placeholder="DRS"
                    />
                  </label>

                  <label>
                    Primary Contact
                    <input
                      type="text"
                      name="primaryContact"
                      value={newDepartment.primaryContact}
                      onChange={handleDepartmentChange}
                      placeholder="Desk / person"
                    />
                  </label>
                </div>

                <button type="submit" className="dp-primary-btn">
                  <Building2 size={14} />
                  Save Department
                </button>
              </div>
            </form>

            <form onSubmit={handleAddEmployee} className="dp-panel dp-form-panel">
              <div className="dp-panel-head">
                <h3>Add Employee</h3>
              </div>

              <div className="dp-form-grid">
                <div className="dp-two-col">
                  <label>
                    Name
                    <input
                      type="text"
                      name="name"
                      value={newEmployee.name}
                      onChange={handleEmployeeChange}
                      placeholder="Full name"
                    />
                  </label>

                  <label>
                    Role
                    <div className="dp-input-icon-wrap">
                      <Briefcase size={13} className="dp-input-icon" />
                      <input
                        type="text"
                        name="role"
                        value={newEmployee.role}
                        onChange={handleEmployeeChange}
                        placeholder="Role / responsibility"
                      />
                    </div>
                  </label>
                </div>

                <div className="dp-three-col">
                  <label>
                    Department
                    <select name="departmentId" value={newEmployee.departmentId} onChange={handleEmployeeChange}>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Shift
                    <select name="shift" value={newEmployee.shift} onChange={handleEmployeeChange}>
                      <option value="Day">Day</option>
                      <option value="Morning">Morning</option>
                      <option value="Night">Night</option>
                      <option value="Rotational">Rotational</option>
                    </select>
                  </label>

                  <label>
                    Status
                    <select name="status" value={newEmployee.status} onChange={handleEmployeeChange}>
                      <option value="Active">Active</option>
                      <option value="On leave">On leave</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </label>
                </div>

                <button type="submit" className="dp-primary-btn">
                  <UserPlus size={14} />
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="dp-panel">
          <div className="dp-panel-head dp-panel-head-wrap">
            <h3>Employees by Department</h3>

            <div className="dp-toolbar">
              <div className="dp-search-wrap">
                <Search size={13} />
                <input
                  type="text"
                  value={employeeSearch}
                  onChange={(event) => setEmployeeSearch(event.target.value)}
                  placeholder="Search name, role, shift..."
                />
              </div>

              <select value={selectedDepartmentId} onChange={(event) => setSelectedDepartmentId(event.target.value)}>
                <option value="all">All departments</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="dp-table-wrap">
            <table className="dp-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Shift</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => {
                  const department = departments.find((departmentItem) => departmentItem.id === employee.departmentId)
                  return (
                    <tr key={employee.id}>
                      <td>{employee.name}</td>
                      <td>{department?.name || '—'}</td>
                      <td>{employee.role}</td>
                      <td>{employee.shift}</td>
                      <td>
                        <span className={`dp-status ${statusTone(employee.status)}`}>{employee.status}</span>
                      </td>
                    </tr>
                  )
                })}

                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={5} className="dp-empty-row">
                      No employees for the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  )
}

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');

  [data-jatayu-theme="light"] .dp-root,
  .dp-root {
    --dp-bg: transparent;
    --dp-panel-bg: #ffffff;
    --dp-panel-border: rgba(226,232,240,0.9);
    --dp-panel-shadow: 0 1px 5px rgba(15,23,42,0.05), 0 8px 24px rgba(15,23,42,0.05);
    --dp-title: #0f172a;
    --dp-sub: #64748b;
    --dp-text: #334155;
    --dp-muted: #94a3b8;
    --dp-input-bg: #f8fafc;
    --dp-input-border: #dbe3ef;
    --dp-table-head: #f8fafc;
    --dp-table-row: #ffffff;
    --dp-table-row-alt: #f8fafc;
    --dp-table-border: #e2e8f0;
    --dp-primary: #4f46e5;
    --dp-primary-text: #ffffff;
    --dp-chip-bg: rgba(99,102,241,0.08);
    --dp-chip-text: #4338ca;
  }

  [data-jatayu-theme="dark"] .dp-root {
    --dp-bg: transparent;
    --dp-panel-bg: rgba(13,17,27,0.88);
    --dp-panel-border: rgba(255,255,255,0.08);
    --dp-panel-shadow: 0 2px 10px rgba(0,0,0,0.45);
    --dp-title: #f1f5f9;
    --dp-sub: #94a3b8;
    --dp-text: #cbd5e1;
    --dp-muted: #64748b;
    --dp-input-bg: rgba(255,255,255,0.04);
    --dp-input-border: rgba(255,255,255,0.1);
    --dp-table-head: rgba(255,255,255,0.03);
    --dp-table-row: transparent;
    --dp-table-row-alt: rgba(255,255,255,0.02);
    --dp-table-border: rgba(255,255,255,0.08);
    --dp-primary: #6366f1;
    --dp-primary-text: #ffffff;
    --dp-chip-bg: rgba(99,102,241,0.2);
    --dp-chip-text: #c7d2fe;
  }

  .dp-root {
    display: grid;
    gap: 14px;
    font-family: 'Outfit', system-ui, sans-serif;
    color: var(--dp-text);
    background: var(--dp-bg);
  }

  .dp-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    flex-wrap: wrap;
    border: 1px solid var(--dp-panel-border);
    background: var(--dp-panel-bg);
    box-shadow: var(--dp-panel-shadow);
    border-radius: 16px;
    padding: 14px;
  }

  .dp-eyebrow {
    margin: 0;
    font-size: 11px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: var(--dp-muted);
    font-weight: 700;
  }

  .dp-title {
    margin: 5px 0 0;
    font-size: 22px;
    color: var(--dp-title);
    font-weight: 800;
    line-height: 1.1;
  }

  .dp-subtitle {
    margin: 7px 0 0;
    max-width: 780px;
    color: var(--dp-sub);
    font-size: 13px;
    line-height: 1.55;
  }

  .dp-admin-chip {
    border: 1px solid rgba(16,185,129,0.24);
    background: rgba(16,185,129,0.12);
    color: #047857;
    border-radius: 999px;
    padding: 6px 11px;
    font-size: 12px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .dp-metrics {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .dp-metric {
    border: 1px solid var(--dp-panel-border);
    background: var(--dp-panel-bg);
    box-shadow: var(--dp-panel-shadow);
    border-radius: 13px;
    padding: 11px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .dp-metric-icon {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dp-metric-value {
    font-family: 'Space Mono', monospace;
    font-size: 19px;
    font-weight: 700;
    line-height: 1;
  }

  .dp-metric-label {
    margin-top: 4px;
    font-size: 11px;
    color: var(--dp-sub);
    font-weight: 600;
  }

  .dp-metric-indigo .dp-metric-icon { background: rgba(79,70,229,0.14); color: #4338ca; }
  .dp-metric-indigo .dp-metric-value { color: #4338ca; }
  .dp-metric-sky .dp-metric-icon { background: rgba(14,165,233,0.14); color: #0369a1; }
  .dp-metric-sky .dp-metric-value { color: #0369a1; }
  .dp-metric-emerald .dp-metric-icon { background: rgba(16,185,129,0.14); color: #047857; }
  .dp-metric-emerald .dp-metric-value { color: #047857; }
  .dp-metric-amber .dp-metric-icon { background: rgba(245,158,11,0.18); color: #b45309; }
  .dp-metric-amber .dp-metric-value { color: #b45309; }

  .dp-main-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
    gap: 12px;
  }

  .dp-panel {
    border: 1px solid var(--dp-panel-border);
    background: var(--dp-panel-bg);
    box-shadow: var(--dp-panel-shadow);
    border-radius: 14px;
    padding: 12px;
  }

  .dp-panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
  }

  .dp-panel-head h3 {
    margin: 0;
    font-size: 14px;
    color: var(--dp-title);
    font-weight: 700;
  }

  .dp-panel-head span {
    color: var(--dp-sub);
    font-size: 11px;
    font-weight: 700;
  }

  .dp-department-list {
    display: grid;
    gap: 8px;
    max-height: 450px;
    overflow: auto;
    padding-right: 2px;
  }

  .dp-department-item {
    border: 1px solid var(--dp-table-border);
    background: var(--dp-table-row-alt);
    border-radius: 12px;
    padding: 9px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .dp-department-left {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .dp-code-badge {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: var(--dp-chip-bg);
    color: var(--dp-chip-text);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.4px;
    flex-shrink: 0;
  }

  .dp-department-name {
    margin: 0;
    font-size: 13px;
    color: var(--dp-title);
    font-weight: 700;
  }

  .dp-department-contact {
    margin: 3px 0 0;
    font-size: 11px;
    color: var(--dp-sub);
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .dp-department-right {
    font-size: 11px;
    color: var(--dp-sub);
    font-weight: 700;
    white-space: nowrap;
  }

  .dp-form-column {
    display: grid;
    gap: 10px;
  }

  .dp-form-panel {
    padding-top: 10px;
  }

  .dp-form-grid {
    display: grid;
    gap: 10px;
  }

  .dp-two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .dp-three-col {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .dp-form-grid label {
    display: grid;
    gap: 5px;
    font-size: 11px;
    color: var(--dp-sub);
    font-weight: 700;
  }

  .dp-form-grid input,
  .dp-form-grid select,
  .dp-toolbar select,
  .dp-search-wrap input {
    border: 1px solid var(--dp-input-border);
    background: var(--dp-input-bg);
    color: var(--dp-title);
    border-radius: 10px;
    padding: 8px 10px;
    font-size: 12px;
    font-weight: 600;
    width: 100%;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .dp-form-grid input:focus,
  .dp-form-grid select:focus,
  .dp-toolbar select:focus,
  .dp-search-wrap input:focus {
    border-color: rgba(79,70,229,0.45);
    box-shadow: 0 0 0 3px rgba(79,70,229,0.12);
  }

  .dp-input-icon-wrap {
    position: relative;
  }

  .dp-input-icon {
    position: absolute;
    left: 9px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--dp-muted);
  }

  .dp-input-icon-wrap input {
    padding-left: 30px;
  }

  .dp-primary-btn {
    border: 1px solid var(--dp-primary);
    background: var(--dp-primary);
    color: var(--dp-primary-text);
    border-radius: 10px;
    padding: 9px 12px;
    font-size: 12px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    transition: filter 0.2s ease;
  }

  .dp-primary-btn:hover {
    filter: brightness(1.06);
  }

  .dp-panel-head-wrap {
    flex-wrap: wrap;
  }

  .dp-toolbar {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }

  .dp-search-wrap {
    position: relative;
    min-width: 240px;
    flex: 1;
  }

  .dp-search-wrap svg {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--dp-muted);
  }

  .dp-search-wrap input {
    padding-left: 31px;
  }

  .dp-table-wrap {
    overflow-x: auto;
  }

  .dp-table {
    width: 100%;
    min-width: 760px;
    border-collapse: collapse;
  }

  .dp-table thead th {
    background: var(--dp-table-head);
    color: var(--dp-sub);
    font-size: 11px;
    font-weight: 700;
    text-align: left;
    padding: 9px 10px;
    border-bottom: 1px solid var(--dp-table-border);
  }

  .dp-table tbody td {
    padding: 10px;
    font-size: 12px;
    color: var(--dp-text);
    border-bottom: 1px solid var(--dp-table-border);
  }

  .dp-table tbody tr:nth-child(odd) td {
    background: var(--dp-table-row);
  }

  .dp-table tbody tr:nth-child(even) td {
    background: var(--dp-table-row-alt);
  }

  .dp-status {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 4px 9px;
    font-size: 11px;
    font-weight: 700;
    border: 1px solid transparent;
  }

  .dp-status-active {
    color: #047857;
    background: rgba(16,185,129,0.14);
    border-color: rgba(16,185,129,0.28);
  }

  .dp-status-leave {
    color: #b45309;
    background: rgba(245,158,11,0.18);
    border-color: rgba(245,158,11,0.3);
  }

  .dp-status-inactive {
    color: #b91c1c;
    background: rgba(239,68,68,0.12);
    border-color: rgba(239,68,68,0.3);
  }

  .dp-empty-row {
    text-align: center;
    color: var(--dp-muted);
    font-style: italic;
  }

  @media (max-width: 1200px) {
    .dp-main-grid {
      grid-template-columns: 1fr;
    }

    .dp-form-column {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 860px) {
    .dp-metrics {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dp-two-col,
    .dp-three-col,
    .dp-form-column {
      grid-template-columns: 1fr;
    }

    .dp-search-wrap {
      min-width: 100%;
      width: 100%;
    }
  }
`;
