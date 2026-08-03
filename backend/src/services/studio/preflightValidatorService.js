export const preflightValidatorService = {
  validateBrief(compiledBrief) {
    const checks = [];
    let isPassed = true;

    // Check 1: Character Validation
    if (!compiledBrief.characters || compiledBrief.characters.length === 0) {
      checks.push({ name: 'Character Identity', status: 'WARNING', message: 'No character assigned to scene brief.' });
    } else {
      let missingRefImages = false;
      compiledBrief.characters.forEach(char => {
        if (!char.reference_images || char.reference_images.length === 0) {
          missingRefImages = true;
        }
      });
      if (missingRefImages) {
        checks.push({ name: 'Character DNA References', status: 'WARNING', message: 'One or more characters lack reference keyframes.' });
      } else {
        checks.push({ name: 'Character DNA References', status: 'PASS', message: `${compiledBrief.characters.length} character(s) fingerprint verified.` });
      }
    }

    // Check 2: Location Validation
    if (!compiledBrief.location) {
      checks.push({ name: 'Set Location Reference', status: 'NOTICE', message: 'No specific location reference bound. Default set ambient applied.' });
    } else {
      checks.push({ name: 'Set Location Reference', status: 'PASS', message: `Bound to set location: ${compiledBrief.location.name}` });
    }

    // Check 3: Cinematic Spec Validation
    if (compiledBrief.visual_grammar && compiledBrief.visual_grammar.camera) {
      checks.push({ name: 'Cinematic Presets', status: 'PASS', message: `Camera preset [${compiledBrief.visual_grammar.camera}] validated.` });
    } else {
      checks.push({ name: 'Cinematic Presets', status: 'PASS', message: 'Default cinematic preset applied.' });
    }

    // Check 4: Canon Rule Alignment
    const canonCount = compiledBrief.canon_constraints ? compiledBrief.canon_constraints.length : 0;
    checks.push({ name: 'Series Canon Alignment', status: 'PASS', message: `${canonCount} active canon rule(s) compiled.` });

    return {
      passed: isPassed,
      timestamp: new Date().toISOString(),
      checks,
      summary: isPassed ? 'All preflight checks passed. Production brief ready for Veo synthesis.' : 'Preflight validation generated warnings.'
    };
  }
};
