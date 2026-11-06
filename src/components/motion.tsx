import { useEffect, useMemo, useState } from 'react';
import { Pressable, type PressableProps, type ViewProps } from 'react-native';
import Animated, {
  cancelAnimation, Easing, FadeIn, LinearTransition, ReduceMotion,
  useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSpring, withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const easing = Easing.bezier(0.22, 1, 0.36, 1);
export const motionLayout = LinearTransition.duration(240).easing(easing).reduceMotion(ReduceMotion.System);

export function MotionView({ delay = 0, distance = 12, style, ...props }: ViewProps & { delay?: number; distance?: number }) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    progress.set(withDelay(delay, withTiming(1, {
      duration: 280, easing, reduceMotion: ReduceMotion.System,
    }), ReduceMotion.System));
    return () => cancelAnimation(progress);
  }, [delay, progress]);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.get(), transform: [{ translateY: (1 - progress.get()) * distance }],
  }));
  return <Animated.View {...props} style={[style, animatedStyle]} />;
}

/** Keep the Pressable itself in the layout so flex/grid and touch targets do not change. */
export function MotionPressable({ style, onPressIn, onPressOut, onHoverIn, onHoverOut, enterDelay, ...props }: PressableProps & { enterDelay?: number }) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const entering = useMemo(() => enterDelay === undefined ? undefined
    : FadeIn.duration(260).delay(enterDelay).easing(easing).reduceMotion(ReduceMotion.System), [enterDelay]);
  return <AnimatedPressable {...props} entering={entering}
    style={[typeof style === 'function' ? style({ pressed, hovered }) : style, animatedStyle]}
    onHoverIn={event => { setHovered(true); onHoverIn?.(event); }}
    onHoverOut={event => { setHovered(false); onHoverOut?.(event); }}
    onPressIn={event => {
      setPressed(true);
      scale.set(withTiming(0.975, { duration: 90, reduceMotion: ReduceMotion.System }));
      onPressIn?.(event);
    }}
    onPressOut={event => {
      setPressed(false);
      scale.set(withSpring(1, { damping: 20, stiffness: 280, reduceMotion: ReduceMotion.System }));
      onPressOut?.(event);
    }} />;
}

export function FloatingView({ active = true, style, ...props }: ViewProps & { active?: boolean }) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(0);
    if (!active || reducedMotion) return;
    progress.set(withRepeat(withTiming(1, {
      duration: 1800, easing: Easing.inOut(Easing.sin), reduceMotion: ReduceMotion.System,
    }), -1, true, undefined, ReduceMotion.System));
    return () => cancelAnimation(progress);
  }, [active, reducedMotion, progress]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -4 * progress.get() }, { scale: 1 + progress.get() * 0.02 }],
  }));
  return <Animated.View {...props} style={[style, animatedStyle]} />;
}
