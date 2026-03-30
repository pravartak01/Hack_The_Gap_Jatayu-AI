import React, { useMemo, useState } from 'react'
import { Building2, Users, UserPlus, Briefcase, Phone, Shield } from 'lucide-react'

const INITIAL_DEPARTMENTS = [
  {
    id: 'police',
    name: 'Police',
    code: 'POL',
    primaryContact: 'Control room',
  },
  {
    id: 'fire',
    name: 'Fire & Rescue',
    code: 'FIR',
    primaryContact: 'Fire station central desk',
  },
  {
    id: 'municipal',
    name: 'Municipal',
    code: 'MUN',
    primaryContact: 'Sanitation supervisor',
  },
  {
    id: 'traffic',
    name: 'Traffic',
    code: 'TRF',
    primaryContact: 'Traffic control room',
  },
  {
    id: 'admin',
    name: 'Admin',
    code: 'ADM',
    primaryContact: 'Command centre admin',
  },
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
    status: 'Active',
  },
]

export default function DepartmentPanel() {
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS)
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES)
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('all')

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
    return departments.reduce(
      (accumulator, department) => {
        const count = employees.filter((employee) => employee.departmentId === department.id).length
        accumulator.totalEmployees += count
        accumulator.byDepartment[department.id] = count
        return accumulator
      },
      { totalEmployees: 0, byDepartment: {} },
    )
  }, [departments, employees])

  const filteredEmployees = useMemo(() => {
    if (selectedDepartmentId === 'all') return employees
    return employees.filter((employee) => employee.departmentId === selectedDepartmentId)
  }, [employees, selectedDepartmentId])

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
        code: newDepartment.code.trim() || idBase.substring(0, 3).toUpperCase(),
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
        id: `emp-${previous.length + 1}`,
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
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Departments & staff</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Admin view for Jatayu AI. Add new departments and keep an up-to-date list of working staff for each
            section.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <Building2 className="h-3 w-3" />
            {departments.length} departments
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
            <Users className="h-3 w-3" />
            {totals.totalEmployees} employees
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            <Shield className="h-3 w-3" />
            Admin only
          </span>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr),minmax(0,1.2fr)]">
        {/* Departments list */}
        <section className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <h3 className="mb-2 text-xs font-semibold text-slate-900 dark:text-slate-50">Departments</h3>
            <div className="space-y-2">
              {departments.map((department) => (
                <article
                  key={department.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/50"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                      {department.code}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-50">{department.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{department.primaryContact}</p>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-500 dark:text-slate-400">
                    <p>Employees: {totals.byDepartment[department.id] ?? 0}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Add department form */}
        <section className="space-y-3">
          <form
            onSubmit={handleAddDepartment}
            className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-50">
              <Building2 className="h-3.5 w-3.5" />
              Add new department
            </h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">Name</label>
                <input
                  type="text"
                  name="name"
                  value={newDepartment.name}
                  onChange={handleDepartmentChange}
                  placeholder="e.g., Disaster Management"
                  className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">Code</label>
                  <input
                    type="text"
                    name="code"
                    value={newDepartment.code}
                    onChange={handleDepartmentChange}
                    placeholder="Short code (3–4 letters)"
                    className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    Primary contact
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      name="primaryContact"
                      value={newDepartment.primaryContact}
                      onChange={handleDepartmentChange}
                      placeholder="Name or desk (optional)"
                      className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-7 py-1.5 text-xs text-slate-900 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:ring-offset-slate-900"
              >
                <Building2 className="h-3.5 w-3.5" />
                Save department
              </button>
            </div>
          </form>

          <form
            onSubmit={handleAddEmployee}
            className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-50">
              <UserPlus className="h-3.5 w-3.5" />
              Add new employee
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={newEmployee.name}
                    onChange={handleEmployeeChange}
                    placeholder="Full name"
                    className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">Role</label>
                  <div className="relative">
                    <Briefcase className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      name="role"
                      value={newEmployee.role}
                      onChange={handleEmployeeChange}
                      placeholder="e.g., Control room operator"
                      className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-7 py-1.5 text-xs text-slate-900 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    Department
                  </label>
                  <select
                    name="departmentId"
                    value={newEmployee.departmentId}
                    onChange={handleEmployeeChange}
                    className="block w-full cursor-pointer rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                  >
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">Shift</label>
                  <select
                    name="shift"
                    value={newEmployee.shift}
                    onChange={handleEmployeeChange}
                    className="block w-full cursor-pointer rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                  >
                    <option value="Day">Day</option>
                    <option value="Morning">Morning</option>
                    <option value="Night">Night</option>
                    <option value="Rotational">Rotational</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    Status
                  </label>
                  <select
                    name="status"
                    value={newEmployee.status}
                    onChange={handleEmployeeChange}
                    className="block w-full cursor-pointer rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
                  >
                    <option value="Active">Active</option>
                    <option value="On leave">On leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:ring-offset-slate-900"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add employee
              </button>
            </div>
          </form>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-50">Employees by department</h3>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Filter:</span>
            <select
              value={selectedDepartmentId}
              onChange={(event) => setSelectedDepartmentId(event.target.value)}
              className="block cursor-pointer rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-900 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
            >
              <option value="all">All departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-slate-50 text-[11px] text-slate-500 dark:bg-slate-800/60 dark:text-slate-300">
              <tr>
                <th className="border-b border-slate-200 px-3 py-2 text-left font-medium dark:border-slate-800">Name</th>
                <th className="border-b border-slate-200 px-3 py-2 text-left font-medium dark:border-slate-800">Department</th>
                <th className="border-b border-slate-200 px-3 py-2 text-left font-medium dark:border-slate-800">Role</th>
                <th className="border-b border-slate-200 px-3 py-2 text-left font-medium dark:border-slate-800">Shift</th>
                <th className="border-b border-slate-200 px-3 py-2 text-left font-medium dark:border-slate-800">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee, index) => {
                const department = departments.find((departmentItem) => departmentItem.id === employee.departmentId)
                return (
                  <tr
                    key={employee.id}
                    className={index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-900/60'}
                  >
                    <td className="border-b border-slate-200 px-3 py-2 text-[11px] text-slate-700 dark:border-slate-800 dark:text-slate-100">
                      {employee.name}
                    </td>
                    <td className="border-b border-slate-200 px-3 py-2 text-[11px] text-slate-600 dark:border-slate-800 dark:text-slate-300">
                      {department?.name || '—'}
                    </td>
                    <td className="border-b border-slate-200 px-3 py-2 text-[11px] text-slate-600 dark:border-slate-800 dark:text-slate-300">
                      {employee.role}
                    </td>
                    <td className="border-b border-slate-200 px-3 py-2 text-[11px] text-slate-600 dark:border-slate-800 dark:text-slate-300">
                      {employee.shift}
                    </td>
                    <td className="border-b border-slate-200 px-3 py-2 text-[11px] text-slate-600 dark:border-slate-800 dark:text-slate-300">
                      {employee.status}
                    </td>
                  </tr>
                )
              })}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="border-t border-slate-200 px-3 py-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400"
                  >
                    No employees for this filter yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
