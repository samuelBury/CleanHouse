import React from 'react';
import {StyleSheet, ImageBackground} from 'react-native';

const BackgroundSVG: React.FC = () => {
  return (
    <ImageBackground
      source={require('../../assets/images/background-cerisier.jpeg')}
      style={styles.background}
      resizeMode="cover"
    />
  );
};

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -2,
  },
});

export default BackgroundSVG;
