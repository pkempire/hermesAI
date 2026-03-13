import { configure, services } from 'orangeslice';

// Configure API key
configure({ apiKey: process.env.ORANGESLICE_API_KEY });

async function findBayAreaCollegeCounselors() {
  console.log('🔍 Finding Bay Area college counselors for Lucid Academy partnerships...\n');

  try {
    // Search for college counseling companies and founders
    const companyQueries = [
      '"college counseling" "Palo Alto" site:linkedin.com/company',
      '"college admissions" "Menlo Park" site:linkedin.com/company',
      '"college consulting" "Silicon Valley" STEM site:linkedin.com/company',
      '"Ivy League admissions" "Bay Area" site:linkedin.com/company',
      '"college counseling" "Cupertino" site:linkedin.com/company'
    ];

    const founderQueries = [
      '"founder" "college counseling" "Palo Alto" site:linkedin.com/in',
      '"CEO" "college admissions" "Bay Area" site:linkedin.com/in',
      '"founder" "college consulting" "Silicon Valley" site:linkedin.com/in',
      '"college counselor" "Stanford" "Menlo Park" site:linkedin.com/in',
      '"admissions consultant" "Ivy League" "San Francisco" site:linkedin.com/in'
    ];

    console.log('🏢 Searching for college counseling companies...');
    const companyResults = await services.web.batchSearch({
      queries: companyQueries.map(query => ({ query }))
    });

    console.log('👤 Searching for founders and counselors...');
    const founderResults = await services.web.batchSearch({
      queries: founderQueries.map(query => ({ query }))
    });

    // Extract and deduplicate results
    const companies = new Map();
    const founders = new Map();

    // Process company results
    companyResults.forEach(result => {
      result.results.forEach(item => {
        if (item.link.includes('linkedin.com/company/')) {
          const companySlug = item.link.split('/company/')[1]?.split('/')[0]?.split('?')[0];
          if (companySlug && !companies.has(companySlug)) {
            companies.set(companySlug, {
              title: item.title,
              url: item.link,
              snippet: item.snippet,
              slug: companySlug
            });
          }
        }
      });
    });

    // Process founder results
    founderResults.forEach(result => {
      result.results.forEach(item => {
        if (item.link.includes('linkedin.com/in/')) {
          const username = item.link.split('/in/')[1]?.split('/')[0]?.split('?')[0];
          if (username && !founders.has(username)) {
            founders.set(username, {
              title: item.title,
              url: item.link,
              snippet: item.snippet,
              username: username
            });
          }
        }
      });
    });

    console.log(`\n✅ Found ${companies.size} companies and ${founders.size} founders/counselors\n`);

    // Enrich top companies
    console.log('📊 Getting detailed company information...\n');
    const topCompanies = Array.from(companies.values()).slice(0, 5);
    const enrichedCompanies = [];

    for (const company of topCompanies) {
      try {
        const enriched = await services.company.linkedin.enrich({
          linkedinUrl: `https://www.linkedin.com/company/${company.slug}`
        });
        enrichedCompanies.push({
          name: enriched.name || company.title,
          website: enriched.website,
          description: enriched.description?.slice(0, 200),
          employeeCount: enriched.employeeCount,
          location: enriched.location,
          linkedinUrl: company.url
        });
      } catch (error) {
        console.log(`Could not enrich ${company.title}`);
      }
    }

    // Enrich top founders/counselors
    console.log('👥 Getting founder/counselor profiles...\n');
    const topFounders = Array.from(founders.values()).slice(0, 10);
    const enrichedFounders = [];

    for (const founder of topFounders) {
      try {
        const enriched = await services.person.linkedin.enrich({
          username: founder.username
        });
        if (enriched.fullName) {
          enrichedFounders.push({
            name: enriched.fullName,
            headline: enriched.headline,
            company: enriched.company,
            location: enriched.location,
            linkedinUrl: founder.url,
            about: enriched.summary?.slice(0, 150)
          });
        }
      } catch (error) {
        // Skip if enrichment fails
      }
    }

    // Display results
    console.log('=' .repeat(80));
    console.log('🎯 TOP BAY AREA COLLEGE COUNSELORS FOR LUCID ACADEMY');
    console.log('=' .repeat(80) + '\n');

    console.log('📚 COLLEGE COUNSELING COMPANIES:\n');
    enrichedCompanies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}`);
      if (company.website) console.log(`   🌐 ${company.website}`);
      console.log(`   📍 ${company.location || 'Bay Area'}`);
      console.log(`   👥 ${company.employeeCount || 'N/A'} employees`);
      console.log(`   🔗 ${company.linkedinUrl}`);
      if (company.description) {
        console.log(`   📝 ${company.description}...`);
      }
      console.log('');
    });

    console.log('\n👤 FOUNDERS & TOP COUNSELORS:\n');
    enrichedFounders.forEach((founder, index) => {
      console.log(`${index + 1}. ${founder.name}`);
      console.log(`   💼 ${founder.headline}`);
      if (founder.company) console.log(`   🏢 ${founder.company}`);
      console.log(`   📍 ${founder.location || 'Bay Area'}`);
      console.log(`   🔗 ${founder.linkedinUrl}`);
      if (founder.about) {
        console.log(`   📝 ${founder.about}...`);
      }
      console.log('');
    });

    // Additional web results for non-LinkedIn sites
    console.log('\n🌐 ADDITIONAL COUNSELING SERVICES (Non-LinkedIn):\n');

    const webSearch = await services.web.search({
      query: '"college counseling" "Bay Area" "STEM" OR "Ivy League" -site:linkedin.com'
    });

    webSearch.results.slice(0, 5).forEach(result => {
      if (!result.link.includes('linkedin')) {
        console.log(`• ${result.title}`);
        console.log(`  🔗 ${result.link}`);
        console.log(`  ${result.snippet.slice(0, 150)}...\n`);
      }
    });

    console.log('=' .repeat(80));
    console.log('💡 OUTREACH STRATEGY FOR LUCID ACADEMY');
    console.log('=' .repeat(80));
    console.log(`
Key Talking Points:
• "We provide AI-powered research coaching that creates standout STEM portfolios"
• "Our students publish real research papers - perfect differentiation for Ivy League apps"
• "We complement your services - you handle strategy, we deliver research credentials"

Partnership Benefits:
• Referral commission structure (suggest 10-20% of program fees)
• Co-marketing opportunities
• Joint webinars for parents
• White-label option for larger firms

Next Steps:
1. Send personalized LinkedIn messages to founders
2. Offer a free demo session for their top students
3. Create case studies of students who got into MIT/Stanford
4. Host a "Research for College Admissions" webinar
    `);

  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nMake sure your ORANGESLICE_API_KEY is set correctly.');
  }
}

// Run the search
findBayAreaCollegeCounselors();