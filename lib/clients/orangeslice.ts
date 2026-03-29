import { generateObject } from 'ai'
import { configure, services } from 'orangeslice'
import { z } from 'zod'

import type { Prospect, ProspectSearchContext } from '@/components/prospect-grid'
import { logger } from '@/lib/utils/logger'
import { getToolCallModel } from '@/lib/utils/registry'

let orangesliceConfigured = false

type OrangesliceCompany = {
  name?: string | null
  website?: string | null
  description?: string | null
  employee_count?: number | null
  locality?: string | null
  region?: string | null
  country_name?: string | null
  linkedin_url?: string | null
  specialties?: string[] | string | null
  type?: string | null
  size?: string | null
}

type OrangeslicePerson = {
  name?: string | null
  title?: string | null
  company_name?: string | null
  locality?: string | null
  summary?: string | null
  headline?: string | null
  url?: string | null
}

type WebsiteContactCandidate = {
  name: string
  title?: string
  email?: string
  linkedinUrl?: string
}

const hermesTakeSchema = z.object({
  whyFit: z.string().min(1),
  outreachAngle: z.string().min(1),
  evidence: z.array(z.string().min(1))
})

function ensureOrangesliceConfigured() {
  if (orangesliceConfigured) return
  const apiKey = process.env.ORANGESLICE_API_KEY
  if (!apiKey) return
  configure({ apiKey })
  orangesliceConfigured = true
}

function compact(value?: string | null, max = 240) {
  const clean = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
  if (!clean) return undefined
  return clean.length > max ? `${clean.slice(0, max).trim()}…` : clean
}

function sanitizeWebsite(website?: string) {
  if (!website) return undefined
  const trimmed = website.trim()
  if (!trimmed) return undefined

  try {
    return new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`).toString()
  } catch {
    return undefined
  }
}

function extractDomain(website?: string) {
  const cleanWebsite = sanitizeWebsite(website)
  if (!cleanWebsite) return undefined

  try {
    return new URL(cleanWebsite).hostname.replace(/^www\./, '')
  } catch {
    return undefined
  }
}

function extractCompanySlug(linkedinUrl?: string) {
  if (!linkedinUrl) return undefined
  const match = linkedinUrl.match(/linkedin\.com\/company\/([^/?#]+)/i)
  return match?.[1]?.trim() || undefined
}

function looksExecutivePersona(targetPersona?: string) {
  // Removed forced executive checks to allow purely dynamic persona mapping.
  return false
}

function buildTitleVariations(targetPersona?: string) {
  const persona = targetPersona?.trim()
  if (!persona) {
    return ['founder', 'owner', 'ceo']
  }
  return [persona]
}

function buildTitleSqlFilter(targetPersona?: string) {
  const persona = targetPersona?.trim()
  if (!persona) return undefined
  if (looksExecutivePersona(persona)) return undefined

  const leadership = persona.match(/\b(vp|vice president|director|head|lead|manager)\b/gi)
  const functionWords = persona
    .replace(/\b(vp|vice president|director|head|lead|manager|of|the|and|,)\b/gi, ' ')
    .split(/\s+/)
    .map(part => part.trim())
    .filter(Boolean)
    .slice(0, 3)

  if (!leadership?.length || functionWords.length === 0) return undefined

  const leadershipPattern = leadership
    .map(word => word.replace(/vice president/i, 'Vice President').replace(/\bvp\b/i, 'VP'))
    .join('|')

  const functionClauses = functionWords.map(word => `pos.title ~* '\\m${word.replace(/'/g, "''")}\\M'`)
  return [`pos.title ~* '\\m(${leadershipPattern})\\M'`, ...functionClauses].join(' AND ')
}

function toSignal(title: string, result?: string | null) {
  const clean = compact(result, 220)
  if (!clean) return null
  return {
    title,
    value: clean,
    result: clean
  }
}

function mergeEnrichments(
  prospect: Prospect,
  additions: Array<{ title: string; value: string; result: string } | null | undefined>
) {
  const existing = Array.isArray(prospect.enrichments) ? [...prospect.enrichments] : []
  const seenTitles = new Set(
    existing.map((entry: any) => `${String(entry?.title || '').toLowerCase()}`)
  )

  for (const addition of additions) {
    if (!addition) continue
    const titleKey = `${addition.title.toLowerCase()}`
    if (seenTitles.has(titleKey)) continue
    seenTitles.add(titleKey)
    existing.push(addition)
  }

  prospect.enrichments = existing
}

