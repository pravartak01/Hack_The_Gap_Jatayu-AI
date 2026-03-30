import React from 'react'

export default function Analytics() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Summary analytics for incidents, response times, and department performance.
      </p>
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
        Place charts and key metrics here so leadership can monitor trends.
      </div>
    </div>
  )
}
