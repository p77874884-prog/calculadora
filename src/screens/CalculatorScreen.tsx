import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import {
  authenticateWithBiometric,
  getRemainingLockoutMs,
  isBiometricEnabled,
  isPinSet,
  setPin,
  verifyPin,
} from '../services/authService';
import { evaluateExpression, formatResult } from '../utils/expression';

type Key =
  | { kind: 'function'; label: string; action: 'clear' | 'backspace' | 'percent' }
  | { kind: 'operator'; label: string; symbol: '+' | '-' | '×' | '÷' }
  | { kind: 'digit'; label: string; wide?: boolean }
  | { kind: 'equals'; label: string };

const KEY_ROWS: Key[][] = [
  [
    { kind: 'function', label: 'C', action: 'clear' },
    { kind: 'function', label: '⌫', action: 'backspace' },
    { kind: 'function', label: '%', action: 'percent' },
    { kind: 'operator', label: '÷', symbol: '÷' },
  ],
  [
    { kind: 'digit', label: '7' },
    { kind: 'digit', label: '8' },
    { kind: 'digit', label: '9' },
    { kind: 'operator', label: '×', symbol: '×' },
  ],
  [
    { kind: 'digit', label: '4' },
    { kind: 'digit', label: '5' },
    { kind: 'digit', label: '6' },
    { kind: 'operator', label: '−', symbol: '-' },
  ],
  [
    { kind: 'digit', label: '1' },
    { kind: 'digit', label: '2' },
    { kind: 'digit', label: '3' },
    { kind: 'operator', label: '+', symbol: '+' },
  ],
  [
    { kind: 'digit', label: '0', wide: true },
    { kind: 'digit', label: '.' },
    { kind: 'equals', label: '=' },
  ],
];

const PIN_PATTERN = /^\d{6}$/;
const MAX_LENGTH = 24;

interface CalculatorScreenProps {
  onUnlock: (pin: string) => Promise<void>;
}

