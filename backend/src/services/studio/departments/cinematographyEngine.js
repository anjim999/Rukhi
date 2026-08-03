/**
 * Rukhi Film Engine - Department 2: Cinematography & Visual Language Engine
 * Reasons about camera motivation ("Why is the camera moving?"), emotional lens choices,
 * and visual language rules (Power Loss -> High Angle, Dominance -> Low Angle).
 */

export const cinematographyEngine = {
  async evaluateCameraGrammar({ storyBeats, cameraPreset, aspectRatio = '16:9' }) {
    const emotion = storyBeats?.narrative_tone || 'Intense';

    // Emotional Lens & Angle Reasoning
    let motivatedLens = '50mm Prime (Human Perspective Realism)';
    let motivatedAngle = 'Eye-Level Neutral (Human Connection)';
    let cameraMotivation = 'Camera moves closer because audience should feel protagonist\'s internal breakdown';

    if (emotion.toLowerCase().includes('intense') || emotion.toLowerCase().includes('angry')) {
      motivatedLens = '85mm Portrait (Shallow Depth-of-Field Bokeh Isolation)';
      motivatedAngle = 'Low-Angle 15° Tilt (Tension & Dominance)';
      cameraMotivation = 'Slow optical push-in to capture eye gaze and forehead muscle tension';
    } else if (emotion.toLowerCase().includes('sad') || emotion.toLowerCase().includes('regret')) {
      motivatedLens = '35mm Anamorphic Wide';
      motivatedAngle = 'High-Angle Plunging Overhead (Vulnerability & Isolation)';
      cameraMotivation = 'Camera slowly pulls back to emphasize loneliness in large room';
    }

    return {
      master_aspect_ratio: aspectRatio,
      hero_camera_preset: cameraPreset || '35mm Push-In',
      camera_motivation: cameraMotivation,
      optical_lens_choice: motivatedLens,
      camera_elevation: motivatedAngle,
      visual_language_rules: [
        'Power Lost -> Shift to High-Angle Framing',
        'Relationship Tension -> Over-The-Shoulder Parallax Framing',
        'Emotional Isolation -> Long Lens 85mm + Shallow Depth-of-Field'
      ]
    };
  }
};
