import React from 'react';
import styles from './AuroraBackground.module.css';

interface AuroraBackgroundProps {
  isResonating: boolean;
}

const AuroraBackground: React.FC<AuroraBackgroundProps> = ({ isResonating }) => {
  return (
    <div className={`${styles.auroraContainer} ${isResonating ? styles.resonating : ''}`}>
      <div className={styles.starField}></div>
      <div className={styles.auroraWave}></div>
      <div className={styles.auroraWave}></div>
      <div className={styles.auroraWave}></div>
    </div>
  );
};

export default AuroraBackground;
