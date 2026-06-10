export type ContactLookupStatus = 'idle' | 'searching' | 'found' | 'no_contact' | 'failed'

export type ContactLikeProspect = Record<string, any> & {
  enrichments?: unknown
}

const UNKNOWN_CONTACT = /^unknown contact$/i

export function cleanContactText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function isPersonLinkedInUrl(value?: string) {
  return Boolean(value && /linkedin\.com\/in\//i.test(value))
}

export function isCompanyLinkedInUrl(value?: string) {
  return Boolean(value && /linkedin\.com\/company\//i.test(value))
}

function getEnrichmentRows(prospect: ContactLikeProspect) {
  return Array.isArray(prospect.enrichments) ? prospect.enrichments : []
}

function findEnrichmentValue(
  prospect: ContactLikeProspect,
  titlePattern: RegExp,
  valuePattern?: RegExp
) {
  for (const entry of getEnrichmentRows(prospect)) {
    const row = entry as Record<string, unknown>
    const title = cleanContactText(row.title)
    if (!title || !titlePattern.test(title)) continue

    const value = cleanContactText(row.result) || cleanContactText(row.value)
    if (!value) continue
    if (valuePattern) {
      const match = value.match(valuePattern)
      if (match?.[0]) return match[0]
    }
    return value
  }

  return undefined
}

function firstClean(values: unknown[]) {
  return values.map(cleanContactText).find(Boolean)
}

function cleanName(value: unknown) {
  const clean = cleanContactText(value)
  if (!clean || UNKNOWN_CONTACT.test(clean)) return undefined
  return clean
}

export function getProspectContactFields(prospect: ContactLikeProspect) {
  const directLinkedIn = cleanContactText(prospect.linkedinUrl)
  const directCompanyLinkedIn = cleanContactText(prospect.companyLinkedinUrl)
  const enrichmentCompanyLinkedIn = findEnrichmentValue(prospect, /company linkedin/i)

  const enrichmentPersonLinkedIn = findEnrichmentValue(
    prospect,
    /(decision maker|person|apollo|contact).*linkedin|linkedin profile/i,
    /https?:\/\/[^\s)"']*linkedin\.com\/in\/[^\s)"']+/i
  )

  const rawPersonLinkedIn = firstClean([
    prospect.personLinkedinUrl,
    prospect.contactLinkedinUrl,
    prospect.linkedin_url,
    enrichmentPersonLinkedIn
  ])

  const personLinkedIn = firstClean([
    isPersonLinkedInUrl(directLinkedIn) ? directLinkedIn : undefined,
    isPersonLinkedInUrl(rawPersonLinkedIn) ? rawPersonLinkedIn : undefined
  ])

  const companyLinkedIn = firstClean([
    directCompanyLinkedIn,
    isCompanyLinkedInUrl(directLinkedIn) ? directLinkedIn : undefined,
    isCompanyLinkedInUrl(enrichmentCompanyLinkedIn) ? enrichmentCompanyLinkedIn : undefined
  ])

  const email = firstClean([
    prospect.email,
    prospect.contactEmail,
    prospect.workEmail,
    prospect.work_email,
    findEnrichmentValue(
      prospect,
      /(decision maker|verified|work|apollo|hunter|contact).*email|email/i,
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
    )
  ])

  const phone = firstClean([
    prospect.phone,
    prospect.contactPhone,
    prospect.mobilePhone,
    prospect.mobile_phone,
    findEnrichmentValue(prospect, /(verified|apollo|contact|mobile).*phone|phone/i)
  ])

  const fullName = firstClean([
    cleanName(prospect.fullName),
    cleanName(prospect.contactName),
    cleanName(prospect.name),
    cleanName(findEnrichmentValue(prospect, /(decision maker|contact|person).*name/i))
  ])

  const jobTitle = firstClean([
    prospect.jobTitle,
    prospect.contactTitle,
    prospect.title,
    findEnrichmentValue(prospect, /(decision maker|contact|person).*title/i)
  ])

  const hasPerson = Boolean(fullName || jobTitle || personLinkedIn)
  const hasDirectContact = Boolean(email || phone)
  const hasAnyContact = Boolean(hasDirectContact || hasPerson)

  return {
    email,
    phone,
    fullName,
    jobTitle,
    personLinkedIn,
    companyLinkedIn,
    hasPerson,
    hasDirectContact,
    hasAnyContact
  }
}

export function getContactLookupStatus(
  prospect: ContactLikeProspect,
  isSearching = false
): ContactLookupStatus {
  if (isSearching) return 'searching'

  const explicit = cleanContactText(prospect.contactLookupStatus) as ContactLookupStatus | undefined
  if (explicit === 'searching' || explicit === 'found' || explicit === 'no_contact' || explicit === 'failed') {
    return explicit
  }

  if (cleanContactText(prospect.enrichmentError)) return 'failed'
  return getProspectContactFields(prospect).hasAnyContact ? 'found' : 'idle'
}

export function normalizeProspectContact(raw: ContactLikeProspect, fallbackStatus?: ContactLookupStatus) {
  const fields = getProspectContactFields(raw)
  const explicit = cleanContactText(raw.contactLookupStatus) as ContactLookupStatus | undefined
  const status =
    fallbackStatus ||
    (explicit === 'searching' || explicit === 'found' || explicit === 'no_contact' || explicit === 'failed'
      ? explicit
      : undefined) ||
    (fields.hasAnyContact ? 'found' : 'no_contact')

  return {
    ...raw,
    fullName: fields.fullName || cleanContactText(raw.fullName) || '',
    jobTitle: fields.jobTitle || cleanContactText(raw.jobTitle),
    email: fields.email || cleanContactText(raw.email),
    phone: fields.phone || cleanContactText(raw.phone),
    linkedinUrl: fields.personLinkedIn || fields.companyLinkedIn || cleanContactText(raw.linkedinUrl),
    companyLinkedinUrl: fields.companyLinkedIn || cleanContactText(raw.companyLinkedinUrl),
    contactLookupStatus: status,
    contactLookupCompletedAt:
      status === 'found' || status === 'no_contact' || status === 'failed'
        ? cleanContactText(raw.contactLookupCompletedAt) || new Date().toISOString()
        : raw.contactLookupCompletedAt,
    contactLookupMessage:
      cleanContactText(raw.contactLookupMessage) ||
      cleanContactText(raw.enrichmentError) ||
      (status === 'found'
        ? fields.email
          ? 'Email resolved'
          : 'Decision-maker resolved'
        : status === 'no_contact'
          ? 'No verified email or person match returned'
          : undefined)
  }
}
