'use client'

import { FormEvent, useMemo, useRef, useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { Countdown } from '@/components/countdown'

const PARTICIPATION_TYPES = ['Individual', 'Team / Group', 'Branch / Campus'] as const
const PERFORMANCE_CATEGORIES = ['Singing', 'Instrumental', 'Other']
const SONG_KINDS = [
  'Praise and Worship',
  'Hymn',
  'Gospel',
  'Contemporary',
  'Classical',
  'Traditional',
  'Instrumental Piece',
  'Other',
]
const INSTRUMENTAL_OPTIONS = [
  'DLCF instrumentalists will play for me/us',
  'I/we will sing with an instrumental track',
  'I/we will play the instruments ourselves',
  'Not sure yet',
]

const CONFIRMATION_TEXT =
  'I confirm that the information provided is correct and that I and my group will be available to participate in the DLCF Musical Competition on Saturday, October 3, 2026.'

type ParticipationType = string
type Values = Record<string, string | boolean>
type Errors = Record<string, string>
type Status = 'idle' | 'submitting' | 'success' | 'error'

interface Step {
  id: string
  title: string
  subtitle: string
}

function isGroupType(type: string): boolean {
  return type === 'Team / Group' || type === 'Branch / Campus'
}

function buildSteps(type: string): Step[] {
  const base: Step[] = [
    { id: 'participation', title: 'Participation Type', subtitle: 'How will you be participating?' },
  ]

  if (type === 'Individual') {
    return base.concat([
      { id: 'details', title: 'Your Details', subtitle: 'Contact and location details.' },
      { id: 'performance', title: 'Performance Details', subtitle: 'Tell us about your performance.' },
      { id: 'instrumental', title: 'Instrumental Support', subtitle: 'Who will provide the instrumental music for your performance?' },
      { id: 'additional', title: 'Additional Information', subtitle: 'Anything else the organizing team should know?' },
      { id: 'confirm', title: 'Confirmation', subtitle: 'Review and submit your application.' },
    ])
  }

  if (type === 'Team / Group') {
    return base.concat([
      { id: 'team-details', title: 'Team / Group Details', subtitle: 'Representative and team details.' },
      { id: 'team-members', title: 'Team Members', subtitle: 'How many people are on your team, and who will be performing?' },
      { id: 'performance', title: 'Performance Details', subtitle: 'Tell us about your performance.' },
      { id: 'instrumental', title: 'Instrumental Support', subtitle: 'Who will provide the instrumental music for your performance?' },
      { id: 'additional', title: 'Additional Information', subtitle: 'Anything else the organizing team should know?' },
      { id: 'confirm', title: 'Confirmation', subtitle: 'Review and submit your application.' },
    ])
  }

  return base.concat([
    { id: 'branch-details', title: 'Branch / Campus Details', subtitle: 'Representative and branch details.' },
    { id: 'branch-members', title: 'Performing Members', subtitle: 'How many people are on your branch or campus, and who will be performing?' },
    { id: 'performance', title: 'Performance Details', subtitle: 'Tell us about your performance.' },
    { id: 'instrumental', title: 'Instrumental Support', subtitle: 'Who will provide the instrumental music for your performance?' },
    { id: 'additional', title: 'Additional Information', subtitle: 'Anything else the organizing team should know?' },
    { id: 'confirm', title: 'Confirmation', subtitle: 'Review and submit your application.' },
  ])
}

function validateStep(id: string, values: Values): Errors {
  const errors: Errors = {}
  const text = (key: string) => String(values[key] ?? '').trim()
  const type = String(values.participationType ?? '')
  const group = isGroupType(type)

  switch (id) {
    case 'participation':
      if (!text('participationType')) errors.participationType = 'Please select how you will be participating.'
      break
    case 'details':
    case 'team-details':
    case 'branch-details':
      if (id === 'team-details' && !text('teamName')) errors.teamName = 'Team or group name is required.'
      if (id === 'branch-details') {
        if (!text('branchOrCampus')) errors.branchOrCampus = 'Please select whether this is a campus or a branch.'
        else if (!['Campus', 'Branch'].includes(text('branchOrCampus'))) errors.branchOrCampus = 'Please select whether this is a campus or a branch.'
      }
      if (!text('fullName')) errors.fullName = group ? "Representative's name is required." : 'Full name is required.'
      if (!text('whatsapp')) errors.whatsapp = 'WhatsApp number is required.'
      if (text('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text('email'))) errors.email = 'Please enter a valid email address.'
      if (!text('region')) errors.region = 'Region is required.'
      if (!text('branch')) errors.branch = 'Branch or campus is required.'
      break
    case 'team-members':
    case 'branch-members':
    {
      const count = Number(text('performerCount'))
      if (!text('performerCount')) errors.performerCount = 'Number of performers is required.'
      else if (!Number.isInteger(count) || count < 1) errors.performerCount = 'Enter a whole number of at least 1.'
      if (!text('memberNames')) errors.memberNames = 'Please list the members who will perform.'
      break
    }
    case 'performance':
      if (!text('performanceCategory')) errors.performanceCategory = 'Please select a performance category.'
      if (String(values.performanceCategory ?? '') === 'Other' && !text('performanceCategoryOther')) errors.performanceCategoryOther = 'Please specify the performance category.'
      if (!text('songKind')) errors.songKind = 'Please select the kind of song you will be ministering.'
      if (String(values.songKind ?? '') === 'Other' && !text('songKindOther')) errors.songKindOther = 'Please specify the kind of song.'
      break
    case 'instrumental':
      if (!text('instrumentalSupport')) errors.instrumentalSupport = 'Please choose one option.'
      break
    case 'confirm':
      if (values.confirm !== true) errors.confirm = 'Please confirm before submitting.'
      break
  }

  return errors
}

function RequiredMark() {
  return (
    <span className="mf-req" aria-hidden="true">
      *
    </span>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p className="mf-error" id={id} role="alert">
      {message}
    </p>
  )
}

interface FieldProps {
  value: string
  error?: string
  onChange: (value: string) => void
}

function FullNameField({ value, error, onChange, group }: FieldProps & { group: boolean }) {
  return (
    <div className="mf-field">
      <label className="mf-label" htmlFor="fullName">
        {group ? "Representative's Name" : 'Full Name'} <RequiredMark />
      </label>
      <input
        className="mf-input"
        id="fullName"
        name="fullName"
        type="text"
        autoComplete="name"
        value={value}
        required
        aria-required="true"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'fullName-error' : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldError id="fullName-error" message={error} />
    </div>
  )
}

function WhatsAppField({ value, error, onChange }: FieldProps) {
  return (
    <div className="mf-field">
      <label className="mf-label" htmlFor="whatsapp">
        WhatsApp Number <RequiredMark />
      </label>
      <p className="mf-hint" id="whatsapp-hint">
        Please provide an active WhatsApp number so the organizing team can reach you about your
        performance.
      </p>
      <input
        className="mf-input"
        id="whatsapp"
        name="whatsapp"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="e.g. +232 76 000 000"
        value={value}
        required
        aria-required="true"
        aria-invalid={error ? true : undefined}
        aria-describedby={['whatsapp-hint', error ? 'whatsapp-error' : ''].filter(Boolean).join(' ')}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldError id="whatsapp-error" message={error} />
    </div>
  )
}

function EmailField({ value, error, onChange }: FieldProps) {
  return (
    <div className="mf-field">
      <label className="mf-label" htmlFor="email">
        Email Address <span className="mf-optional">Optional</span>
      </label>
      <p className="mf-hint" id="email-hint">
        If you provide it, we will send you a confirmation of your application and updates.
      </p>
      <input
        className="mf-input"
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        value={value}
        aria-required="false"
        aria-invalid={error ? true : undefined}
        aria-describedby={['email-hint', error ? 'email-error' : ''].filter(Boolean).join(' ')}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldError id="email-error" message={error} />
    </div>
  )
}

function RegionBranchFields({ region, branch, regionError, branchError, onChangeRegion, onChangeBranch }: {
  region: string
  branch: string
  regionError?: string
  branchError?: string
  onChangeRegion: (value: string) => void
  onChangeBranch: (value: string) => void
}) {
  return (
    <div className="mf-grid">
      <div className="mf-field">
        <label className="mf-label" htmlFor="region">
          Region <RequiredMark />
        </label>
        <input
          className="mf-input"
          id="region"
          name="region"
          type="text"
          value={region}
          required
          aria-required="true"
          aria-invalid={regionError ? true : undefined}
          aria-describedby={regionError ? 'region-error' : undefined}
          onChange={(event) => onChangeRegion(event.target.value)}
        />
        <FieldError id="region-error" message={regionError} />
      </div>
      <div className="mf-field">
        <label className="mf-label" htmlFor="branch">
          Branch / Campus <RequiredMark />
        </label>
        <input
          className="mf-input"
          id="branch"
          name="branch"
          type="text"
          value={branch}
          required
          aria-required="true"
          aria-invalid={branchError ? true : undefined}
          aria-describedby={branchError ? 'branch-error' : undefined}
          onChange={(event) => onChangeBranch(event.target.value)}
        />
        <FieldError id="branch-error" message={branchError} />
      </div>
    </div>
  )
}

function TeamNameField({ value, error, onChange }: FieldProps) {
  return (
    <div className="mf-field">
      <label className="mf-label" htmlFor="teamName">
        Team / Group Name <RequiredMark />
      </label>
      <input
        className="mf-input"
        id="teamName"
        name="teamName"
        type="text"
        placeholder="Example: Kabala Voices"
        value={value}
        required
        aria-required="true"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'teamName-error' : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldError id="teamName-error" message={error} />
    </div>
  )
}

function TeamNumberField({ value, error, onChange }: FieldProps) {
  return (
    <div className="mf-field">
      <label className="mf-label" htmlFor="teamNumber">
        Team Number <span className="mf-optional">Optional</span>
      </label>
      <p className="mf-hint" id="teamNumber-hint">
        If your fellowship has more than one team, enter the team number.
      </p>
      <input
        className="mf-input"
        id="teamNumber"
        name="teamNumber"
        type="text"
        placeholder="e.g. Team 2"
        value={value}
        aria-required="false"
        aria-invalid={error ? true : undefined}
        aria-describedby="teamNumber-hint"
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldError id="teamNumber-error" message={error} />
    </div>
  )
}

function BranchTypeField({ value, branch, error, branchError, onChange, onChangeBranch }: FieldProps & {
  branch: string
  error?: string
  branchError?: string
  onChangeBranch: (value: string) => void
}) {
  return (
    <>
      <div className="mf-field">
        <label className="mf-label" htmlFor="branchOrCampus">
          Campus or Branch? <RequiredMark />
        </label>
        <select
          className="mf-select"
          id="branchOrCampus"
          name="branchOrCampus"
          value={value}
          required
          aria-required="true"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'branchOrCampus-error' : undefined}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Select…</option>
          <option value="Campus">Campus</option>
          <option value="Branch">Branch</option>
        </select>
        <FieldError id="branchOrCampus-error" message={error} />
      </div>

      <div className="mf-field">
        <label className="mf-label" htmlFor="branch">
          Campus / Branch Name <RequiredMark />
        </label>
        <input
          className="mf-input"
          id="branch"
          name="branch"
          type="text"
          placeholder="Example: Fourah Bay College"
          value={branch}
          required
          aria-required="true"
          aria-invalid={branchError ? true : undefined}
          aria-describedby={branchError ? 'branch-error' : undefined}
          onChange={(event) => onChangeBranch(event.target.value)}
        />
        <FieldError id="branch-error" message={branchError} />
      </div>
    </>
  )
}

function MembersFields({ countLabel, count, names, countError, namesError, onChangeCount, onChangeNames }: {
  countLabel: string
  count: string
  names: string
  countError?: string
  namesError?: string
  onChangeCount: (value: string) => void
  onChangeNames: (value: string) => void
}) {
  return (
    <>
      <div className="mf-field">
        <label className="mf-label" htmlFor="performerCount">
          {countLabel} <RequiredMark />
        </label>
        <p className="mf-hint" id="performerCount-hint">
          Enter the total number of people who will perform. There is no limit, and this should
          match the names listed below.
        </p>
        <input
          className="mf-input"
          id="performerCount"
          name="performerCount"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          placeholder="e.g. 8"
          value={count}
          required
          aria-required="true"
          aria-invalid={countError ? true : undefined}
          aria-describedby={['performerCount-hint', countError ? 'performerCount-error' : ''].filter(Boolean).join(' ')}
          onChange={(event) => onChangeCount(event.target.value)}
        />
        <FieldError id="performerCount-error" message={countError} />
      </div>

      <div className="mf-field">
        <label className="mf-label" htmlFor="memberNames">
          Names of All Performing Members <RequiredMark />
        </label>
        <p className="mf-hint" id="memberNames-hint">
          Please list only the members who will actually perform, one name per line.
        </p>
        <textarea
          className="mf-textarea"
          id="memberNames"
          name="memberNames"
          rows={5}
          value={names}
          required
          aria-required="true"
          aria-invalid={namesError ? true : undefined}
          aria-describedby={['memberNames-hint', namesError ? 'memberNames-error' : ''].filter(Boolean).join(' ')}
          onChange={(event) => onChangeNames(event.target.value)}
        />
        <FieldError id="memberNames-error" message={namesError} />
      </div>
    </>
  )
}

function ShareRow() {
  function share(kind: 'whatsapp' | 'facebook' | 'x') {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const text = 'Registering for the DLCF Musical Competition, Saturday October 3, 2026'
    const links = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    }
    window.open(links[kind], '_blank', 'noopener,noreferrer,width=640,height=520')
  }

  return (
    <div className="share-row">
      <span className="share-label">Share this registration</span>
      <div className="share-buttons">
        <button type="button" className="share-btn share-whatsapp" onClick={() => share('whatsapp')}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.26 8.26 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z" />
          </svg>
          WhatsApp
        </button>
        <button type="button" className="share-btn share-facebook" onClick={() => share('facebook')}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46H15.2c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
          </svg>
          Facebook
        </button>
        <button type="button" className="share-btn share-x" onClick={() => share('x')}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41z" />
          </svg>
          X
        </button>
      </div>
    </div>
  )
}

export default function MusicalCompetitionPage() {
  const [values, setValues] = useState<Values>({})
  const [currentStep, setCurrentStep] = useState('participation')
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<Status>('idle')
  const submittingRef = useRef(false)

  const participationType = String(values.participationType ?? '')
  const steps = useMemo(() => buildSteps(participationType), [participationType])
  const stepIndex = Math.max(0, steps.findIndex((step) => step.id === currentStep))
  const step = steps[stepIndex]
  const total = steps.length
  const isLast = stepIndex === total - 1
  const group = isGroupType(participationType)
  const showInstrumentalNote = String(values.instrumentalSupport ?? '').startsWith('DLCF instrumentalists')

  function update(key: keyof Values, value: string | boolean) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function goToStep(next: string) {
    setErrors({})
    setCurrentStep(next)
  }

  function handleChangeParticipation(value: string) {
    setValues((current) => {
      const next: Values = { ...current, participationType: value }
      if (value === 'Individual') {
        delete next.teamName
        delete next.teamNumber
        delete next.performerCount
        delete next.memberNames
        delete next.branchOrCampus
      } else if (value === 'Team / Group') {
        delete next.branchOrCampus
      } else {
        delete next.teamName
        delete next.teamNumber
      }
      return next
    })
    setErrors((current) => {
      const next = { ...current }
      delete next.participationType
      delete next.teamName
      delete next.performerCount
      delete next.memberNames
      delete next.teamNumber
      delete next.branchOrCampus
      return next
    })
    setCurrentStep('participation')
  }

  async function submit() {
    if (submittingRef.current) return
    submittingRef.current = true
    setStatus('submitting')

    const payload: Values = {
      participationType: String(values.participationType ?? ''),
      fullName: String(values.fullName ?? ''),
      whatsapp: String(values.whatsapp ?? ''),
      email: String(values.email ?? ''),
      region: String(values.region ?? ''),
      branch: String(values.branch ?? ''),
      performanceCategory: String(values.performanceCategory ?? ''),
      performanceCategoryOther: String(values.performanceCategoryOther ?? ''),
      songKind: String(values.songKind ?? ''),
      songKindOther: String(values.songKindOther ?? ''),
      instrumentalSupport: String(values.instrumentalSupport ?? ''),
      additionalInfo: String(values.additionalInfo ?? ''),
      confirm: true,
    }

    if (participationType === 'Team / Group') {
      Object.assign(payload, {
        teamName: String(values.teamName ?? ''),
        teamNumber: String(values.teamNumber ?? ''),
        performerCount: String(values.performerCount ?? ''),
        memberNames: String(values.memberNames ?? ''),
      })
    } else if (participationType === 'Branch / Campus') {
      Object.assign(payload, {
        branchOrCampus: String(values.branchOrCampus ?? ''),
        performerCount: String(values.performerCount ?? ''),
        memberNames: String(values.memberNames ?? ''),
      })
    }

    try {
      const response = await fetch('/api/musical-competition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.ok) throw new Error('submit failed')

      setStatus('success')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setStatus('error')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      submittingRef.current = false
    }
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'submitting') return

    const found = validateStep(currentStep, values)
    if (Object.keys(found).length > 0) {
      setErrors(found)
      const target = event.currentTarget.elements.namedItem(Object.keys(found)[0])
      if (target instanceof HTMLElement) target.focus()
      return
    }

    if (isLast) {
      submit()
    } else {
      goToStep(steps[stepIndex + 1].id)
    }
  }

  function resetForm() {
    setValues({})
    setErrors({})
    setStatus('idle')
    setCurrentStep('participation')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function renderStep() {
    switch (step.id) {
      case 'participation':
        return (
          <div className="mf-options" role="radiogroup" aria-label="Participation type" aria-required="true" aria-describedby={errors.participationType ? 'participationType-error' : undefined}>
            {PARTICIPATION_TYPES.map((option) => (
              <label key={option} className={`mf-option ${participationType === option ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="participationType"
                  value={option}
                  checked={participationType === option}
                  onChange={() => handleChangeParticipation(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )

      case 'details':
      case 'team-details':
      case 'branch-details':
        return (
          <>
            {step.id === 'team-details' && (
              <TeamNameField
                value={String(values.teamName ?? '')}
                error={errors.teamName}
                onChange={(value) => update('teamName', value)}
              />
            )}
            {step.id === 'branch-details' && (
              <BranchTypeField
                value={String(values.branchOrCampus ?? '')}
                branch={String(values.branch ?? '')}
                error={errors.branchOrCampus}
                branchError={errors.branch}
                onChange={(value) => update('branchOrCampus', value)}
                onChangeBranch={(value) => update('branch', value)}
              />
            )}
            <FullNameField
              group={group}
              value={String(values.fullName ?? '')}
              error={errors.fullName}
              onChange={(value) => update('fullName', value)}
            />
            <WhatsAppField
              value={String(values.whatsapp ?? '')}
              error={errors.whatsapp}
              onChange={(value) => update('whatsapp', value)}
            />
            <EmailField
              value={String(values.email ?? '')}
              error={errors.email}
              onChange={(value) => update('email', value)}
            />
            {step.id === 'branch-details' ? (
              <div className="mf-field">
                <label className="mf-label" htmlFor="region">
                  Region <RequiredMark />
                </label>
                <input
                  className="mf-input"
                  id="region"
                  name="region"
                  type="text"
                  value={String(values.region ?? '')}
                  required
                  aria-required="true"
                  aria-invalid={errors.region ? true : undefined}
                  aria-describedby={errors.region ? 'region-error' : undefined}
                  onChange={(event) => update('region', event.target.value)}
                />
                <FieldError id="region-error" message={errors.region} />
              </div>
            ) : (
              <RegionBranchFields
                region={String(values.region ?? '')}
                branch={String(values.branch ?? '')}
                regionError={errors.region}
                branchError={errors.branch}
                onChangeRegion={(value) => update('region', value)}
                onChangeBranch={(value) => update('branch', value)}
              />
            )}
          </>
        )

      case 'team-members':
        return (
          <>
            <TeamNumberField
              value={String(values.teamNumber ?? '')}
              error={errors.teamNumber}
              onChange={(value) => update('teamNumber', value)}
            />
            <MembersFields
              countLabel="Number of People on Your Team"
              count={String(values.performerCount ?? '')}
              names={String(values.memberNames ?? '')}
              countError={errors.performerCount}
              namesError={errors.memberNames}
              onChangeCount={(value) => update('performerCount', value)}
              onChangeNames={(value) => update('memberNames', value)}
            />
          </>
        )

      case 'branch-members':
        return (
          <MembersFields
            countLabel="Number of People on Your Branch / Campus"
            count={String(values.performerCount ?? '')}
            names={String(values.memberNames ?? '')}
            countError={errors.performerCount}
            namesError={errors.memberNames}
            onChangeCount={(value) => update('performerCount', value)}
            onChangeNames={(value) => update('memberNames', value)}
          />
        )

      case 'performance':
        return (
          <>
            <div className="mf-field">
              <label className="mf-label" htmlFor="performanceCategory">
                Performance Category <RequiredMark />
              </label>
              <select
                className="mf-select"
                id="performanceCategory"
                name="performanceCategory"
                value={String(values.performanceCategory ?? '')}
                required
                aria-required="true"
                aria-invalid={errors.performanceCategory ? true : undefined}
                aria-describedby={errors.performanceCategory ? 'performanceCategory-error' : undefined}
                onChange={(event) => update('performanceCategory', event.target.value)}
              >
                <option value="">Select a category…</option>
                {PERFORMANCE_CATEGORIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <FieldError id="performanceCategory-error" message={errors.performanceCategory} />
            </div>

            {String(values.performanceCategory ?? '') === 'Other' && (
              <div className="mf-field">
                <label className="mf-label" htmlFor="performanceCategoryOther">
                  Please Specify the Performance Category <RequiredMark />
                </label>
                <input
                  className="mf-input"
                  id="performanceCategoryOther"
                  name="performanceCategoryOther"
                  type="text"
                  placeholder="e.g. Dance, drama, spoken word"
                  value={String(values.performanceCategoryOther ?? '')}
                  required
                  aria-required="true"
                  aria-invalid={errors.performanceCategoryOther ? true : undefined}
                  aria-describedby={errors.performanceCategoryOther ? 'performanceCategoryOther-error' : undefined}
                  onChange={(event) => update('performanceCategoryOther', event.target.value)}
                />
                <FieldError id="performanceCategoryOther-error" message={errors.performanceCategoryOther} />
              </div>
            )}

            <div className="mf-field">
              <label className="mf-label" htmlFor="songKind">
                What kind of song will {group ? 'your group' : 'you'} be ministering? <RequiredMark />
              </label>
              <p className="mf-hint" id="songKind-hint">
                Please choose the style or genre of the song. You will share the actual song with the
                organizing team later through WhatsApp.
              </p>
              <select
                className="mf-select"
                id="songKind"
                name="songKind"
                value={String(values.songKind ?? '')}
                required
                aria-required="true"
                aria-invalid={errors.songKind ? true : undefined}
                aria-describedby={['songKind-hint', errors.songKind ? 'songKind-error' : ''].filter(Boolean).join(' ')}
                onChange={(event) => update('songKind', event.target.value)}
              >
                <option value="">Select a style…</option>
                {SONG_KINDS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <FieldError id="songKind-error" message={errors.songKind} />
            </div>

            {String(values.songKind ?? '') === 'Other' && (
              <div className="mf-field">
                <label className="mf-label" htmlFor="songKindOther">
                  Please Specify the Kind of Song <RequiredMark />
                </label>
                <input
                  className="mf-input"
                  id="songKindOther"
                  name="songKindOther"
                  type="text"
                  placeholder="e.g. Reggae, Afrobeats"
                  value={String(values.songKindOther ?? '')}
                  required
                  aria-required="true"
                  aria-invalid={errors.songKindOther ? true : undefined}
                  aria-describedby={errors.songKindOther ? 'songKindOther-error' : undefined}
                  onChange={(event) => update('songKindOther', event.target.value)}
                />
                <FieldError id="songKindOther-error" message={errors.songKindOther} />
              </div>
            )}
          </>
        )

      case 'instrumental':
        return (
          <div>
            <div className="mf-options" role="radiogroup" aria-label="Instrumental support" aria-required="true" aria-describedby={errors.instrumentalSupport ? 'instrumentalSupport-error' : undefined}>
              {INSTRUMENTAL_OPTIONS.map((option) => (
                <label key={option} className={`mf-option ${values.instrumentalSupport === option ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="instrumentalSupport"
                    value={option}
                    checked={String(values.instrumentalSupport ?? '') === option}
                    onChange={() => update('instrumentalSupport', option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            <FieldError id="instrumentalSupport-error" message={errors.instrumentalSupport} />
            {showInstrumentalNote && (
              <p className="mf-note">
                The organizing team will contact you on WhatsApp to collect your song and coordinate the
                instrumental arrangement before the competition.
              </p>
            )}
          </div>
        )

      case 'additional':
        return (
          <div className="mf-field">
            <label className="mf-label" htmlFor="additionalInfo">
              Anything else the organizing team should know?
            </label>
            <p className="mf-hint" id="additionalInfo-hint">
              Optional. For example, special requirements, stage arrangements, or timing preferences.
            </p>
            <textarea
              className="mf-textarea"
              id="additionalInfo"
              name="additionalInfo"
              rows={5}
              value={String(values.additionalInfo ?? '')}
              aria-describedby="additionalInfo-hint"
              onChange={(event) => update('additionalInfo', event.target.value)}
            />
          </div>
        )

      case 'confirm':
        return (
          <>
            <ul className="mf-summary">
              <li><span>Participation Type</span><strong>{String(values.participationType ?? '')}</strong></li>
              <li><span>Name / Representative</span><strong>{String(values.fullName ?? '')}</strong></li>
              <li><span>WhatsApp Number</span><strong>{String(values.whatsapp ?? '')}</strong></li>
              <li><span>Email Address</span><strong>{String(values.email ?? '') || <em>Not provided</em>}</strong></li>
              <li><span>Region</span><strong>{String(values.region ?? '')}</strong></li>
              {participationType === 'Branch / Campus' && (
                <li><span>Campus or Branch</span><strong>{String(values.branchOrCampus ?? '')}</strong></li>
              )}
              <li><span>Branch / Campus</span><strong>{String(values.branch ?? '')}</strong></li>
              {participationType === 'Team / Group' && (
                <>
                  <li><span>Team / Group Name</span><strong>{String(values.teamName ?? '')}</strong></li>
                  {String(values.teamNumber ?? '') && (
                    <li><span>Team Number</span><strong>{String(values.teamNumber ?? '')}</strong></li>
                  )}
                </>
              )}
              {group && (
                <>
                  <li><span>Number of Performers</span><strong>{String(values.performerCount ?? '')}</strong></li>
                  <li><span>Performing Members</span><strong style={{ whiteSpace: 'pre-line' }}>{String(values.memberNames ?? '')}</strong></li>
                </>
              )}
              <li><span>Performance Category</span><strong>{String(values.performanceCategory ?? '')}</strong></li>
              {String(values.performanceCategoryOther ?? '') && (
                <li><span>Performance Category (specified)</span><strong>{String(values.performanceCategoryOther ?? '')}</strong></li>
              )}
              <li><span>Kind of Song</span><strong>{String(values.songKind ?? '') || <em>Not specified</em>}</strong></li>
              {String(values.songKindOther ?? '') && (
                <li><span>Kind of Song (specified)</span><strong>{String(values.songKindOther ?? '')}</strong></li>
              )}
              <li><span>Instrumental Support</span><strong>{String(values.instrumentalSupport ?? '')}</strong></li>
            </ul>
            <p className="mf-confirm-note">Please review the details above before submitting.</p>
            <label className="mf-check">
              <input
                type="checkbox"
                name="confirm"
                checked={values.confirm === true}
                required
                aria-required="true"
                aria-invalid={errors.confirm ? true : undefined}
                aria-describedby={errors.confirm ? 'confirm-error' : undefined}
                onChange={(event) => update('confirm', event.target.checked)}
              />
              <span>{CONFIRMATION_TEXT}</span>
            </label>
            <FieldError id="confirm-error" message={errors.confirm} />
          </>
        )

      default:
        return null
    }
  }

  return (
    <main className="inner-page">
      <SiteHeader />

      <section className="inner-hero mf-hero">
        <div className="mf-hero-grid">
          <div className="mf-hero-copy">
            <img className="mf-hero-logo" src="/choir/competition-logo.png" alt="DLCF Musical Competition logo" />
            <p className="eyebrow">DLCF National Campus Congress, October 1 to 4, 2026</p>
            <h1>DLCF Musical Competition</h1>
            <p>
              Saturday, October 3, 2026. Showcase the musical gifts God has given you. Individuals,
              teams, groups, and branches or campuses are welcome to participate.
              <br />
              Applications close on Monday, September 29, 2026 at 11:59 PM.
            </p>
          </div>
          <div className="mf-hero-media">
            <img
              className="mf-flyer"
              src="/choir/flyer-congress.jpeg"
              alt="Official flyer for the DLCF National Campus Congress"
            />
          </div>
        </div>
      </section>

      <section className="mf-countdown" aria-label="Application deadline countdown">
        <Countdown
          target="2026-09-29T23:59:00"
          label="Applications close in"
          sub="Monday, September 29, 2026 at 11:59 PM"
          doneLabel="Applications are now closed."
        />
      </section>

      {status === 'success' ? (
        <section className="mf-success" role="status">
          <div className="mf-success-card">
            <span className="mf-success-icon" aria-hidden="true">
              🎶
            </span>
            <h2>Application Received!</h2>
            <p>
              Thank you for registering for the DLCF Musical Competition.
              <br />
              Your application has been received by the organizing team. If you requested instrumental
              accompaniment, the organizing team will contact you on WhatsApp regarding your song and
              preparation.
            </p>
            <button className="mf-submit mf-submit-inline" type="button" onClick={resetForm}>
              Submit Another Application
            </button>
          </div>
        </section>
      ) : (
        <section className="mf-wrap">
          <div className="mf-form">
            <div className="mf-progress-head">
              <span className="mf-progress-label">Step {stepIndex + 1} of {total}</span>
              <span className="mf-progress-count">{step.title}</span>
            </div>
            <div
              className="mf-progress"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={total}
              aria-valuenow={stepIndex + 1}
              aria-label="Form progress"
            >
              <span style={{ width: `${((stepIndex + 1) / total) * 100}%` }} />
            </div>

            {status === 'error' && (
              <div className="mf-alert" role="alert">
                We could not submit your application right now. Please try again.
              </div>
            )}

            <form onSubmit={handleFormSubmit} noValidate>
              <div className="mf-card mf-step">
                <div className="mf-step-head">
                  <h2>{step.title} <RequiredMark /></h2>
                  <p className="mf-card-sub">{step.subtitle}</p>
                </div>
                {renderStep()}
                <div className="mf-nav">
                  {stepIndex > 0 && (
                    <button
                      type="button"
                      className="mf-btn-back"
                      onClick={() => goToStep(steps[stepIndex - 1].id)}
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="submit"
                    className="mf-submit mf-next"
                    disabled={status === 'submitting'}
                  >
                    {isLast ? (
                      status === 'submitting' ? 'Submitting…' : '🎶 Submit Registration'
                    ) : (
                      'Continue'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>
      )}

      <section className="mf-eventinfo" aria-label="Event details">
        <div className="mf-eventinfo-card">
          <h2>Event Details</h2>
          <p className="mf-eventinfo-sub">Everything you need to know about the competition.</p>
          <dl className="mf-eventinfo-grid">
            <div className="mf-eventinfo-item">
              <dt>Date</dt>
              <dd>Saturday, October 3, 2026</dd>
            </div>
            <div className="mf-eventinfo-item">
              <dt>Registration deadline</dt>
              <dd>Monday, September 29, 2026 at 11:59 PM</dd>
            </div>
            <div className="mf-eventinfo-item">
              <dt>Part of</dt>
              <dd>DLCF National Campus Congress, October 1 to 4, 2026</dd>
            </div>
            <div className="mf-eventinfo-item">
              <dt>Who can participate</dt>
              <dd>
                Individuals, teams, groups, and branches or campuses across the country
              </dd>
            </div>
            <div className="mf-eventinfo-item">
              <dt>Categories</dt>
              <dd>Singing, Instrumental, and Other performances</dd>
            </div>
            <div className="mf-eventinfo-item">
              <dt>Contact</dt>
              <dd>
                The organizing team will reach you on WhatsApp to coordinate your song and
                rehearsal.
              </dd>
            </div>
            <div className="mf-eventinfo-item">
              <dt>Music support</dt>
              <dd>
                DLCF instrumentalists are available for your performance. Request it in the form.
              </dd>
            </div>
          </dl>
          <div className="mf-eventinfo-countdown">
            <Countdown
              compact
              target="2026-10-03T00:00:00"
              label="Competition day in"
              sub="Saturday, October 3, 2026"
              doneLabel="Competition day is here!"
            />
          </div>
          <ShareRow />
        </div>
      </section>
    </main>
  )
}