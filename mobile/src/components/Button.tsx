import React from 'react';
import { StyleSheet, Text, ActivityIndicator, Pressable, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Config } from '@/constants/Config';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const isOutline = variant === 'outline';
  const isText = variant === 'text';
  const isSecondary = variant === 'secondary';
  
  const isDisabled = disabled || loading;

  const getGradientColors = () => {
    if (isSecondary) {
      return [Config.theme.colors.secondaryLight, Config.theme.colors.secondary] as const;
    }
    return [Config.theme.colors.primaryLight, Config.theme.colors.primary] as const;
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="small" color={isOutline || isText ? Config.theme.colors.primary : '#FFFFFF'} />;
    }
    return (
      <Text
        style={[
          styles.text,
          isOutline && styles.textOutline,
          isText && styles.textText,
          textStyle,
        ]}
      >
        {title}
      </Text>
    );
  };

  if (isOutline || isText) {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.button,
          isOutline && styles.outline,
          isText && styles.textBtn,
          isDisabled && styles.disabled,
          pressed && styles.pressed,
          style,
        ]}
      >
        {renderContent()}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {renderContent()}
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: Config.theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    overflow: 'hidden',
    marginVertical: Config.theme.spacing.sm,
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outline: {
    borderWidth: 1.5,
    borderColor: Config.theme.colors.primary,
    backgroundColor: 'transparent',
  },
  textBtn: {
    height: 'auto',
    paddingVertical: Config.theme.spacing.sm,
    backgroundColor: 'transparent',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textOutline: {
    color: Config.theme.colors.primary,
  },
  textText: {
    color: Config.theme.colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});
