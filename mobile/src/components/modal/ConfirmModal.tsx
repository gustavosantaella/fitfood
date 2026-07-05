import React from 'react';
import { StyleSheet, View, Text, Modal, Pressable } from 'react-native';
import { HelpCircle } from 'lucide-react-native';
import { Config } from '@/constants/Config';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

interface ConfirmModalProps {
  visible: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title = '¿Estás seguro?',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onClose,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Card style={styles.container}>
          {/* Icon Circle */}
          <View style={styles.iconCircle}>
            <HelpCircle size={32} color={Config.theme.colors.secondary} strokeWidth={2} />
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonRow}>
            <Button
              title={cancelText}
              onPress={onClose}
              variant="outline"
              style={styles.halfButton}
            />
            <Button
              title={confirmText}
              onPress={() => {
                onConfirm();
                onClose();
              }}
              variant="primary"
              style={styles.halfButton}
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    width: '85%',
    maxWidth: 340,
    alignItems: 'center',
    padding: Config.theme.spacing.lg,
    borderRadius: Config.theme.borderRadius.xl,
    backgroundColor: Config.theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Config.theme.spacing.md,
  },
  title: {
    color: Config.theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: Config.theme.spacing.sm,
    textAlign: 'center',
  },
  message: {
    color: Config.theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Config.theme.spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  halfButton: {
    flex: 0.48,
    marginVertical: 0,
    height: 48,
  },
});
