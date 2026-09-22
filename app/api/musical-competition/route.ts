import nodemailer from 'nodemailer'

export const runtime = 'nodejs'

const PARTICIPATION_TYPES = ['Individual', 'Team / Group', 'Branch / Campus']
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

type Payload = Record<string, unknown>

function str(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function isGroupType(type: string): boolean {
  return type === 'Team / Group' || type === 'Branch / Campus'
}

function validate(data: Payload): string | null {
  const type = str(data.participationType)
  if (!PARTICIPATION_TYPES.includes(type)) return 'Invalid participation type.'
  if (!str(data.fullName)) return 'Name is required.'
  if (!str(data.whatsapp)) return 'WhatsApp number is required.'

  const email = str(data.email)
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email address is invalid.'

  if (!str(data.region)) return 'Region is required.'
  if (!str(data.branch)) return 'Branch / campus is required.'

  if (type === 'Team / Group') {
    if (!str(data.teamName)) return 'Team / group name is required.'
    const count = Number(str(data.performerCount))
    if (!Number.isInteger(count) || count < 1) return 'Number of performers must be at least 1.'
    if (!str(data.memberNames)) return 'Performing member names are required.'
  }

  if (type === 'Branch / Campus') {
    const branchOrCampus = str(data.branchOrCampus)
    if (!['Campus', 'Branch'].includes(branchOrCampus)) return 'Please select whether this is a campus or a branch.'
    const count = Number(str(data.performerCount))
    if (!Number.isInteger(count) || count < 1) return 'Number of performers must be at least 1.'
    if (!str(data.memberNames)) return 'Performing member names are required.'
  }

  if (!str(data.instrumentalSupport)) return 'Instrumental support answer is required.'
  if (!INSTRUMENTAL_OPTIONS.includes(str(data.instrumentalSupport))) return 'Invalid instrumental support answer.'

  const category = str(data.performanceCategory)
  if (category && !PERFORMANCE_CATEGORIES.includes(category)) return 'Invalid performance category.'
  if (category === 'Other' && !str(data.performanceCategoryOther)) return 'Please specify the performance category.'

  const songKind = str(data.songKind)
  if (!songKind) return 'Kind of song being ministered is required.'
  if (!SONG_KINDS.includes(songKind)) return 'Invalid song kind.'
  if (songKind === 'Other' && !str(data.songKindOther)) return 'Please specify the kind of song.'

  if (data.confirm !== true && data.confirm !== 'true' && data.confirm !== 'on') {
    return 'Confirmation is required.'
  }

  return null
}

function buildEmailBody(data: Payload): string {
  const type = str(data.participationType)
  const lines: string[] = [
    '🎶 DLCF MUSICAL COMPETITION',
    'Saturday, October 3, 2026',
    'National Campus Congress',
    '',
    `Participation Type: ${type}`,
    `Name / Representative: ${str(data.fullName) || 'N/A'}`,
    `WhatsApp Number: ${str(data.whatsapp) || 'N/A'}`,
    `Email Address: ${str(data.email) || 'N/A'}`,
    `Region: ${str(data.region) || 'N/A'}`,
    `Branch / Campus: ${str(data.branch) || 'N/A'}`,
  ]

  if (type === 'Team / Group') {
    lines.push(`Team / Group Name: ${str(data.teamName) || 'N/A'}`)
    lines.push(`Number of Performers: ${str(data.performerCount) || 'N/A'}`)
    const teamNumber = str(data.teamNumber)
    if (teamNumber) lines.push(`Team Number: ${teamNumber}`)
    lines.push(`Performing Members: ${str(data.memberNames) || 'N/A'}`)
  }

  if (type === 'Branch / Campus') {
    lines.push(`Type: ${str(data.branchOrCampus) || 'N/A'}`)
    lines.push(`Number of Performers: ${str(data.performerCount) || 'N/A'}`)
    lines.push(`Performing Members: ${str(data.memberNames) || 'N/A'}`)
  }

  lines.push(`Performance Category: ${str(data.performanceCategory) || 'N/A'}${str(data.performanceCategoryOther) ? ` (${str(data.performanceCategoryOther)})` : ''}`)
  lines.push(`Kind of Song Being Ministered: ${str(data.songKind) || 'N/A'}${str(data.songKindOther) ? ` (${str(data.songKindOther)})` : ''}`)
  lines.push(`Instrumental Support: ${str(data.instrumentalSupport) || 'N/A'}`)

  const additional = str(data.additionalInfo)
  if (additional) lines.push(`Additional Information: ${additional}`)

  lines.push('')
  lines.push(
    `Submitted: ${new Date().toLocaleString('en-GB', {
      timeZone: 'Africa/Freetown',
      dateStyle: 'medium',
      timeStyle: 'short',
    })}`,
  )

  return lines.join('\n')
}

function buildConfirmationBody(data: Payload): string {
  const lines = [
    '🎶 DLCF MUSICAL COMPETITION',
    '',
    `Thank you for registering${str(data.fullName) ? `, ${str(data.fullName).split(' ')[0]}` : ''}.`,
    '',
    'Your application has been received by the organizing team. The team may contact you on WhatsApp with updates about your performance.',
  ]

  if (str(data.instrumentalSupport).startsWith('DLCF instrumentalists')) {
    lines.push(
      '',
      'You requested DLCF instrumentalists for your performance. The organizing team will contact you on WhatsApp to collect your song and coordinate the instrumental arrangement before the competition.',
    )
  }

  lines.push(
    '',
    'Competition day: Saturday, October 3, 2026',
    'Part of the DLCF National Campus Congress, October 1 to 4, 2026.',
    '',
    'See you at the Congress!',
  )

  return lines.join('\n')
}

export async function POST(request: Request) {
  let data: Payload
  try {
    data = (await request.json()) as Payload
  } catch {
    return Response.json({ ok: false, error: 'Invalid request.' }, { status: 400 })
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return Response.json({ ok: false, error: 'Invalid request.' }, { status: 400 })
  }

  const validationError = validate(data)
  if (validationError) {
    return Response.json({ ok: false, error: validationError }, { status: 400 })
  }

  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const recipient = process.env.MUSICAL_COMPETITION_EMAIL

  if (!user || !pass || !recipient) {
    console.error(
      '[musical-competition] Missing SMTP environment variables. Set SMTP_USER, SMTP_PASS and MUSICAL_COMPETITION_EMAIL.',
    )
    return Response.json({ ok: false, error: 'Email is not configured.' }, { status: 500 })
  }

  const type = str(data.participationType)

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    })

    await transporter.sendMail({
      from: `"DLCF Musical Competition" <${user}>`,
      to: recipient,
      subject: `DLCF Musical Competition Registration: ${type}`,
      text: buildEmailBody(data),
    })

    const participantEmail = str(data.email)
    if (participantEmail) {
      try {
        await transporter.sendMail({
          from: `"DLCF Musical Competition" <${user}>`,
          to: participantEmail,
          subject: 'DLCF Musical Competition: Application Received',
          text: buildConfirmationBody(data),
        })
      } catch (error) {
        console.error('[musical-competition] Failed to send confirmation to participant:', error)
      }
    }

    return Response.json({ ok: true })
  } catch (error) {
    console.error('[musical-competition] Failed to send registration email:', error)
    return Response.json({ ok: false, error: 'Failed to send email.' }, { status: 500 })
  }
}
