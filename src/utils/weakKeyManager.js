// Smart Adaptive Weak Key Practice Engine
// Tracks per-character accuracy, detects weak keys, and generates tailored 3-stage practice drills

const VOCABULARY_BY_KEY = {
  a: ['about', 'after', 'again', 'always', 'animal', 'answer', 'around', 'awake', 'balance', 'brave'],
  b: ['before', 'better', 'between', 'beyond', 'blanket', 'bright', 'bubble', 'build', 'button', 'browse'],
  c: ['calm', 'camera', 'candle', 'chance', 'circle', 'clever', 'climb', 'cloud', 'coffee', 'crystal'],
  d: ['danger', 'dawn', 'decide', 'degree', 'detail', 'diamond', 'direct', 'distance', 'dream', 'driven'],
  e: ['early', 'earth', 'effort', 'eight', 'energy', 'enough', 'enter', 'equal', 'escape', 'event'],
  f: ['fabric', 'factor', 'famous', 'father', 'feather', 'finger', 'flame', 'flavor', 'flight', 'forest'],
  g: ['garden', 'gather', 'gentle', 'giant', 'glance', 'globe', 'golden', 'grace', 'grain', 'ground'],
  h: ['handle', 'harbor', 'health', 'heart', 'heaven', 'height', 'hidden', 'hollow', 'honest', 'hunter'],
  i: ['image', 'impact', 'inside', 'island', 'issue', 'item', 'ivory', 'ideal', 'inspire', 'intact'],
  j: ['jacket', 'journey', 'judge', 'juice', 'jungle', 'junior', 'joyful', 'jumper', 'justice', 'jolly'],
  k: ['keen', 'kettle', 'keyhole', 'kingdom', 'kitchen', 'knight', 'knot', 'koala', 'kayak', 'keeper'],
  l: ['ladder', 'lantern', 'launch', 'leader', 'legacy', 'lemon', 'lesson', 'liquid', 'little', 'lumber'],
  m: ['magic', 'manner', 'marble', 'market', 'master', 'meadow', 'medium', 'melody', 'memory', 'modern'],
  n: ['narrow', 'nature', 'nearby', 'needle', 'noble', 'normal', 'notice', 'novel', 'number', 'nurture'],
  o: ['object', 'ocean', 'office', 'olive', 'online', 'orange', 'orbit', 'origin', 'output', 'oxygen'],
  p: ['packet', 'palace', 'paper', 'path', 'peace', 'pencil', 'people', 'planet', 'plaque', 'puzzle'],
  q: ['equal', 'equip', 'liquid', 'opaque', 'plaque', 'quaint', 'queen', 'quest', 'quick', 'quiet'],
  r: ['rabbit', 'radiant', 'rescue', 'rhythm', 'ribbon', 'river', 'rocket', 'rotate', 'royal', 'rustle'],
  s: ['safari', 'sailor', 'sample', 'season', 'secret', 'shadow', 'silent', 'silver', 'simple', 'summer'],
  t: ['talent', 'target', 'temple', 'tender', 'ticket', 'timber', 'travel', 'tunnel', 'twilight', 'type'],
  u: ['unique', 'unite', 'update', 'upper', 'urban', 'urgent', 'useful', 'utmost', 'umbrella', 'unlock'],
  v: ['valley', 'valve', 'velvet', 'vessel', 'victor', 'violet', 'violin', 'vision', 'visual', 'voyage'],
  w: ['wander', 'warmth', 'water', 'wealth', 'weaver', 'whisper', 'willow', 'window', 'wisdom', 'wonder'],
  x: ['box', 'exact', 'exam', 'exile', 'exit', 'expert', 'extra', 'index', 'mixer', 'pixel', 'relax'],
  y: ['yacht', 'yard', 'yarn', 'yearn', 'yeast', 'yellow', 'yield', 'yoga', 'yonder', 'youth'],
  z: ['amaze', 'blaze', 'breeze', 'crazy', 'freeze', 'hazard', 'ozone', 'prize', 'puzzle', 'zebra', 'zone']
};

