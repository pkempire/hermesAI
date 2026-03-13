import { services } from 'orangeslice';

async function findBayAreaCollegeCounselors() {
  console.log('🔍 Searching for Bay Area college counselors specializing in STEM/Ivy League...\n');

  // Search queries targeting different angles
  const queries = [
    // Founders and CEOs
    '"college counseling" founder "Palo Alto" OR "Menlo Park" OR "Los Altos" site:linkedin.com/in',
    '"college admissions" CEO "San Francisco" OR "Bay Area" site:linkedin.com/in',
    '"college consulting" founder "Cupertino" OR "Sunnyvale" site:linkedin.com/in',

    // Companies
    '"Ivy League" "college counseling" "Bay Area" site:linkedin.com/company',
    '"STEM admissions" "college consulting" "Silicon Valley" site:linkedin.com/company',
    '"Stanford admissions" counseling "Palo Alto" site:linkedin.com/company',

    // Specific searches for premium services
    '"boutique college counseling" "Bay Area"',
    '"elite college admissions" "Silicon Valley" founder',
    '"private college counselor" "Menlo Park" OR "Palo Alto" STEM',
    '"college admissions consulting" "high achievers" "Bay Area"'
  ];

  try {
    // Run batch search for all queries
    console.log('Running batch search across multiple queries...');
    const searchResults = await services.web.batchSearch({
      queries: queries.map(query => ({ query }))
    });

    // Collect unique LinkedIn URLs
    const linkedinUrls = new Set();
    const companyWebsites = new Set();

    searchResults.forEach(result => {
      result.results.forEach(item => {
        if (item.link.includes('linkedin.com/in/')) {
          linkedinUrls.add(item.link);
        } else if (item.link.includes('linkedin.com/company/')) {
          linkedinUrls.add(item.link);
        } else {
          companyWebsites.add({
            title: item.title,
            url: item.link,
            snippet: item.snippet
          });
        }
      });
    });

    console.log(`\n✅ Found ${linkedinUrls.size} LinkedIn profiles/companies`);
    console.log(`✅ Found ${companyWebsites.size} company websites\n`);

    // Now let's enrich some of the top LinkedIn profiles
    const profileUrls = Array.from(linkedinUrls).slice(0, 10);
    console.log('📊 Enriching top LinkedIn profiles...\n');

    const enrichedProfiles = [];

    for (const url of profileUrls) {
      if (url.includes('/in/')) {
        try {
          const profile = await services.person.linkedin.enrich({ linkedinUrl: url });
          if (profile.fullName && profile.headline) {
            enrichedProfiles.push({
              name: profile.fullName,
              headline: profile.headline,
              company: profile.company,
              location: profile.location,
              linkedinUrl: url,
              about: profile.summary?.slice(0, 200) + '...'
            });
          }
        } catch (error) {
          console.log(`Skipping ${url}: ${error.message}`);
        }
      }
    }

    // Display results
    console.log('🎯 TOP BAY AREA COLLEGE COUNSELORS FOR LUCID ACADEMY PARTNERSHIPS:\n');
    console.log('=' .repeat(80) + '\n');

    enrichedProfiles.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.name}`);
      console.log(`   📍 ${profile.headline}`);
      console.log(`   🏢 ${profile.company || 'Independent Consultant'}`);
      console.log(`   📍 ${profile.location}`);
      console.log(`   🔗 ${profile.linkedinUrl}`);
      if (profile.about) {
        console.log(`   📝 ${profile.about}`);
      }
      console.log('');
    });

    // Also show some company websites found
    console.log('\n📚 ADDITIONAL COLLEGE COUNSELING FIRMS:\n');
    console.log('=' .repeat(80) + '\n');

    let count = 0;
    companyWebsites.forEach(site => {
      if (count < 5 && (site.snippet.toLowerCase().includes('ivy') ||
                        site.snippet.toLowerCase().includes('stem') ||
                        site.snippet.toLowerCase().includes('stanford'))) {
        console.log(`• ${site.title}`);
        console.log(`  🔗 ${site.url}`);
        console.log(`  ${site.snippet}\n`);
        count++;
      }
    });

    console.log('\n💡 PITCH STRATEGY FOR LUCID ACADEMY:\n');
    console.log('=' .repeat(80));
    console.log(`
These counselors work with families investing $10K-50K+ in college prep.
Your AI/research coaching program would complement their services perfectly:

1. You provide substantive STEM research experience
2. They handle application strategy and essays
3. Students get both research credentials AND application expertise

Key talking points:
• "We help your students build genuine research portfolios"
• "Perfect for students targeting MIT, Stanford, Ivy League STEM programs"
• "White-glove service that matches your premium positioning"
    `);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the search
findBayAreaCollegeCounselors();