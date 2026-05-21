// src/screens/MenuScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity } from 'react-native';

const THEME = {
    bg: '#0A0E17', bgCard: '#131A29', primary: '#00CFCF', 
    text: '#FFFFFF', textSub: '#A0AABD', border: '#2A364F'
};

export default function MenuScreen({ navigation }) {
  const [playerName, setPlayerName] = useState('Jugador'); 
  const [difficulty, setDifficulty] = useState('facil'); 
  const [maxIterationsInput, setMaxIterationsInput] = useState('5'); 
  // Nuevos tiempos de inicio oficiales acordes a los mínimos de nivel alto
  const [timeFacil, setTimeFacil] = useState('10');
  const [timeMedio, setTimeMedio] = useState('12'); // Sube de 7 a 12
  const [timeDificil, setTimeDificil] = useState('15'); // Sube de 5 a 15

  const handleDifficultyChange = (selectedDiff) => {
      setDifficulty(selectedDiff);
      setMaxIterationsInput('5');
      setTimeFacil('10');
      setTimeMedio('12'); // Resetea al nuevo default
      setTimeDificil('15'); // Resetea al nuevo default
  };

  const isInputValid = 
    playerName.trim().length > 0 &&
    parseInt(maxIterationsInput) > 0 && parseInt(timeFacil) > 0 && 
    parseInt(timeMedio) > 0 && parseInt(timeDificil) > 0;

  const isEligibleForLeaderboard = 
    maxIterationsInput === '5' && timeFacil === '10' && 
    timeMedio === '12' && timeDificil === '15';

  const getMaxTimeMs = () => {
      if (difficulty === 'facil') return parseInt(timeFacil) * 1000;
      if (difficulty === 'medio') return parseInt(timeMedio) * 1000;
      return parseInt(timeDificil) * 1000;
  };

  return (
    <SafeAreaView style={styles.containerWrapper}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Cálculo Mental</Text>
          
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
                      onPress={() => navigation.navigate('Game', {
                          difficulty, gameMode: mode.key, 
                          maxIterations: parseInt(maxIterationsInput), maxTimeMs: getMaxTimeMs(), 
                          isEligibleForLeaderboard, playerName
                      })}
                      disabled={!isInputValid}
                  >
                      <Text style={styles.gameModeBtnText}>{mode.label}</Text>
                      <Text style={styles.gameModeBtnArrow}>→</Text>
                  </TouchableOpacity>
              ))}
          </View>
          
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => navigation.navigate('Leaderboard')}>
              <Text style={styles.btnText}>Ver Mejores Resultados</Text>
          </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerWrapper: { flex: 1, backgroundColor: THEME.bg },
  container: { padding: 20 },
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
  btn: { backgroundColor: THEME.primary, paddingVertical: 18, borderRadius: 30, alignItems: 'center', marginVertical: 10 },
  btnSecondary: { backgroundColor: 'transparent', borderWidth: 2, borderColor: THEME.primary, marginBottom: 30 },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: THEME.text, fontSize: 18, fontWeight: 'bold' },
  gameModesSection: { padding: 10 },
  gameModeBtn: { backgroundColor: THEME.bg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 25, borderRadius: 15, marginVertical: 6, borderWidth: 1, borderColor: THEME.border },
  gameModeBtnText: { color: THEME.text, fontSize: 18, fontWeight: '600' },
  gameModeBtnArrow: { color: THEME.primary, fontSize: 20, fontWeight: 'bold' }
});