const SAMPLE_SENTENCES_BY_KEY = {
  p: 'The quiet squirrel gathered ripe pinecones in pure peace.',
  q: 'The quick queen quickly solved the unique antique riddle.',
  z: 'A gentle breeze amazed the crazy zebra in the quiet zone.',
  x: 'The extra box contained an index of excellent pixel graphics.',
  j: 'The joyful judge took a brisk journey through the lush jungle.',
  k: 'A kind knight kept the keen silver key in the high kitchen.',
  b: 'Bright bubbles bounced between the brown branches before dawn.',
  v: 'Vivid velvet vines covered the valley with vibrant violet blossoms.',
  w: 'Warm winter winds whispered wonderful wisdom through the willow trees.',
  c: 'Clever cats climbed calmly upon the clean crystal counter.'
};

class WeakKeyManager {
  getKeyStatsKey(userId) {
    return `swift_key_stats_${userId || 'guest'}`;
  }

  // Get current key stats map
  getKeyStats(userId) {
    try {
      const data = localStorage.getItem(this.getKeyStatsKey(userId));
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  // Record keystroke hit or error with rolling window to prevent ancient errors from persisting
  recordKey(userId, char, isCorrect) {
    if (!char || typeof char !== 'string') return;
    const cleanChar = char.toLowerCase();
    
    // Only track standard typing characters (letters a-z, numbers 0-9, and common punctuation)
    if (!/^[a-z0-9,.;'-]$/.test(cleanChar)) return;

    try {
      const stats = this.getKeyStats(userId);
      if (!stats[cleanChar]) {
        stats[cleanChar] = { hits: 0, errors: 0 };
      }

      if (isCorrect) {
        stats[cleanChar].hits += 1;
      } else {
        stats[cleanChar].errors += 1;
      }

      // Rolling decay: keep history fresh so past mistakes don't trap the user forever
      const total = stats[cleanChar].hits + stats[cleanChar].errors;
      if (total > 16) {
        stats[cleanChar].hits = Math.round(stats[cleanChar].hits * 0.65);
        stats[cleanChar].errors = Math.round(stats[cleanChar].errors * 0.65);
      }

      localStorage.setItem(this.getKeyStatsKey(userId), JSON.stringify(stats));
    } catch (e) {
      console.warn('Failed to record key stat:', e);
    }
  }

  // Detect weak keys specific to the completed lesson
  // A key is only flagged as weak if:
  // 1. Repeated errors on that key in this lesson (>= 2 errors, accuracy < 75%)
  // 2. OR overall lesson accuracy is low (< 75%) with errors
  // If overall accuracy is high (>= 90%), keys with 0 or 1 accidental mistake are NEVER flagged!
  detectLessonWeakKeys(keyAttempts = {}, keyErrors = {}, overallAccuracy = 100) {
    // If user achieved stellar accuracy (>= 95%), do not show weak keys unless a key had 3+ errors with < 65% accuracy
    if (overallAccuracy >= 95) {
      const severeFailures = [];
      for (const [char, attempts] of Object.entries(keyAttempts)) {
        const errors = keyErrors[char] || 0;
        if (errors >= 3 && (attempts - errors) / attempts < 0.65) {
          severeFailures.push({
            key: char,
            accuracy: Math.round(((attempts - errors) / attempts) * 100),
            errors,
            total: attempts
          });
        }
      }
      return severeFailures;
    }

    const candidates = [];
    for (const [char, attempts] of Object.entries(keyAttempts)) {
      const errors = keyErrors[char] || 0;
      if (errors >= 2 && attempts >= 3) {
        const accuracy = (attempts - errors) / attempts;
        if (accuracy < 0.75) {
          candidates.push({
            key: char,
            accuracy: Math.round(accuracy * 100),
            errors,
            total: attempts
          });
        }
      }
    }

    // If overall lesson was low (< 75%) and no key had >= 3 attempts, check keys with >= 2 errors
    if (overallAccuracy < 75 && candidates.length === 0) {
      for (const [char, errors] of Object.entries(keyErrors)) {
        if (errors >= 2) {
          const attempts = keyAttempts[char] || errors;
          const accuracy = Math.max(0, (attempts - errors) / attempts);
          if (accuracy < 0.75) {
            candidates.push({
              key: char,
              accuracy: Math.round(accuracy * 100),
              errors,
              total: attempts
            });
          }
        }
      }
    }

    candidates.sort((a, b) => a.accuracy - b.accuracy || b.errors - a.errors);
    return candidates.slice(0, 3);
  }

  // Identify weak keys: min 5 attempts, accuracy < 75%, and at least 2 errors
  getWeakKeys(userId, minAttempts = 5, accuracyThreshold = 0.75) {
    const stats = this.getKeyStats(userId);
    const candidates = [];

    for (const [char, stat] of Object.entries(stats)) {
      const total = (stat.hits || 0) + (stat.errors || 0);
      if (total >= minAttempts && (stat.errors || 0) >= 2) {
        const accuracy = stat.hits / total;
        if (accuracy < accuracyThreshold) {
          candidates.push({
            key: char,
            accuracy: Math.round(accuracy * 100),
            errors: stat.errors,
            total
          });
        }
      }
    }

    // Sort by lowest accuracy first, then by highest error count
    candidates.sort((a, b) => a.accuracy - b.accuracy || b.errors - a.errors);
    return candidates.slice(0, 3); // Return top 3 weakest keys
  }

  // Returns true if user has at least one weak key
  hasWeakKeys(userId) {
    return this.getWeakKeys(userId).length > 0;
  }

  // Generate a progressive 3-stage adaptive drill
  generateDrill(weakKeysList) {
    const targetKeys = (weakKeysList && weakKeysList.length > 0)
      ? weakKeysList.map(k => (typeof k === 'string' ? k : k.key).toLowerCase())
      : ['p', 'q'];

    // Stage 1: Finger Warmup bigrams and triads
    const warmupPatterns = [];
    targetKeys.forEach(k => {
      warmupPatterns.push(`${k}${k}`, `${k}a`, `a${k}`, `${k}e`, `e${k}`);
    });
    if (targetKeys.length >= 2) {
      const k1 = targetKeys[0];
      const k2 = targetKeys[1];
      warmupPatterns.push(`${k1}${k2}`, `${k2}${k1}`, `${k1}${k1}${k2}`, `${k2}${k2}${k1}`, `${k1}${k2}${k1}`);
    }
    const stage1 = warmupPatterns.slice(0, 10).join(' ');

    // Stage 2: Target real words containing target keys
    const targetWords = new Set();
    targetKeys.forEach(k => {
      const list = VOCABULARY_BY_KEY[k] || [];
      list.slice(0, 6).forEach(w => targetWords.add(w));
    });
    const stage2 = Array.from(targetWords).slice(0, 12).join(' ');

    // Stage 3: Natural flow sentence focusing on target letters
    const flowSentences = [];
    targetKeys.forEach(k => {
      if (SAMPLE_SENTENCES_BY_KEY[k]) {
        flowSentences.push(SAMPLE_SENTENCES_BY_KEY[k]);
      }
    });
    if (flowSentences.length === 0) {
      flowSentences.push('Practice builds perfect muscle memory and fluid speed on every key.');
    }
    const stage3 = flowSentences.slice(0, 2).join(' ');

    return `${stage1} ${stage2} ${stage3}`;
  }

  // Clear key stats (useful for tests or account resets)
  clearKeyStats(userId) {
    try {
      localStorage.removeItem(this.getKeyStatsKey(userId));
    } catch {}
  }
}

export const weakKeyManager = new WeakKeyManager();
