import React from 'react';
import Svg, { Defs, LinearGradient, Stop, G, Path, Circle } from 'react-native-svg';

interface BackgroundSVGProps {
  width?: number;
  height?: number;
}

const BackgroundSVG: React.FC<BackgroundSVGProps> = () => {
  return (
    <Svg width="525" height="982" viewBox="0 0 525 982">
      <Defs>
        <LinearGradient id="linear-gradient" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#e8f5ff" />
          <Stop offset="0.5" stopColor="#fff9f0" />
          <Stop offset="1" stopColor="#fefefe" />
        </LinearGradient>
      </Defs>
      <G transform="translate(45, 50)">
        <Path d="M0,0H430V932H0Z" fill="url(#linear-gradient)" />
      </G>
      <G transform="translate(325, 0)">
        <Circle cx="100" cy="100" r="100" fill="#ffe5d9" opacity="0.6" />
      </G>
      <G transform="translate(0, 325)">
        <Circle cx="75" cy="75" r="75" fill="#c5f2d8" opacity="0.6" />
      </G>
      <G transform="translate(345, 610)">
        <Circle cx="90" cy="90" r="90" fill="#ffe5d9" opacity="0.6" />
      </G>
    </Svg>
  );
};

export default BackgroundSVG;