function buildLocation(parts: Array<string | null | undefined>) {
  return parts.map(part => compact(part, 80)).filter(Boolean).join(' | ') || undefined
}

async function findWebsiteContacts(params: {
  website?: string
  targetPersona?: string
}): Promise<WebsiteContactCandidate[]> {
  const domain = extractDomain(params.website)
  if (!domain) return []

  try {
    const queries = ['team', 'about', 'staff', 'leadership'].map(term => ({ query: `site:${domain} ${term}` }))
    const results = await services.web.batchSearch({ queries })
    const urls = Array.from(
      new Set(
        results
          .flatMap(result => result.results || [])
          .map(result => result.link)
          .filter((link): link is string => typeof link === 'string' && link.includes(domain))
      )
    ).slice(0, 3)

    if (urls.length === 0) return []

    const pages = await Promise.all(
      urls.map(async url => {
        try {
          return await services.scrape.website({ url })
        } catch {
          return null
        }
      })
    )

    const pageMarkdown = pages
      .map((page: any) => compact(page?.markdown || page?.content || page?.text, 6000))
      .filter(Boolean)
      .join('\n\n')

    if (!pageMarkdown) return []

    const extraction = await generateObject({
      model: getToolCallModel(),
      schema: z.object({
        people: z.array(
          z.object({
            name: z.string().min(1).max(80),
            title: z.string().max(120).optional(),
            email: z.string().max(160).optional(),
            linkedinUrl: z.string().max(220).optional()
          })
        ).max(5)
      }),
      system: `Extract likely decision-makers from company site content.

Return only people who appear to currently work at the company.
Prioritize owners, founders, executives, principals, heads, or the closest match to the requested role.
Do not invent emails or LinkedIn URLs.`,
      prompt: JSON.stringify({
        targetPersona: params.targetPersona || null,
        pages: pageMarkdown
      })
    })

    return extraction.object.people
  } catch (error) {
    logger.warn('Website contact extraction failed:', error)
    return []
  }
}

async function generateHermesTake(params: {
  prospect: Prospect
  context?: ProspectSearchContext
  companyDescription?: string
  signalRows: Array<{ title: string; value: string; result: string }>
}) {
  const { prospect, context, companyDescription, signalRows } = params
  const summary = compact((prospect as any).summary || companyDescription || prospect.industry, 260)

  try {
    const result = await generateObject({
      model: getToolCallModel(),
      schema: hermesTakeSchema,
      system: `You are Hermes, an operator helping a founder shortlist outreach targets.

Write an analytical prospect note for one target.

CRITICAL RULES:
1. "whyFit": Write 2-3 sharp sentences explaining precisely how this company matches (or doesn't match) the user's campaign criteria. Reference specific signals or enrichments (e.g., "They just raised $2M, making them a prime target for...").
2. "outreachAngle": Write a 1-2 sentence angle on how to approach them, using their specific data.
3. "evidence": MAX 4 items. Each MUST be a concrete fact — pulled verbatim or paraphrased from the enrichments or the Exa source excerpt provided. Do NOT invent or generalize. If an Exa text excerpt is available, extract specific quotes or signals from it. Format as short factual statements, e.g. "Founded 2018, 47 staff per LinkedIn", "Homepage confirms AWS partnership", "Hiring 3 AE roles per job board".`,
      prompt: JSON.stringify({
        campaignBrief: context?.originalQuery || null,
        offer: context?.offer || null,
        targetPersona: context?.targetPersona || null,
        company: prospect.company || null,
        website: prospect.website || null,
        decisionMaker: prospect.fullName || null,
        decisionMakerTitle: prospect.jobTitle || null,
        summary,
        signals: signalRows.slice(0, 6),
        // Exa evidence — ground truth from the web page Exa found for this company
        exaSourceUrl: (prospect as any).sourceUrl || null,
        exaTextExcerpt: (prospect as any).exaText || null
      })
    })

    return result.object
  } catch (error) {
    logger.warn('Hermes take generation failed:', error)
    return {
      whyFit: summary || `${prospect.company || 'This company'} may be worth reviewing.`,
      outreachAngle: context?.offer
        ? `Open with one concrete signal, then connect it to ${compact(context.offer, 110)}.`
        : 'Open with one concrete signal from their site before pitching.',
      evidence: signalRows.slice(0, 2).map(signal => `${signal.title}: ${signal.result}`)
    }
  }
}

