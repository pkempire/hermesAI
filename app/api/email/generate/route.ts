import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { getModel } from '@/lib/utils/registry'
import { generateText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { 
      prospects, 
      campaignObjective, 
      valueProposition, 
      personalization,
      emailTypes 
    } = await req.json()
    
    console.log('[POST /api/email/generate] Generating email templates:', {
      prospectsCount: prospects?.length || 0,
      emailTypesCount: emailTypes?.length || 0,
      personalizationSettings: Object.keys(personalization || {}).length
    })

    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use GPT-4o for reliable email generation  
    const model = getModel('openai:gpt-4o')

    // Sample prospect context for personalization
    const prospectContext = prospects?.slice(0, 3).map((p: any) => ({
      name: p.fullName,
      company: p.company,
      jobTitle: p.jobTitle,
      industry: p.industry,
      location: p.location
    })) || []

    const templates = []

    for (const [index, emailType] of emailTypes.entries()) {
      const isInitial = emailType.type === 'initial'
      const followUpNumber = isInitial ? 0 : parseInt(emailType.type.split('_')[2])

      const systemPrompt = `You are an expert cold email copywriter specializing in B2B outreach. 
Generate ${isInitial ? 'an initial' : `a follow-up #${followUpNumber}`} email that is:
- ${emailType.tone} in tone
- Personalized and relevant
- Focused on value, not features
- Clear and concise (under 150 words)
- Has a specific call-to-action

Campaign Context:
- Objective: ${campaignObjective}
- Value Proposition: ${valueProposition}

Personalization Settings:
${personalization.includePersonalNote ? '- Include personal notes based on prospect activity' : ''}
${personalization.includeCompanyContext ? '- Include company-specific context' : ''}
${personalization.includeRecentActivity ? '- Reference recent industry activity' : ''}
${personalization.includeIndustryInsights ? '- Include industry insights' : ''}

Sample Prospects:
${prospectContext.map((p: any) => `- ${p.name}, ${p.jobTitle} at ${p.company} (${p.industry})`).join('\n')}

Return ONLY a JSON object with "subject" and "body" fields. Use placeholder variables like {{firstName}}, {{company}}, {{jobTitle}} for personalization.`

      const userPrompt = isInitial 
        ? `Generate an initial cold email to introduce our solution and request ${personalization.callToActionType === 'custom' ? personalization.customCTA : `a ${personalization.callToActionType}`}.`
        : `Generate follow-up email #${followUpNumber} that ${
            followUpNumber === 1 ? 'provides additional value and gently follows up' :
            followUpNumber === 2 ? 'addresses potential concerns and offers social proof' :
            'makes a final valuable offer before ending the sequence'
          }.`

      try {
        const result = await generateText({
          model: model,
          system: systemPrompt,
          prompt: userPrompt,
          temperature: 0.7 // GPT-4 supports temperature parameter
        })

        let emailContent
        try {
          emailContent = JSON.parse(result.text)
        } catch (parseError) {
          // Fallback if AI doesn't return valid JSON
          console.warn('Failed to parse AI response as JSON:', result.text)
          const lines = result.text.split('\n').filter(line => line.trim())
          emailContent = {
            subject: lines[0]?.replace(/^Subject:?\s*/i, '') || `${isInitial ? 'Quick question about' : 'Following up on'} {{company}}`,
            body: lines.slice(1).join('\n').replace(/^Body:?\s*/i, '') || result.text
          }
        }

        templates.push({
          type: emailType.type,
          subject: emailContent.subject || `${isInitial ? 'Quick question about' : 'Following up on'} {{company}}`,
          body: emailContent.body || result.text,
          tone: emailType.tone
        })

      } catch (error) {
        console.error(`Failed to generate email ${index + 1}:`, error)
        // Fallback template
        templates.push({
          type: emailType.type,
          subject: isInitial ? 'Quick question about {{company}}' : 'Following up on our previous email',
          body: isInitial 
            ? `Hi {{firstName}},\n\nI noticed {{company}} is in the ${prospectContext[0]?.industry || 'technology'} space.\n\n${valueProposition}\n\nWould you be open to a brief conversation about how we might help {{company}}?\n\nBest regards,`
            : `Hi {{firstName}},\n\nI wanted to follow up on my previous email about helping {{company}} with ${campaignObjective.split(' ').slice(0, 5).join(' ')}...\n\nWould you have 10 minutes for a quick call this week?\n\nBest regards,`,
          tone: emailType.tone
        })
      }
    }

    return NextResponse.json({
      success: true,
      templates,
      message: `Generated ${templates.length} email template${templates.length > 1 ? 's' : ''} successfully`
    })

  } catch (error) {
    console.error('[POST /api/email/generate] Error:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate email templates'
    }, { status: 500 })
  }
}