/**
 * OpenAI Query Optimizer for HermesAI
 * Optimizes search queries for better prospect research results using Exa Websets
 */

import { ProspectCriteria } from '@/components/campaign-builder'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Optimize a search query for prospect research using OpenAI
 */
export async function optimizeProspectSearchQuery(
  criteria: ProspectCriteria
): Promise<string> {
  const prompt = `You are an expert at creating search queries for prospect research and lead generation. 

Given the following prospect criteria, create an optimized search query that will find the most relevant prospects:

Entity Type: ${criteria.entityType}
Target Count: ${criteria.targetCount}
Base Query: ${criteria.query}

Filters:
${criteria.filters.industry?.length ? `- Industries: ${criteria.filters.industry.join(', ')}` : ''}
${criteria.filters.jobTitles?.length ? `- Job Titles: ${criteria.filters.jobTitles.join(', ')}` : ''}
${criteria.filters.location?.length ? `- Locations: ${criteria.filters.location.join(', ')}` : ''}
${criteria.filters.companySize ? `- Company Size: ${criteria.filters.companySize}` : ''}
${criteria.filters.technologies?.length ? `- Technologies: ${criteria.filters.technologies.join(', ')}` : ''}
${criteria.filters.revenueRange ? `- Revenue Range: ${criteria.filters.revenueRange}` : ''}

Create a single, well-crafted search query that will find ${criteria.entityType === 'person' ? 'people' : criteria.entityType === 'company' ? 'companies' : 'relevant entities'} matching these criteria. The query should be:

1. Specific enough to find qualified prospects
2. Broad enough to get sufficient results
3. Include key identifying terms for the industry/role
4. Optimized for web search engines

Return ONLY the optimized search query, nothing else.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at B2B prospect research and creating effective search queries for lead generation. Always return concise, effective search queries.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.3
    })

    return response.choices[0]?.message?.content?.trim() || criteria.query
  } catch (error) {
    console.error('Error optimizing search query:', error)
    return criteria.query // Fallback to original query
  }
}

/**
 * Generate personalized email using OpenAI based on prospect data
 */
export async function generatePersonalizedEmail(
  prospect: any,
  template: string,
  campaignContext: string
): Promise<string> {
  const prompt = `Generate a personalized cold email for B2B outreach.

Prospect Information:
- Name: ${prospect.fullName || prospect.firstName + ' ' + prospect.lastName}
- Company: ${prospect.company}
- Job Title: ${prospect.jobTitle}
- Industry: ${prospect.industry}
- Location: ${prospect.location}
${prospect.enrichments?.websiteContent ? `- About Company: ${prospect.enrichments.websiteContent.substring(0, 500)}...` : ''}

Email Template:
${template}

Campaign Context:
${campaignContext}

Instructions:
1. Personalize the email with specific details about the prospect and their company
2. Keep it concise and professional
3. Include relevant value propositions based on their industry/role
4. Use the template structure but make it feel natural and personalized
5. Replace template variables like {firstName}, {company}, etc. with actual values

Return the personalized email content only.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at writing personalized B2B cold emails that get responses. Focus on being helpful, concise, and relevant.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    })

    return response.choices[0]?.message?.content?.trim() || template
  } catch (error) {
    console.error('Error generating personalized email:', error)
    return template // Fallback to template
  }
}

/**
 * Analyze and improve email templates for better performance
 */
export async function analyzeEmailTemplate(
  template: string,
  industry: string
): Promise<{
  score: number
  suggestions: string[]
  improvedTemplate: string
}> {
  const prompt = `Analyze this cold email template for ${industry} prospects:

${template}

Provide:
1. A score from 1-10 for effectiveness
2. 3-5 specific improvement suggestions
3. An improved version of the template

Focus on:
- Personalization opportunities
- Value proposition clarity
- Call-to-action effectiveness
- Industry-specific messaging
- Response likelihood

Format your response as JSON:
{
  "score": 8,
  "suggestions": ["suggestion1", "suggestion2", ...],
  "improvedTemplate": "improved email template"
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert email marketing strategist specializing in B2B cold outreach. Provide actionable, specific feedback.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.3
    })

    const content = response.choices[0]?.message?.content?.trim()
    if (content) {
      try {
        return JSON.parse(content)
      } catch {
        // If JSON parsing fails, return default response
        return {
          score: 7,
          suggestions: ['Consider adding more personalization', 'Clarify the value proposition', 'Improve the call-to-action'],
          improvedTemplate: template
        }
      }
    }
    
    return {
      score: 7,
      suggestions: ['Template analysis unavailable'],
      improvedTemplate: template
    }
  } catch (error) {
    console.error('Error analyzing email template:', error)
    return {
      score: 7,
      suggestions: ['Analysis temporarily unavailable'],
      improvedTemplate: template
    }
  }
} 