export async function enrichProspectWithOrangeslice(
  prospect: Prospect,
  context?: ProspectSearchContext
): Promise<Prospect> {
  ensureOrangesliceConfigured()
  if (!process.env.ORANGESLICE_API_KEY) {
    return { ...prospect, reviewReady: true }
  }

  const enriched: Prospect = {
    ...prospect,
    enrichments: Array.isArray(prospect.enrichments) ? [...prospect.enrichments] : []
  }

  const website = sanitizeWebsite(prospect.website)
  const domain = extractDomain(website)
  const isCompanyLinkedin = typeof prospect.linkedinUrl === 'string' && /linkedin\.com\/company\//i.test(prospect.linkedinUrl)

  let companyData: OrangesliceCompany | null = null
  let companyLinkedinUrl = isCompanyLinkedin ? prospect.linkedinUrl : undefined

  try {
    if (domain) {
      companyData = (await services.company.linkedin.enrich({ domain })) as OrangesliceCompany | null
    }

    if (!companyData && (prospect.company || website)) {
      const foundUrl = await services.company.linkedin.findUrl({
        companyName: prospect.company || undefined,
        website: website || undefined,
        location: prospect.location || undefined
      })
      if (foundUrl) {
        companyLinkedinUrl = foundUrl
        companyData = (await services.company.linkedin.enrich({ url: foundUrl })) as OrangesliceCompany | null
      }
    }
  } catch (error) {
    logger.warn('Orangeslice company enrichment failed:', error)
  }

  if (companyData) {
    companyLinkedinUrl = companyLinkedinUrl || compact(companyData.linkedin_url, 220)
    enriched.company = compact(companyData.name, 120) || enriched.company
    enriched.website = sanitizeWebsite(companyData.website || enriched.website) || enriched.website
    enriched.location =
      buildLocation([companyData.locality, companyData.region, companyData.country_name]) || enriched.location
    enriched.companySize =
      compact(
        typeof companyData.employee_count === 'number'
          ? `${companyData.employee_count} employees`
          : (companyData.size as string | undefined),
        80
      ) || enriched.companySize
    enriched.industry = compact(companyData.type, 80) || enriched.industry
    ;(enriched as any).summary =
      compact(companyData.description, 260) || (enriched as any).summary

    mergeEnrichments(enriched, [
      toSignal('Company Name', companyData.name),
      toSignal('Company LinkedIn', companyLinkedinUrl),
      toSignal('Company Location', enriched.location),
      toSignal('Company Size', enriched.companySize),
      toSignal('Company Profile', companyData.description),
      toSignal(
        'Specialties',
        Array.isArray(companyData.specialties)
          ? companyData.specialties.slice(0, 6).join(', ')
          : typeof companyData.specialties === 'string'
          ? companyData.specialties
          : undefined
      )
    ])
  }

  let personLinkedinUrl = !isCompanyLinkedin ? prospect.linkedinUrl : undefined

  try {
    if (companyLinkedinUrl) {
      const titleVariations = buildTitleVariations(context?.targetPersona)
      const titleSqlFilter = buildTitleSqlFilter(context?.targetPersona)
      const employeeResult = await services.company.getEmployeesFromLinkedin({
        linkedinUrl: companyLinkedinUrl,
        searchStrategy: looksExecutivePersona(context?.targetPersona) ? 'web' : 'database',
        titleVariations,
        titleSqlFilter,
        limit: 5,
        onlyCurrent: true,
        usOnly: false
      })

      const employee = employeeResult.employees?.[0]
      if (employee) {
        enriched.fullName = compact(employee.lp_formatted_name, 100) || enriched.fullName
        enriched.jobTitle = compact(employee.lp_title, 120) || enriched.jobTitle
        enriched.location = compact(employee.lp_location_name, 100) || enriched.location
        personLinkedinUrl = compact(employee.lp_public_profile_url, 220) || personLinkedinUrl

        mergeEnrichments(enriched, [
          toSignal('Decision Maker Name', employee.lp_formatted_name),
          toSignal('Decision Maker Title', employee.lp_title),
          toSignal('Decision Maker LinkedIn', employee.lp_public_profile_url),
          toSignal('Decision Maker Location', employee.lp_location_name)
        ])
      }
    }
  } catch (error) {
    logger.warn('Orangeslice employee enrichment failed:', error)
  }

  if (!enriched.fullName) {
    const websiteContacts = await findWebsiteContacts({ website, targetPersona: context?.targetPersona })
    const firstContact = websiteContacts[0]
    if (firstContact) {
      enriched.fullName = compact(firstContact.name, 100) || enriched.fullName
      enriched.jobTitle = compact(firstContact.title, 120) || enriched.jobTitle
      personLinkedinUrl = compact(firstContact.linkedinUrl, 220) || personLinkedinUrl
      enriched.email = compact(firstContact.email, 160) || enriched.email

      mergeEnrichments(enriched, [
        toSignal('Decision Maker Name', firstContact.name),
        toSignal('Decision Maker Title', firstContact.title),
        toSignal('Decision Maker LinkedIn', firstContact.linkedinUrl),
        toSignal('Decision Maker Email', firstContact.email)
      ])
    }
  }

  try {
    if (personLinkedinUrl) {
      const person = (await services.person.linkedin.enrich({ url: personLinkedinUrl })) as OrangeslicePerson | null
      if (person) {
        enriched.fullName = compact(person.name, 100) || enriched.fullName
        enriched.jobTitle = compact(person.title, 120) || enriched.jobTitle
        personLinkedinUrl = compact(person.url || personLinkedinUrl, 220) || personLinkedinUrl
        mergeEnrichments(enriched, [
          toSignal('Decision Maker Name', person.name),
          toSignal('Decision Maker Title', person.title),
          toSignal('Decision Maker Summary', person.summary || person.headline)
        ])
      }
    }
  } catch (error) {
    logger.warn('Orangeslice person enrichment failed:', error)
  }

  enriched.linkedinUrl = personLinkedinUrl || companyLinkedinUrl || enriched.linkedinUrl

  if (!enriched.email && personLinkedinUrl) {
    try {
      const firstName = enriched.fullName?.split(/\s+/)[0]
      const lastName = enriched.fullName?.split(/\s+/).slice(1).join(' ')
      const contactInfo = await Promise.race([
        services.person.contact.get({
          linkedinUrl: personLinkedinUrl,
          firstName,
          lastName,
          company: enriched.company,
          domain,
          required: ['work_email']
        }),
        new Promise<null>(resolve => setTimeout(() => resolve(null), 8000))
      ])

      const email =
        contactInfo && 'work_emails' in contactInfo
          ? contactInfo.work_emails?.[0] || contactInfo.personal_emails?.[0]
          : undefined

      if (email) {
        enriched.email = compact(email, 160) || enriched.email
        mergeEnrichments(enriched, [toSignal('Decision Maker Email', email)])
      }
    } catch (error) {
      logger.warn('Orangeslice contact waterfall failed:', error)
    }
  }

  const signalRows = (Array.isArray(enriched.enrichments) ? enriched.enrichments : [])
    .map((entry: any) => ({
      title: String(entry?.title || '').trim(),
      value: String(entry?.result || entry?.value || '').trim(),
      result: String(entry?.result || entry?.value || '').trim()
    }))
    .filter(entry => entry.title && entry.result)

  enriched.hermesTake = await generateHermesTake({
    prospect: enriched,
    context,
    companyDescription: (enriched as any).summary,
    signalRows
  })
  enriched.note = enriched.hermesTake.whyFit
  enriched.reviewReady = true

  return enriched
}

