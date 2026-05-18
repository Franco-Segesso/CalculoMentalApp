// src/components/LeaderboardModal.js
import React from 'react';
import { View, Text, Modal, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';

const THEME = {
    bg: '#0A0E17', bgCard: '#131A29', primary: '#00CFCF', 
    text: '#FFFFFF', textSub: '#A0AABD', border: '#2A364F'
};

export default function LeaderboardModal({ visible, onClose, onClear, historyData }) {
    const gameModes = [
        { key: 'clasico', label: 'Modo Clásico' },
        { key: 'vof', label: 'Verdadero / Falso' },
        { key: 'choice', label: 'Múltiple Choice' },
        { key: 'reloj', label: 'Contra Reloj' },
    ];

    const difficulties = [
        { key: 'facil', label: 'Fácil' },
        { key: 'medio', label: 'Medio' },
        { key: 'dificil', label: 'Difícil' },
    ];

    const getTop3ForCategory = (modeKey, diffKey) => {
        return historyData
          .filter(item => item.mode === modeKey && item.difficulty === diffKey)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);
    };

    const getMedal = (index) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return '';
    };

    return (
        <Modal visible={visible} animationType="slide">
            <SafeAreaView style={styles.container}>
                <Text style={styles.modalTitle}>🏆 Mejores Resultados </Text>
                
                <ScrollView style={styles.historyScroll} showsVerticalScrollIndicator={false}>
                    {gameModes.map(mode => (
                        <View key={mode.key} style={styles.modeSection}>
                            <Text style={styles.modeHeading}>{mode.label.toUpperCase()}</Text>
                            
                            {difficulties.map(diff => {
                                const topScores = getTop3ForCategory(mode.key, diff.key);
                                return (
                                    <View key={diff.key} style={styles.diffSection}>
                                        <Text style={styles.diffHeading}>{diff.label}</Text>
                                        
                                        {topScores.length > 0 ? (
                                            topScores.map((item, index) => (
                                                <View key={item.id} style={[styles.scoreRow, index === 0 && styles.scoreRowTop]}>
                                                    <View style={styles.scoreLeft}>
                                                        <Text style={styles.medalIcon}>{getMedal(index)}</Text>
                                                        {/* Visualización combinada de Nombre + Puntos */}
                                                        <Text style={[styles.scoreText, index === 0 && styles.scoreTextTop]} numberOfLines={1}>
                                                            {item.name || 'Jugador'} — {item.score} pts
                                                        </Text>
                                                    </View>
                                                    <Text style={styles.scoreDate}>{item.date}</Text>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={styles.emptyText}>Sin registros aún</Text>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    ))}
                </ScrollView>
                
                <View style={styles.row}>
                    <TouchableOpacity style={[styles.btn, {flex: 1, marginRight: 8}]} onPress={onClose}>
                        <Text style={styles.btnText}>Cerrar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.btnDanger, {flex: 1, marginLeft: 8}]} onPress={onClear}>
                        <Text style={[styles.btnText, {color: '#F44336'}]}>Limpiar Datos</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: THEME.bg },
    modalTitle: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginVertical: 20, color: THEME.text },
    historyScroll: { flex: 1, marginBottom: 15 },
    modeSection: { backgroundColor: THEME.bgCard, padding: 20, borderRadius: 25, marginBottom: 25, borderWidth: 1, borderColor: THEME.border },
    modeHeading: { fontSize: 16, fontWeight: '800', color: THEME.primary, letterSpacing: 1.5, marginBottom: 20, textAlign: 'center' },
    diffSection: { marginBottom: 20 },
    diffHeading: { fontSize: 14, fontWeight: '700', color: THEME.textSub, marginBottom: 10, textTransform: 'uppercase' },
    scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: THEME.bg, padding: 15, marginVertical: 4, borderRadius: 15 },
    scoreRowTop: { borderColor: THEME.primary, borderWidth: 1, backgroundColor: '#101F2C' },
    scoreLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
    medalIcon: { fontSize: 20, marginRight: 10 },
    scoreText: { fontSize: 16, fontWeight: 'bold', color: THEME.text, flex: 1 },
    scoreTextTop: { fontSize: 17, color: THEME.primary },
    scoreDate: { fontSize: 12, color: THEME.textSub, fontWeight: '500' },
    emptyText: { fontSize: 14, color: THEME.border, fontStyle: 'italic', marginLeft: 5 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingBottom: 10 },
    btn: { backgroundColor: THEME.bgCard, padding: 18, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: THEME.border },
    btnDanger: { borderColor: '#F44336', backgroundColor: 'rgba(244, 67, 54, 0.1)' },
    btnText: { color: THEME.text, fontWeight: 'bold', fontSize: 16 }
});