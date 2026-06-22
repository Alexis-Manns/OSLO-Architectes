import React from 'react'
import { useNavigate } from 'react-router-dom'

const PHASES = ['APS','APD','PC','PRO','DCE','ACT','EXE','OPR','AOR']

export default function Topbar({ breadcrumb, phase, onPhaseChange }) {
  const navigate = useNavigate()

  return (
    <div className="topbar">
      <div className="breadcrumb">
        {breadcrumb.map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="bc-sep">›</span>}
            {item.path ? (
              <button className="bc-link" onClick={() => navigate(item.path)}>
                {item.label}
              </button>
            ) : (
              <span className="bc-active">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>
      {onPhaseChange && (
        <select
          className="phase-select"
          value={phase || 'EXE'}
          onChange={e => onPhaseChange(e.target.value)}
        >
          {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      )}
    </div>
  )
}