/**
 * Step 1 enrichment: company data only (LinkedIn info, size, description, location).
 * Fast and cheap. Use for the initial "company card" display before the user requests
 * contacts. The result is marked reviewReady so it can be rendered immediately.
 */
export async function enrichCompanyData(
  prospect: Prospect,
  context?: ProspectSearchContext
): Promise<Prospect> {
  ensureOrangesliceConfigured()
  if (!process.env.ORANGESLICE_API_KEY) return { ...prospect, reviewReady: true }

  const enriched: Prospect = {
    ...prospect,
    enrichments: Array.isArray(prospect.enrichments) ? [...prospect.enrichments] : []
  }

  const website = sanitizeWebsite(prospect.website)
  const domain = extractDomain(website)
  const isCompanyLinkedin =
    typeof prospect.linkedinUrl === 'string' &&
    /linkedin\.com\/company\//i.test(prospect.linkedinUrl)

  let companyLinkedinUrl = isCompanyLinkedin ? prospect.linkedinUrl : undefined

  try {
    let companyData: OrangesliceCompany | null = null
    if (domain) {
      companyData = (await services.company.linkedin.enrich({ domain })) as OrangesliceCompany | null
    }
    if (!companyData && (prospect.company || website)) {
      const foundUrl = await services.company.linkedin.findUrl({
        companyName: prospect.company || undefined,
        website: website || undefined,
        location: prospect.location || undefined
      })
      if (foundUrl) {
        companyLinkedinUrl = foundUrl
        companyData = (await services.company.linkedin.enrich({ url: foundUrl })) as OrangesliceCompany | null
      }
    }
    if (companyData) {
      companyLinkedinUrl = companyLinkedinUrl || compact(companyData.linkedin_url, 220)
      enriched.company = compact(companyData.name, 120) || enriched.company
      enriched.website = sanitizeWebsite(companyData.website || enriched.website) || enriched.website
      enriched.location =
        buildLocation([companyData.locality, companyData.region, companyData.country_name]) ||
        enriched.location
      enriched.companySize =
        compact(
          typeof companyData.employee_count === 'number'
            ? `${companyData.employee_count} employees`
            : (companyData.size as string | undefined),
          80
        ) || enriched.companySize
      enriched.industry = compact(companyData.type, 80) || enriched.industry
      ;(enriched as any).summary = compact(companyData.description, 260) || (enriched as any).summary
      mergeEnrichments(enriched, [
        toSignal('Company Name', companyData.name),
        toSignal('Company LinkedIn', companyLinkedinUrl),
        toSignal('Company Location', enriched.location),
        toSignal('Company Size', enriched.companySize),
        toSignal('Company Profile', companyData.description),
        toSignal(
          'Specialties',
          Array.isArray(companyData.specialties)
            ? companyData.specialties.slice(0, 6).join(', ')
            : typeof companyData.specialties === 'string'
            ? companyData.specialties
            : undefined
        )
      ])
    }
  } catch (error) {
    logger.warn('enrichCompanyData failed:', error)
  }

  ;(enriched as any).companyEnrichmentDone = true
  enriched.reviewReady = true
  return enriched
}

