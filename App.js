// App.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import Game from './src/components/Game';
import LeaderboardModal from './src/components/LeaderboardModal';
import { useScores } from './src/hooks/useScores';

const THEME = {
    bg: '#0A0E17', bgCard: '#131A29', primary: '#00CFCF', 
    text: '#FFFFFF', textSub: '#A0AABD', border: '#2A364F'
};

export default function App() {
  const { historyData, loadHistory, clearHistory } = useScores();
  
  // Nuevo estado para registrar quién juega
  const [playerName, setPlayerName] = useState('Jugador'); 
  
  const [difficulty, setDifficulty] = useState('facil'); 
  const [gameMode, setGameMode] = useState(null); 
  const [maxIterationsInput, setMaxIterationsInput] = useState('5'); 
  const [timeFacil, setTimeFacil] = useState('10');
  const [timeMedio, setTimeMedio] = useState('7');
  const [timeDificil, setTimeDificil] = useState('5');

  const [isPlaying, setIsPlaying] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // FUNCIÓN CLAVE: Devuelve todo a valores por defecto al cambiar la solapa de dificultad
  const handleDifficultyChange = (selectedDiff) => {
      setDifficulty(selectedDiff);
      setMaxIterationsInput('5');
      setTimeFacil('10');
      setTimeMedio('7');
      setTimeDificil('5');
  };

  const handleOpenHistory = async () => {
    await loadHistory();
    setShowHistory(true);
  };

  // Validar también que el nombre no esté en blanco antes de prender los botones
  const isInputValid = 
    playerName.trim().length > 0 &&
    parseInt(maxIterationsInput) > 0 && parseInt(timeFacil) > 0 && 
    parseInt(timeMedio) > 0 && parseInt(timeDificil) > 0;

  const isEligibleForLeaderboard = 
    maxIterationsInput === '5' && timeFacil === '10' && 
    timeMedio === '7' && timeDificil === '5';

  const getMaxTimeMs = () => {
      if (difficulty === 'facil') return parseInt(timeFacil) * 1000;
      if (difficulty === 'medio') return parseInt(timeMedio) * 1000;
      return parseInt(timeDificil) * 1000;
  };

  const AppButton = ({ title, onPress, disabled, secondary }) => (
      <TouchableOpacity 
          style={[styles.btn, secondary && styles.btnSecondary, disabled && styles.btnDisabled]} 
          onPress={onPress} disabled={disabled}
      >
          <Text style={styles.btnText}>{title}</Text>
      </TouchableOpacity>
  );

  if (!isPlaying) {
    return (
      <SafeAreaView style={styles.containerWrapper}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Cálculo Mental</Text>
            
            {/* NUEVA SECCIÓN: Caja de texto para el Nombre del Jugador */}
            <View style={styles.section}>
                <Text style={styles.subtitle}>Nombre del Jugador</Text>
                <TextInput 
                    style={[styles.input, {textAlign: 'left', fontSize: 18, paddingHorizontal: 15}]} 
                    value={playerName} 
                    onChangeText={setPlayerName} 
                    placeholder="Escribe tu alias..." 
                    placeholderTextColor={THEME.border}
                    maxLength={15}
                />
            </View>

            {/* Selector de Dificultad (Llama a handleDifficultyChange) */}
            <View style={styles.section}>
                <Text style={styles.subtitle}>Dificultad</Text>
                <View style={styles.row}>
                    {['facil', 'medio', 'dificil'].map(d => (
                        <TouchableOpacity 
                            key={d} 
                            style={[styles.tabBtn, difficulty === d && styles.tabBtnActive]} 
                            onPress={() => handleDifficultyChange(d)}
                        >
                            <Text style={[styles.tabText, difficulty === d && styles.tabTextActive]}>
                                {d === 'facil' ? 'Fácil' : d === 'medio' ? 'Medio' : 'Difícil'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Panel de Configuración Temporal de Rondas y Tiempos */}
            <View style={styles.row}>
                <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.subtitle}>Rondas</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={maxIterationsInput} onChangeText={setMaxIterationsInput} />
                </View>
                <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.subtitle}>Tiempo (seg)</Text>
                    {difficulty === 'facil' && <TextInput style={styles.input} keyboardType="numeric" value={timeFacil} onChangeText={setTimeFacil} />}
                    {difficulty === 'medio' && <TextInput style={styles.input} keyboardType="numeric" value={timeMedio} onChangeText={setTimeMedio} />}
                    {difficulty === 'dificil' && <TextInput style={styles.input} keyboardType="numeric" value={timeDificil} onChangeText={setTimeDificil} />}
                </View>
            </View>

            {!isEligibleForLeaderboard && (
                <Text style={styles.warningText}>⚠️ Valores modificados. No guardará récord.</Text>
            )}

            {/* Modos de Juego */}
            <View style={[styles.section, styles.gameModesSection]}>
                <Text style={styles.subtitle}>Selecciona Modo</Text>
                {[
                    { key: 'clasico', label: 'Modo Clásico' },
                    { key: 'vof', label: 'Verdadero / Falso' },
                    { key: 'choice', label: 'Múltiple Choice' },
                    { key: 'reloj', label: 'Contra Reloj' }
                ].map(mode => (
                    <TouchableOpacity 
                        key={mode.key}
                        style={[styles.gameModeBtn, !isInputValid && styles.btnDisabled]}
                        onPress={() => { setGameMode(mode.key); setIsPlaying(true); }}
                        disabled={!isInputValid}
                    >
                        <Text style={styles.gameModeBtnText}>{mode.label}</Text>
                        <Text style={styles.gameModeBtnArrow}>→</Text>
                    </TouchableOpacity>
                ))}
            </View>
            
            <View style={{marginTop: 10, marginBottom: 30}}>
                <AppButton title="Ver Mejores Resultados" onPress={handleOpenHistory} secondary />
            </View>

            <LeaderboardModal visible={showHistory} onClose={() => setShowHistory(false)} onClear={clearHistory} historyData={historyData} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.gameContainer}>
      <Game 
        difficulty={difficulty} gameMode={gameMode} 
        maxIterations={parseInt(maxIterationsInput)} maxTimeMs={getMaxTimeMs()} 
        isEligibleForLeaderboard={isEligibleForLeaderboard} playerName={playerName}
        onQuit={() => setIsPlaying(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerWrapper: { flex: 1, backgroundColor: THEME.bg },
  container: { padding: 20 },
  gameContainer: { flex: 1, backgroundColor: THEME.bg },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginVertical: 25, color: THEME.primary },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 12, fontWeight: '700', color: THEME.textSub, textTransform: 'uppercase', letterSpacing: 1 },
  section: { marginBottom: 20, backgroundColor: THEME.bgCard, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: THEME.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  warningText: { color: THEME.primary, textAlign: 'center', marginBottom: 20, fontSize: 13, fontWeight: 'bold' },
  input: { backgroundColor: THEME.bg, fontSize: 24, padding: 15, borderRadius: 15, textAlign: 'center', borderWidth: 1, borderColor: THEME.border, color: THEME.text, fontWeight: 'bold' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10, marginHorizontal: 2 },
  tabBtnActive: { backgroundColor: THEME.primary },
  tabText: { color: THEME.textSub, fontWeight: '600' },
  tabTextActive: { color: THEME.bg },
  btn: { backgroundColor: THEME.primary, paddingVertical: 18, borderRadius: 30, alignItems: 'center', elevation: 3, marginVertical: 10 },
  btnSecondary: { backgroundColor: 'transparent', borderWidth: 2, borderColor: THEME.primary },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: THEME.text, fontSize: 18, fontWeight: 'bold' },
  gameModesSection: { padding: 10 },
  gameModeBtn: { backgroundColor: THEME.bg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 25, borderRadius: 15, marginVertical: 6, borderWidth: 1, borderColor: THEME.border },
  gameModeBtnText: { color: THEME.text, fontSize: 18, fontWeight: '600' },
  gameModeBtnArrow: { color: THEME.primary, fontSize: 20, fontWeight: 'bold' }
});