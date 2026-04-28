import React, { useRef } from 'react';
import { View, StyleSheet, Dimensions, PanResponder } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.3;

export function SwipeableCard({ children, onSwipeLeft, onSwipeRight, onSwipeUp }: SwipeableCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      
      // Scale down slightly while dragging
      const distance = Math.sqrt(event.translationX ** 2 + event.translationY ** 2);
      scale.value = Math.max(0.95, 1 - distance / 1000);
    })
    .onEnd((event) => {
      const { translationX, translationY, velocityX, velocityY } = event;
      
      // Check for swipe up (super like)
      if (translationY < -100 && Math.abs(translationX) < 50) {
        translateY.value = withSpring(-screenWidth, { damping: 15 });
        translateX.value = withSpring(0);
        scale.value = withSpring(0.8);
        if (onSwipeUp) runOnJS(onSwipeUp)();
        return;
      }
      
      // Check for horizontal swipes
      if (Math.abs(translationX) > SWIPE_THRESHOLD || Math.abs(velocityX) > 500) {
        const direction = translationX > 0 ? 1 : -1;
        translateX.value = withSpring(direction * screenWidth * 1.5, { damping: 15 });
        translateY.value = withSpring(translationY * 0.2);
        scale.value = withSpring(0.8);
        
        if (direction > 0) {
          runOnJS(onSwipeRight)();
        } else {
          runOnJS(onSwipeLeft)();
        }
      } else {
        // Snap back to center
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-screenWidth / 2, 0, screenWidth / 2],
      [-15, 0, 15]
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  const leftOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      'clamp'
    );

    return {
      opacity,
    };
  });

  const rightOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      'clamp'
    );

    return {
      opacity,
    };
  });

  const upOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      [-100, 0],
      [1, 0],
      'clamp'
    );

    return {
      opacity,
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        {children}
        
        {/* Swipe Overlays */}
        <Animated.View 
          style={[
            styles.overlay, 
            styles.leftOverlay,
            leftOverlayStyle
          ]}
        >
          <View style={styles.overlayContent}>
            <View style={[styles.overlayBadge, styles.nopeBadge]}>
              <Animated.Text style={styles.overlayText}>NOPE</Animated.Text>
            </View>
          </View>
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.overlay, 
            styles.rightOverlay,
            rightOverlayStyle
          ]}
        >
          <View style={styles.overlayContent}>
            <View style={[styles.overlayBadge, styles.likeBadge]}>
              <Animated.Text style={styles.overlayText}>LIKE</Animated.Text>
            </View>
          </View>
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.overlay, 
            styles.upOverlay,
            upOverlayStyle
          ]}
        >
          <View style={styles.overlayContent}>
            <View style={[styles.overlayBadge, styles.superLikeBadge]}>
              <Animated.Text style={styles.overlayText}>SUPER LIKE</Animated.Text>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftOverlay: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  rightOverlay: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  upOverlay: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  overlayContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 3,
  },
  nopeBadge: {
    borderColor: '#FF3B30',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  likeBadge: {
    borderColor: '#34C759',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  superLikeBadge: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  overlayText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
});