import Exa from 'exa-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url!);
    const websetId = searchParams.get('websetId');
    const targetParam = searchParams.get('target');
    const targetCount = targetParam ? Number(targetParam) : undefined;
    if (!websetId) return NextResponse.json({ error: 'Missing websetId' }, { status: 400 });
    
    const exa = new Exa(process.env.EXA_API_KEY!);
    
    console.log(`[GET /api/prospect-search/status] Checking webset: ${websetId}`);
    
    // Get webset status
    const webset = await exa.websets.get(websetId);
    console.log(`[GET /api/prospect-search/status] Webset status: ${webset.status}`);
    
    // Progress info from searches
    let analyzed = 0, found = 0;
    if (webset.searches && webset.searches.length > 0) {
      const search = webset.searches[0];
      analyzed = search.progress?.analyzed || 0;
      found = search.progress?.found || 0;
      console.log(`[GET /api/prospect-search/status] Search progress: found=${found}, analyzed=${analyzed}, completion=${search.progress?.completion || 0}%`);
    }

    // Only try to get items if webset has completed or is running with items
    let prospects: any[] = [];
    let itemsResponse;
    
    try {
      // Always try to get items, even if webset is still running
      itemsResponse = await exa.websets.items.list(websetId, { limit: 100 });
      console.log(`[GET /api/prospect-search/status] Items API response:`, {
        total: itemsResponse.data?.length || 0,
        hasMore: itemsResponse.hasMore,
        nextCursor: itemsResponse.nextCursor
      });
      
      if (itemsResponse.data && itemsResponse.data.length > 0) {
        console.log(`[GET /api/prospect-search/status] Found ${itemsResponse.data.length} items. Processing...`);
        
        prospects = itemsResponse.data.map((item: any) => {
          try {
            console.log(`[GET /api/prospect-search/status] Processing item ${item.id}:`, {
              title: item.title,
              url: item.url,
              hasEnrichments: !!(item.enrichments),
              enrichmentsType: typeof item.enrichments,
              enrichmentsLength: Array.isArray(item.enrichments) ? item.enrichments.length : Object.keys(item.enrichments || {}).length,
              enrichmentsStructure: item.enrichments
            });
            
            // Extract basic info from URL and available metadata
            let extractedName = 'Profile Found';
            let extractedTitle = 'Unknown';
            let extractedCompany = 'Unknown';
            
            // Try to extract info from LinkedIn URL pattern
            if (item.url && item.url.includes('linkedin.com/in/')) {
              const urlPath = item.url.split('/in/')[1]?.split('/')[0];
              if (urlPath) {
                // Convert linkedin URL slug to readable name (basic attempt)
                extractedName = urlPath.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
              }
            }
            
            // Try to extract from title field if available
            if (item.title) {
              extractedName = item.title;
              // Sometimes title contains job info like "John Doe - Marketing Director at Company"
              const titleParts = item.title.split(' - ');
              if (titleParts.length > 1) {
                extractedName = titleParts[0];
                const roleCompany = titleParts[1];
                if (roleCompany.includes(' at ')) {
                  const [role, company] = roleCompany.split(' at ');
                  extractedTitle = role.trim();
                  extractedCompany = company.trim();
                }
              }
            }
            
            // Create prospect with available data
            const prospect: any = {
              id: item.id,
              exaItemId: item.id,
              fullName: extractedName,
              jobTitle: extractedTitle,
              company: extractedCompany,
              email: undefined,
              linkedinUrl: item.url || undefined,
              website: item.url,
              location: undefined,
              industry: undefined,
              companySize: undefined,
              enrichments: item.enrichments || [],
              avatarUrl: item.metadata?.image || item.metadata?.avatar || undefined,
              companyLogoUrl: item.metadata?.logo || undefined
            };
            
            // Try to extract enriched data if available
            if (item.enrichments) {
              try {
                console.log(`[GET /api/prospect-search/status] Raw enrichments for ${item.id}:`, JSON.stringify(item.enrichments, null, 2));
                
                // Handle different enrichment formats
                if (Array.isArray(item.enrichments)) {
                  // Array format - iterate through enrichment objects
                  item.enrichments.forEach((enrichment: any, index: number) => {
                    console.log(`[GET /api/prospect-search/status] Processing enrichment ${index}:`, enrichment);
                    
                    console.log(`[GET /api/prospect-search/status] Enrichment ${index} status:`, enrichment.status, 'ID:', enrichment.enrichmentId);
                    
                    if (enrichment.status === 'completed' && enrichment.result) {
                      const value = Array.isArray(enrichment.result) ? enrichment.result[0] : enrichment.result;
                      const enrichmentId = enrichment.enrichmentId || '';
                      
                      console.log(`[GET /api/prospect-search/status] Enrichment ${index} completed with value:`, value, 'ID:', enrichmentId);
                      
                      const valueStr = typeof value === 'string' ? value : String(value ?? '');
                      const lower = valueStr.toLowerCase();
                      const fmt = enrichment.format as string | undefined;
                      const isEmail = fmt === 'email' || valueStr.includes('@');
                      const isLinkedIn = valueStr.includes('linkedin.com');
                      const isJobTitle = /(founder|ceo|chief|principal|director|manager|head|vp|president|admissions|strategist|consultant|teacher)/i.test(valueStr) || valueStr.includes(' at ');
                      const isCompany = /(inc\.|inc\b|llc\b|corp\b|corporation|company|academy|school|counseling|education|consulting|group|partners|college)/i.test(lower) && !isJobTitle;
                      const isLikelyAddress = /\d{2,}.*\b(AZ|AL|AK|AR|CA|CO|CT|DC|DE|FL|GA|HI|IA|ID|IL|IN|KS|KY|LA|MA|MD|ME|MI|MN|MO|MS|MT|NC|ND|NE|NH|NJ|NM|NV|NY|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VA|VT|WA|WI|WV)\b/i.test(valueStr);
                      const looksLikeName = valueStr.split(' ').length <= 4 && valueStr.split(' ').every(w => /^(?:[A-Z][a-z'-]+|&|of|and)$/.test(w)) && !isJobTitle && !isCompany;
                      
                      if (isEmail) {
                        prospect.email = valueStr;
                        console.log(`[GET /api/prospect-search/status] Set email to:`, valueStr);
                      } else if (isLinkedIn) {
                        prospect.linkedinUrl = valueStr;
                        console.log(`[GET /api/prospect-search/status] Set LinkedIn to:`, valueStr);
                      } else if (isJobTitle) {
                        prospect.jobTitle = valueStr;
                        console.log(`[GET /api/prospect-search/status] Set jobTitle to:`, valueStr);
                      } else if (looksLikeName) {
                        prospect.fullName = valueStr;
                        console.log(`[GET /api/prospect-search/status] Set fullName to:`, valueStr);
                      } else if (isCompany) {
                        prospect.company = valueStr;
                        console.log(`[GET /api/prospect-search/status] Set company to:`, valueStr);
                      } else if (isLikelyAddress) {
                        prospect.location = valueStr;
                        console.log(`[GET /api/prospect-search/status] Set location (address) to:`, valueStr);
                      }
                    } else if (enrichment.status === 'canceled' || enrichment.status === 'failed') {
                      console.log(`[GET /api/prospect-search/status] Enrichment ${index} ${enrichment.status}, may retry later`);
                      // For canceled/failed enrichments, we continue processing other data
                      // The prospect will still be returned but with limited enrichment data
                    } else if (enrichment.status === 'pending' || enrichment.status === 'running') {
                      console.log(`[GET /api/prospect-search/status] Enrichment ${index} still ${enrichment.status}`);
                    }
                    
                    if (enrichment.status === 'completed' && enrichment.result) {
                      const value = Array.isArray(enrichment.result) ? enrichment.result[0] : enrichment.result;
                      const enrichmentId = enrichment.enrichmentId || '';
                      
                      if (value && value !== 'null' && value !== 'None') {
                        // Map by enrichmentId patterns or value content
                        if (enrichmentId.includes('cjr01') || (typeof value === 'string' && !value.includes('@') && !value.includes('http') && !/founder|principal|director|manager|ceo/i.test(String(value)) && value.length < 60)) {
                          // Company name enrichment
                          prospect.company = value as string | undefined;
                          console.log(`[GET /api/prospect-search/status] Set company to:`, value);
                        } else if (enrichmentId.includes('ajr01') || (typeof value === 'string' && value.includes('@'))) {
                          // Email enrichment
                          prospect.email = value as string | undefined;
                          console.log(`[GET /api/prospect-search/status] Set email to:`, value);
                        } else if (enrichmentId.includes('bjr01') || (typeof value === 'string' && value.includes('linkedin.com'))) {
                          // LinkedIn URL enrichment
                          prospect.linkedinUrl = String(value);
                          console.log(`[GET /api/prospect-search/status] Set LinkedIn to:`, value);
                          
                          // Extract name from LinkedIn URL if we don't have a better name
                          if (prospect.fullName === 'Profile Found' && (value as string).includes('/in/')) {
                            const urlPart = (value as string).split('/in/')[1]?.split('/')[0];
                            if (urlPart) {
                              const extractedName = urlPart
                                .replace(/-/g, ' ')
                                .replace(/\b\w/g, (l: string) => l.toUpperCase())
                                .replace(/[0-9]/g, '')
                                .trim();
                              if (extractedName.length > 2) {
                                prospect.fullName = extractedName;
                                console.log(`[GET /api/prospect-search/status] Extracted name from LinkedIn:`, extractedName);
                              }
                            }
                          }
                        } else if (enrichmentId.includes('djr01') || (typeof value === 'string' && (/(United States|[A-Z]{2})/i.test(String(value)) || /\d/.test(String(value))))) {
                          // Location enrichment
                          prospect.location = value as string | undefined;
                          console.log(`[GET /api/prospect-search/status] Set location to:`, value);
                        } else if (enrichmentId.includes('ejr01') || (typeof value === 'string' && ((value as string).includes('Director') || (value as string).includes('Manager') || (value as string).includes('VP') || (value as string).includes('Head of')))) {
                          // Job title enrichment
                          prospect.jobTitle = value as string | undefined;
                          console.log(`[GET /api/prospect-search/status] Set jobTitle to:`, value);
                        }
                      }
                    }
                  });
                } else if (typeof item.enrichments === 'object') {
                  // Object format - check for different possible structures
                  const enrichments = item.enrichments as Record<string, any>;
                  console.log(`[GET /api/prospect-search/status] Object enrichments keys:`, Object.keys(enrichments));
                  
                  // Try different key patterns
                  Object.entries(enrichments).forEach(([key, value]) => {
                    console.log(`[GET /api/prospect-search/status] Checking enrichment key "${key}":`, value);
                    
                    console.log(`[GET /api/prospect-search/status] Object enrichment "${key}" status:`, value?.status);
                    
                    if (value && typeof value === 'object' && value.result && value.status === 'completed') {
                      const result = Array.isArray(value.result) ? value.result[0] : value.result;
                      const desc = (value.description || key).toLowerCase();
                      console.log(`[GET /api/prospect-search/status] Object enrichment "${key}" completed with result:`, result);
                    } else if (value && typeof value === 'object' && (value.status === 'canceled' || value.status === 'failed')) {
                      console.log(`[GET /api/prospect-search/status] Object enrichment "${key}" ${value.status}`);
                    }
                    
                    if (value && typeof value === 'object' && value.result && value.status === 'completed') {
                      const result = Array.isArray(value.result) ? value.result[0] : value.result;
                      const desc = (value.description || key).toLowerCase();
                      
                      if (result && result !== 'null' && result !== 'None') {
                        if (desc.includes('name')) {
                          prospect.fullName = result;
                        } else if (desc.includes('job title') || desc.includes('title')) {
                          prospect.jobTitle = result;
                        } else if (desc.includes('company name') || desc.includes('company')) {
                          prospect.company = result;
                        } else if (desc.includes('email')) {
                          prospect.email = result;
                        } else if (desc.includes('linkedin')) {
                          prospect.linkedinUrl = result;
                        } else if (desc.includes('location')) {
                          prospect.location = result;
                        } else if (desc.includes('industry')) {
                          prospect.industry = result;
                        } else if (desc.includes('size')) {
                          prospect.companySize = result;
                        }
                      }
                    } else if (value && typeof value === 'string' && value !== 'null' && value !== 'None') {
                      // Direct value mapping
                      const keyLower = key.toLowerCase();
                      if (keyLower.includes('name')) {
                        prospect.fullName = value;
                      } else if (keyLower.includes('job') || keyLower.includes('title')) {
                        prospect.jobTitle = value;
                      } else if (keyLower.includes('company')) {
                        prospect.company = value;
                      } else if (keyLower.includes('email')) {
                        prospect.email = value;
                      } else if (keyLower.includes('linkedin')) {
                        prospect.linkedinUrl = value;
                      } else if (keyLower.includes('location')) {
                        prospect.location = value;
                      } else if (keyLower.includes('industry')) {
                        prospect.industry = value;
                      } else if (keyLower.includes('size')) {
                        prospect.companySize = value;
                      }
                    }
                  });
                }
              } catch (enrichmentError) {
                console.error(`[GET /api/prospect-search/status] Error processing enrichments for item ${item.id}:`, enrichmentError);
              }
            }
            
            console.log(`[GET /api/prospect-search/status] Converted prospect:`, {
              fullName: prospect.fullName,
              company: prospect.company,
              jobTitle: prospect.jobTitle
            });
            
            return prospect;
          } catch (conversionError) {
            console.error(`[GET /api/prospect-search/status] Error converting item ${item.id}:`, conversionError);
            // Return minimal prospect data
            return {
              id: item.id,
              exaItemId: item.id,
              fullName: item.title || 'Profile Found',
              jobTitle: 'Unknown',
              company: 'Unknown',
              website: item.url,
              enrichments: item.enrichments || []
            };
          }
        });
        
        console.log(`[GET /api/prospect-search/status] Successfully converted ${prospects.length} prospects`);
      } else {
        console.log(`[GET /api/prospect-search/status] No items found in webset yet`);
      }
    } catch (itemsError) {
      console.error(`[GET /api/prospect-search/status] Error getting items:`, itemsError);
      // Don't fail the whole request if items can't be retrieved
      prospects = [];
    }

    const response = {
      prospects,
      analyzed,
      found: Math.max(found, prospects.length), // Use actual prospect count if higher
      status: webset.status
    };
    
    // Early stop condition if target reached
    if (targetCount && prospects.length >= targetCount) {
      try {
        await exa.websets.cancel(websetId);
        (response as any).status = 'completed';
        console.log(`[GET /api/prospect-search/status] Target reached (${targetCount}). Canceled webset.`);
      } catch (e) {
        console.warn('[GET /api/prospect-search/status] Failed to cancel webset:', e);
      }
    }
    
    console.log(`[GET /api/prospect-search/status] Returning response:`, {
      prospectsCount: response.prospects.length,
      analyzed: response.analyzed,
      found: response.found,
      status: response.status
    });
    
    return NextResponse.json(response);
  } catch (err: any) {
    console.error('[GET /api/prospect-search/status] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 