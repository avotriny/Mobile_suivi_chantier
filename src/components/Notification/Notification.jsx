import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  View
} from 'react-native';
import { useValue } from '../context/ContextProvider';

const { width } = Dimensions.get('window');

const severityColors = {
  info:   '#3498db',
  success:'#27ae60',
  error:  '#e74c3c'
};

export default function Notification() {
  const { state: { alert }, dispatch } = useValue();
  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(-100)).current;
  useEffect(() => {
    if (alert.open) {
      setVisible(true);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true
      }).start();

      // auto-close
      const timer = setTimeout(close, 3500);
      return () => clearTimeout(timer);
    }
  }, [alert.open]);

  const close = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      setVisible(false);
      dispatch({ type: 'UPDATE_ALERT', payload: { open: false, message: '', severity: 'info' } });
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: severityColors[alert.severity] || severityColors.info },
        { transform: [{ translateY }] }
      ]}
    >
      <Text style={styles.message}>{alert.message}</Text>
      <TouchableOpacity onPress={close} style={styles.closeButton}>
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    width: width - 32,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000
  },
  message: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '500'
  },
  closeButton: {
    marginLeft: 12,
    padding: 4
  },
  closeText: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 18
  }
});
