import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TextInputProps, ViewStyle, TextStyle } from 'react-native';
import { Config } from '@/constants/Config';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  inputStyle,
  icon,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error ? styles.inputError : null,
          props.multiline ? { height: 100, alignItems: 'flex-start', paddingTop: 10, paddingBottom: 10 } : null,
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[
            styles.input,
            inputStyle,
            props.multiline ? { textAlignVertical: 'top', height: '100%' } : null
          ]}
          placeholderTextColor={Config.theme.colors.textMuted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Config.theme.spacing.md,
    width: '100%',
  },
  label: {
    color: Config.theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Config.theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Config.theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    height: 52,
    paddingHorizontal: Config.theme.spacing.md,
  },
  inputFocused: {
    borderColor: Config.theme.colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.02)',
  },
  inputError: {
    borderColor: Config.theme.colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.02)',
  },
  iconContainer: {
    marginRight: Config.theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: Config.theme.colors.text,
    fontSize: 16,
    height: '100%',
  },
  errorText: {
    color: Config.theme.colors.error,
    fontSize: 12,
    marginTop: Config.theme.spacing.xs,
    fontWeight: '500',
  },
});