export function CalculatorScreen({ onUnlock }: CalculatorScreenProps) {
  const [expression, setExpression] = useState('');
  const [lastExpression, setLastExpression] = useState('');
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [pendingPin, setPendingPin] = useState<string | null>(null);
  const [bioEnabled, setBioEnabled] = useState(false);
  const bioTriggered = useRef(false);

  useEffect(() => {
    void (async () => {
      if (bioTriggered.current) return;
      const pinSet = await isPinSet();
      const bio = await isBiometricEnabled();
      setBioEnabled(bio);
      if (bio && pinSet) {
        bioTriggered.current = true;
        const ok = await authenticateWithBiometric();
        if (ok) {
          await onUnlock('');
        } else {
          bioTriggered.current = false;
        }
      }
    })();
  }, []);

  const preview = useMemo(() => {
    if (!expression || justEvaluated) {
      return '';
    }
    try {
      return `= ${formatResult(evaluateExpression(expression))}`;
    } catch {
      return '';
    }
  }, [expression, justEvaluated]);

  const resetEntry = () => {
    setExpression('');
    setWaitingForOperand(true);
    setJustEvaluated(false);
  };

  const handlePinAttempt = async (pin: string) => {
    const lockoutMs = await getRemainingLockoutMs();
    if (lockoutMs > 0) {
      resetEntry();
      Alert.alert('Erro de sintaxe', 'Expressao invalida. Verifique a entrada.');
      return;
    }

    const pinIsSet = await isPinSet();
    if (!pinIsSet) {
      if (pendingPin === null) {
        setPendingPin(pin);
        resetEntry();
        Alert.alert(
          'Primeiro acesso',
          'Defina um PIN de 6 digitos. Digite o mesmo PIN novamente e pressione "=" para confirmar.',
        );
        return;
      }
      if (pendingPin === pin) {
        await setPin(pin);
        setPendingPin(null);
        resetEntry();
        Alert.alert('PIN configurado', 'PIN de acesso definido com sucesso.');
        return;
      }
      setPendingPin(null);
      resetEntry();
      Alert.alert('Os PINs nao coincidem', 'Digite o PIN de 6 digitos novamente para configurar.');
      return;
    }

    const result = await verifyPin(pin);
    resetEntry();
    if (result.status === 'success') {
      try {
        await onUnlock(pin);
      } catch {
        Alert.alert('Erro', 'Falha ao desbloquear. Tente novamente.');
      }
    } else {
      Alert.alert('Erro de sintaxe', 'Expressao invalida. Verifique a entrada.');
    }
  };

  const handleEquals = async () => {
    const expr = expression.trim();
    if (!expr) {
      return;
    }
    if (!justEvaluated && PIN_PATTERN.test(expr)) {
      await handlePinAttempt(expr);
      return;
    }
    try {
      const value = evaluateExpression(expr);
      const formatted = formatResult(value);
      setLastExpression(`${expr} =`);
      setExpression(formatted);
      setWaitingForOperand(true);
      setJustEvaluated(true);
    } catch {
      setLastExpression('');
      setExpression('');
      setWaitingForOperand(true);
      setJustEvaluated(false);
      Alert.alert('Erro de sintaxe', 'Nao foi possivel concluir esta operacao.');
    }
  };

  const handleKey = (key: Key) => {
    if (key.kind === 'digit') {
      const token = key.label;
      if (waitingForOperand) {
        setExpression(token);
        setWaitingForOperand(false);
        setJustEvaluated(false);
        return;
      }
      if (expression.length >= MAX_LENGTH) {
        return;
      }
      if (token === '.') {
        const currentNumber = expression.split(/[+\-×÷]/).pop() ?? '';
        if (currentNumber.includes('.')) {
          return;
        }
      }
      setExpression(expression + token);
      setJustEvaluated(false);
      return;
    }

    if (key.kind === 'operator') {
      const symbol = key.symbol;
      if (waitingForOperand) {
        setExpression(expression + symbol);
        setWaitingForOperand(false);
        setJustEvaluated(false);
        return;
      }
      if (expression.length >= MAX_LENGTH) {
        return;
      }
      if (expression === '') {
        if (symbol === '-') {
          setExpression('-');
        }
        return;
      }
      const last = expression[expression.length - 1];
      if (/[+\-×÷]/.test(last)) {
        setExpression(expression.slice(0, -1) + symbol);
      } else {
        setExpression(expression + symbol);
      }
      setJustEvaluated(false);
      return;
    }

    if (key.kind === 'function') {
      if (key.action === 'clear') {
        setExpression('');
        setLastExpression('');
        setWaitingForOperand(false);
        setJustEvaluated(false);
        return;
      }
      if (key.action === 'backspace') {
        if (waitingForOperand) {
          return;
        }
        setExpression(expression.slice(0, -1));
        return;
      }
      if (key.action === 'percent') {
        if (waitingForOperand) {
          return;
        }
        const last = expression[expression.length - 1];
        if (expression !== '' && /[0-9.%]/.test(last)) {
          setExpression(expression + '%');
          setJustEvaluated(false);
        }
        return;
      }
    }

    if (key.kind === 'equals') {
      void handleEquals();
    }
  };

  const renderKey = (key: Key, index: number) => {
    const base = 'h-[72px] items-center justify-center rounded-2xl active:opacity-80';
    let bgColor = '#202C33';
    let textColor = '#E9EDEF';
    let textClass = 'text-[22px] font-medium';
    if (key.kind === 'function') {
      bgColor = '#374045';
      textColor = '#06CF9C';
    } else if (key.kind === 'operator') {
      bgColor = '#2A3942';
      textColor = '#06CF9C';
    } else if (key.kind === 'equals') {
      bgColor = '#005C4B';
      textColor = '#FFFFFF';
      textClass = 'text-[22px] font-bold';
    }
    const width = key.kind === 'digit' && key.wide ? 'flex-[2.1]' : 'flex-1';
    return (
      <TouchableOpacity
        key={index}
        onPress={() => handleKey(key)}
        style={{ backgroundColor: bgColor }}
        className={`${base} ${width}`}
      >
        <Text style={{ color: textColor }} className={textClass}>{key.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ backgroundColor: '#0B1628' }} className="flex-1">
      <View className="flex-1 justify-end px-6 pb-4 pt-10">
        <Text className="mb-2 text-right text-[17px] text-[#8696A0]" numberOfLines={1}>
          {lastExpression}
        </Text>
        <Text
          className="text-right text-[50px] font-light text-[#E9EDEF]"
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {expression || '0'}
        </Text>
        <Text className="mt-2 text-right text-[17px] text-[#06CF9C]/80" numberOfLines={1}>
          {preview}
        </Text>
      </View>

      <View className="px-3 pb-6">
        {KEY_ROWS.map((row, rowIndex) => (
          <View key={rowIndex} className="mb-2 flex-row gap-2">
            {row.map((key, index) => renderKey(key, index))}
          </View>
        ))}
      </View>

      {bioEnabled && (
        <TouchableOpacity
          onPress={async () => {
            const ok = await authenticateWithBiometric();
            if (ok) await onUnlock('');
          }}
          style={{ backgroundColor: '#202C33' }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex-row items-center gap-2 rounded-full px-4 py-2"
        >
          <Ionicons name="finger-print" size={18} color="#06CF9C" />
          <Text className="text-[12px] text-[#8696A0]">Desbloquear com biometria</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
