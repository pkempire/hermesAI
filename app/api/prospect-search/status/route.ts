import Exa from 'exa-js';
import { NextRequest, NextResponse } from 'next/server';

// Cache Exa client to avoid recreating on each request
let cachedExa: Exa | null = null;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url!);
    const websetId = searchParams.get('websetId');
    const targetParam = searchParams.get('target');
    const targetCount = targetParam ? Number(targetParam) : undefined;
    if (!websetId) return NextResponse.json({ error: 'Missing websetId' }, { status: 400 });

    // Reuse cached Exa client for speed
    if (!cachedExa) {
      cachedExa = new Exa(process.env.EXA_API_KEY!);
    }
    const exa = cachedExa;
    
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
                // Store all enrichments properly
                const structuredEnrichments: Array<{title: string; value: any; format?: string}> = [];
                
                if (Array.isArray(item.enrichments)) {
                  // Get the first enrichment for company name (it's always first)
                  const firstEnrich = item.enrichments[0];
                  if (firstEnrich?.status === 'completed' && firstEnrich.result) {
                    const companyName = Array.isArray(firstEnrich.result) ? firstEnrich.result[0] : firstEnrich.result;
                    if (companyName && companyName !== 'null') {
                      prospect.company = String(companyName);
                      prospect.fullName = String(companyName); // For companies, fullName = company name
                    }
                  }
                  
                  // Process all enrichments and store them properly
                  item.enrichments.forEach((enrichment: any, index: number) => {
                    if (enrichment.status === 'completed' && enrichment.result) {
                      const value = Array.isArray(enrichment.result) ? enrichment.result[0] : enrichment.result;
                      // Heuristic title mapping to avoid generic labels
                      let title = enrichment.description || `Enrichment ${index + 1}`;
                      const valueStr = String(value || '').toLowerCase();
                      if (valueStr.includes('linkedin.com')) title = 'LinkedIn';
                      else if (valueStr.includes('@')) title = 'Email';
                      else if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(valueStr)) title = 'Domain';
                      else if (/employee|headcount|employees/.test((enrichment.description || '').toLowerCase())) title = 'Employees';
                      else if (/funding|series|raised|invest/.test((enrichment.description || '').toLowerCase())) title = 'Funding';
                      else if (/tech|stack|technology/.test((enrichment.description || '').toLowerCase())) title = 'Tech Stack';
                      
                      if (value && value !== 'null' && value !== 'None') {
                        const valueStrRaw = String(value);
                        
                        // Extract CORE fields only
                        if (valueStrRaw.includes('@') && !prospect.email) {
                          prospect.email = valueStrRaw;
                        } else if (valueStrRaw.includes('linkedin.com') && !prospect.linkedinUrl) {
                          prospect.linkedinUrl = valueStrRaw;
                        } else if (valueStrRaw.match(/^\d{1,6}$/) && title.toLowerCase().includes('employee')) {
                          // Employee count - store as companySize
                          prospect.companySize = valueStrRaw;
                        } else if (valueStrRaw.match(/^[a-z0-9.-]+\.[a-z]{2,}$/i) && title.toLowerCase().includes('domain')) {
                          // Domain - store as website
                          prospect.website = valueStrRaw.startsWith('http') ? valueStrRaw : `https://${valueStrRaw}`;
                        }
                        
                        // Store ALL enrichments with their proper titles
                        structuredEnrichments.push({
                          title: title,
                          value: value,
                          format: enrichment.format
                        });
                      }
                    }
                  });
                  
                  // Assign structured enrichments to prospect
                  prospect.enrichments = structuredEnrichments;
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
                // Compute a quick fit score (0-100)
                try {
                  const scoreSignals = [
                    prospect.email ? 25 : 0,
                    prospect.linkedinUrl ? 20 : 0,
                    prospect.companySize ? 10 : 0,
                    prospect.industry ? 10 : 0,
                    prospect.website ? 10 : 0,
                    Array.isArray(prospect.enrichments) && prospect.enrichments.length > 3 ? 10 : 0,
                    prospect.company && prospect.company !== 'Unknown' ? 15 : 0
                  ];
                  const base = scoreSignals.reduce((a,b)=>a+b,0);
                  prospect.fitScore = Math.min(100, base);
                  // Cheap summary from available fields
                  const parts: string[] = [];
                  if (prospect.company) parts.push(prospect.company);
                  if (prospect.industry) parts.push(prospect.industry);
                  if (prospect.companySize) parts.push(`${prospect.companySize} employees`);
                  prospect.summary = parts.join(' • ');
                } catch {}
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