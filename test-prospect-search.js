const { createProspectSearchTool } = require('./lib/tools/prospect-search.ts');

async function testProspectSearch() {
  console.log('🔧 Testing prospect search tool creation...');
  
  try {
    const tool = createProspectSearchTool('openai:gpt-5');
    console.log('✅ Tool created successfully');
    console.log('Tool description:', tool.description);
    console.log('Tool parameters schema:', tool.parameters);
    
    // Test tool execution
    console.log('🔧 Testing tool execution...');
    const result = await tool.execute({
      query: 'marketing directors at e-commerce companies',
      targetCount: 5,
      interactive: true
    });
    
    console.log('✅ Tool executed successfully');
    console.log('Result type:', result.type);
    console.log('Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error stack:', error.stack);
  }
}

testProspectSearch();