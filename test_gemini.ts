import { createLiveSession } from './src/services/gemini';

async function test() {
  try {
    console.log('Connecting...');
    const session = await createLiveSession('dummy-user', 'merchant', {onMessage: (m) => console.log('msg', m)});
    console.log('Connected!');
  } catch (err) {
    if (err.name === 'GoogleGenAIError' || err.status) console.error('FAILED TO CONNECT:', err);
    else console.error(err);
  }
}
test();

