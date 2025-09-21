require('dotenv').config();
const { openai } = require('./src/lib/openai.ts');

async function testEmbeddingDimensions() {
  try {
    console.log('Testing embedding dimensions...');
    
    const response = await openai.embeddings.create({
      model: 'bge-m3',
      input: 'test text for embedding'
    });
    
    const embedding = response.data[0].embedding;
    console.log('Embedding dimensions:', embedding.length);
    console.log('First 5 values:', embedding.slice(0, 5));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testEmbeddingDimensions();
