import React, { useEffect } from 'react';

export interface LandingExperienceProps {
  onComplete: () => void;
  isCompleted: boolean;
}

/**
 * In Design System v1, the Chalk-Dust Shader Hero's initial auto-wipe IS the arrival sequence.
 * This lightweight guard immediately marks arrival ready without a separate blocking modal.
 */
export const LandingExperience: React.FC<LandingExperienceProps> = ({
  onComplete,
  isCompleted,
}) => {
  useEffect(() => {
    if (!isCompleted) {
      onComplete();
    }
  }, [isCompleted, onComplete]);

  return null;
};