/**
 * Step 2 enrichment: person resolution, email finding, and Hermes Take.
 * Call on-demand when the user selects companies to find contacts for.
 * Expects prospect to have already been through enrichCompanyData.
 */
export async function enrichPersonData(
  prospect: Prospect,
  context?: ProspectSearchContext
): Promise<Prospect> {
  ensureOrangesliceConfigured()
  if (!process.env.ORANGESLICE_API_KEY) return { ...prospect, reviewReady: true }

  const enriched: Prospect = {
    ...prospect,
    enrichments: Array.isArray(prospect.enrichments) ? [...prospect.enrichments] : []
  }

  const website = sanitizeWebsite(prospect.website)
  const domain = extractDomain(website)
  const companyLinkedinUrl = (enriched.enrichments as any[])?.find(
    (e: any) => e?.title === 'Company LinkedIn'
  )?.result as string | undefined

  let personLinkedinUrl: string | undefined

  try {
    if (companyLinkedinUrl) {
      const employeeResult = await services.company.getEmployeesFromLinkedin({
        linkedinUrl: companyLinkedinUrl,
        searchStrategy: 'web',
        titleVariations: buildTitleVariations(context?.targetPersona),
        titleSqlFilter: buildTitleSqlFilter(context?.targetPersona),
        limit: 3,
        onlyCurrent: true,
        usOnly: false
      })
      const employee = employeeResult.employees?.[0]
      if (employee) {
        enriched.fullName = compact(employee.lp_formatted_name, 100) || enriched.fullName
        enriched.jobTitle = compact(employee.lp_title, 120) || enriched.jobTitle
        personLinkedinUrl = compact(employee.lp_public_profile_url, 220)
        mergeEnrichments(enriched, [
          toSignal('Decision Maker Name', employee.lp_formatted_name),
          toSignal('Decision Maker Title', employee.lp_title),
          toSignal('Decision Maker LinkedIn', employee.lp_public_profile_url),
          toSignal('Decision Maker Location', employee.lp_location_name)
        ])
      }
    }
  } catch (error) {
    logger.warn('enrichPersonData: employee lookup failed:', error)
  }

  if (!enriched.fullName) {
    const websiteContacts = await findWebsiteContacts({ website, targetPersona: context?.targetPersona })
    const firstContact = websiteContacts[0]
    if (firstContact) {
      enriched.fullName = compact(firstContact.name, 100) || enriched.fullName
      enriched.jobTitle = compact(firstContact.title, 120) || enriched.jobTitle
      personLinkedinUrl = compact(firstContact.linkedinUrl, 220) || personLinkedinUrl
      enriched.email = compact(firstContact.email, 160) || enriched.email
      mergeEnrichments(enriched, [
        toSignal('Decision Maker Name', firstContact.name),
        toSignal('Decision Maker Title', firstContact.title),
        toSignal('Decision Maker LinkedIn', firstContact.linkedinUrl),
        toSignal('Decision Maker Email', firstContact.email)
      ])
    }
  }

  try {
    if (personLinkedinUrl) {
      const person = (await services.person.linkedin.enrich({ url: personLinkedinUrl })) as OrangeslicePerson | null
      if (person) {
        enriched.fullName = compact(person.name, 100) || enriched.fullName
        enriched.jobTitle = compact(person.title, 120) || enriched.jobTitle
        personLinkedinUrl = compact(person.url || personLinkedinUrl, 220) || personLinkedinUrl
        mergeEnrichments(enriched, [
          toSignal('Decision Maker Name', person.name),
          toSignal('Decision Maker Title', person.title),
          toSignal('Decision Maker Summary', person.summary || person.headline)
        ])
      }
    }
  } catch (error) {
    logger.warn('enrichPersonData: person LinkedIn enrichment failed:', error)
  }

  enriched.linkedinUrl = personLinkedinUrl || enriched.linkedinUrl

  if (!enriched.email && personLinkedinUrl) {
    try {
      const firstName = enriched.fullName?.split(/\s+/)[0]
      const lastName = enriched.fullName?.split(/\s+/).slice(1).join(' ')
      const contactInfo = await Promise.race([
        services.person.contact.get({
          linkedinUrl: personLinkedinUrl,
          firstName,
          lastName,
          company: enriched.company,
          domain,
          required: ['work_email']
        }),
        new Promise<null>(resolve => setTimeout(() => resolve(null), 8000))
      ])
      const email =
        contactInfo && 'work_emails' in contactInfo
          ? contactInfo.work_emails?.[0] || contactInfo.personal_emails?.[0]
          : undefined
      if (email) {
        enriched.email = compact(email, 160) || enriched.email
        mergeEnrichments(enriched, [toSignal('Decision Maker Email', email)])
      }
    } catch (error) {
      logger.warn('enrichPersonData: contact waterfall failed:', error)
    }
  }

  const signalRows = (Array.isArray(enriched.enrichments) ? enriched.enrichments : [])
    .map((entry: any) => ({
      title: String(entry?.title || '').trim(),
      value: String(entry?.result || entry?.value || '').trim(),
      result: String(entry?.result || entry?.value || '').trim()
    }))
    .filter(entry => entry.title && entry.result)

  enriched.hermesTake = await generateHermesTake({
    prospect: enriched,
    context,
    companyDescription: (enriched as any).summary,
    signalRows
  })
  enriched.note = enriched.hermesTake.whyFit
  enriched.reviewReady = true

  return enriched
}
