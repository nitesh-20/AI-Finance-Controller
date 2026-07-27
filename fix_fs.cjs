const fs = require('fs');

function applyTo(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Strip ALL firebase imports safely
  content = content.replace(/import \{[^}]*\} from ['"]firebase\/firestore['"];\n/g, '');
  content = content.replace(/import \{ db \} from ['"]\.\.\/firebase['"];\n/g, '');

  const dummyFunctions = `
// Dummy Firebase functions (Safe for React)
const collection = (...args) => ({});
const query = (...args) => ({});
const where = (...args) => ({});
const orderBy = (...args) => ({});
const limit = (...args) => ({});
const onSnapshot = (...args) => (() => {});
const addDoc = async (...args) => ({ id: 'dummy' });
const updateDoc = async (...args) => {};
const setDoc = async (...args) => {};
const writeBatch = (...args) => ({ commit: async () => {}, set: () => {} });
const doc = (...args) => ({ id: 'dummy' });
const serverTimestamp = () => new Date();
const arrayUnion = (...args) => args;
const db = {};
`;


;
st db = {};
n = (...args) => args;
();
tatement
  let lastImportIndex = content.lastIndexOf('import ');
  if (lastImportIndex !== -1) {
    let endOfImport = content.indexOf('\n', lastImportIndex);
    content = content.slice(0, endOfImport + 1) + '\n' + dummyFunctions + '\n' + content.slice(endOfImport + 1);
  }

  fs.writeFileSync(file, content);
}

applyTo('src/components/VoiceAgent.tsx');
applyTo('src/services/seed.ts');

