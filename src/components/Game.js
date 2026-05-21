// src/components/Game.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { generateOperation, calculateScore, generateMultipleChoiceOptions } from '../utils/gameEngine';
import { useScores } from '../hooks/useScores';
import { SafeAreaView } from 'react-native-safe-area-context';

const THEME = {
    bg: '#0A0E17', bgCard: '#131A29', primary: '#00CFCF', 
    text: '#FFFFFF', textSub: '#A0AABD', border: '#2A364F',     
    correct: '#4CAF50', incorrect: '#F44336'   
};

export default function Game({ route, navigation }) {
    const { difficulty, gameMode, maxIterations, maxTimeMs, isEligibleForLeaderboard, playerName } = route.params;
    const onQuit = () => navigation.goBack();

    const { saveScore } = useScores(); 
    
    const [gameState, setGameState] = useState('playing'); 
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(3);
    const [operation, setOperation] = useState(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [iteration, setIteration] = useState(1);
    const [options, setOptions] = useState([]);
    const [proposedAnswer, setProposedAnswer] = useState(null);
    const [stats, setStats] = useState({ correct: 0, incorrect: 0, totalTime: 0 });

    const shakeAnim = useRef(new Animated.Value(0)).current;
    const flashAnim = useRef(new Animated.Value(0)).current;
    const [flashColor, setFlashColor] = useState('transparent');

    const playCorrectAnimation = () => {
        setFlashColor('rgba(76, 175, 80, 0.4)'); 
        Animated.sequence([
            Animated.timing(flashAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
            Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true })
        ]).start();
    };

    const playIncorrectAnimation = () => {
        setFlashColor('rgba(244, 67, 54, 0.4)'); 
        Animated.parallel([
            Animated.sequence([
                Animated.timing(flashAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
                Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true })
            ]),
            Animated.sequence([
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
            ])
        ]).start();
    };

    const tiempoGlobalReloj = 60; 
    
    let minTimeMs = 1000; 
    if (difficulty === 'medio') minTimeMs = 3000; 
    if (difficulty === 'dificil') minTimeMs = 6000; 

    const currentMaxTimeMs = gameMode === 'reloj' 
        ? maxTimeMs 
        : Math.max(minTimeMs, maxTimeMs - (level - 1) * 1000);

    const handleGameOver = async (finalScore) => {
        setGameState('finished');
        await saveScore(finalScore, gameMode, difficulty, isEligibleForLeaderboard, playerName);
    };

    const restartGame = () => {
        setScore(0);
        setIteration(1);
        setLevel(1);
        setLives(3);
        setStats({ correct: 0, incorrect: 0, totalTime: 0 });
        setGameState('playing');
    };

    const startNextQuestion = (isFirstQuestion = false) => {
        const newOperation = generateOperation(difficulty);
        setOperation(newOperation);
        setUserAnswer('');

        if (gameMode === 'reloj') {
            if (isFirstQuestion) setTimeLeft(tiempoGlobalReloj);
        } else {
            setTimeLeft(currentMaxTimeMs / 1000);
        }

        if (gameMode === 'choice') {
            setOptions(generateMultipleChoiceOptions(newOperation.correctAnswer));
        } else if (gameMode === 'vof') {
            const isTrue = Math.random() > 0.5;
            const fakeAnswer = newOperation.correctAnswer + (Math.floor(Math.random() * 10) + 1) * (Math.random() > 0.5 ? 1 : -1);
            setProposedAnswer(isTrue ? newOperation.correctAnswer : fakeAnswer);
        }
    };

    useEffect(() => {
        if (gameState === 'playing') {
            startNextQuestion(iteration === 1 && level === 1);
        }
    }, [iteration, level, gameState]);

    useEffect(() => {
        if (gameState !== 'playing') return; 

        if (timeLeft <= 0 && operation) {
            if (gameMode === 'reloj') {
                handleGameOver(score);
            } else {
                handleAnswer(true); 
            }
            return;
        }
        
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft, gameState, operation]);

    const handleKeyPress = (key) => {
        if (key === 'del') {
            setUserAnswer(prev => prev.slice(0, -1));
        } else if (key === '-') {
            setUserAnswer(prev => prev.startsWith('-') ? prev.substring(1) : '-' + prev);
        } else {
            if (userAnswer.length < 8) {
                setUserAnswer(prev => prev + key);
            }
        }
    };

    const handleAnswer = (isTimeout = false, overrideIsCorrect = null) => {
        if (gameState !== 'playing' || (gameMode !== 'reloj' && lives <= 0)) return;

        let isCorrect = false;
        const timeSpentMs = gameMode === 'reloj' ? 2000 : (currentMaxTimeMs / 1000 - timeLeft) * 1000;

        if (!isTimeout) {
            if (overrideIsCorrect !== null) {
                isCorrect = overrideIsCorrect;
            } else {
                const parsedAnswer = userAnswer === '-' ? 0 : parseInt(userAnswer);
                isCorrect = parsedAnswer === operation?.correctAnswer;
            }
        }

        if (isCorrect) playCorrectAnimation(); else playIncorrectAnimation();

        const points = calculateScore(timeSpentMs, currentMaxTimeMs, isCorrect);
        const newScore = score + points;
        setScore(newScore);

        setStats(prev => ({
            correct: prev.correct + (isCorrect ? 1 : 0),
            incorrect: prev.incorrect + (isCorrect ? 0 : 1),
            totalTime: prev.totalTime + (timeSpentMs / 1000)
        }));

        if (!isCorrect) {
            // Si estamos en Muerte Súbita (Contra Reloj), un error es el fin del juego inmediato
            if (gameMode === 'reloj') {
                setTimeout(() => handleGameOver(newScore), 300);
                return;
            }
            
            // Si estamos en otros modos, restamos una vida
            const currentLives = lives - 1;
            setLives(currentLives);
            
            if (currentLives <= 0) {
                setTimeout(() => handleGameOver(newScore), 300);
                return;
            }
        }

        if (iteration >= maxIterations && gameMode !== 'reloj') {
            setLevel(prev => prev + 1);
            setIteration(1);
        } else {
            setIteration(prev => prev + 1);
        }
    };

    if (gameState === 'finished') {
        const totalPreguntas = stats.correct + stats.incorrect;
        const tiempoPromedio = totalPreguntas > 0 ? (stats.totalTime / totalPreguntas).toFixed(1) : 0;

        return (
            <SafeAreaView style={[styles.container, styles.finishedContainer]}>
                <Text style={styles.finalTitle}>¡Misión Completada!</Text>
                
                <View style={styles.scoreCircle}>
                    <Text style={styles.scoreLabel}>PUNTAJE FINAL</Text>
                    <Text style={styles.scoreBig}>{score}</Text>
                </View>

                {/* MODIFICACIÓN: Condicional en la grilla final de estadísticas */}
                <View style={styles.statsGrid}>
                    {gameMode !== 'reloj' ? (
                        <View style={styles.statBox}><Text style={styles.statBoxLabel}>NIVEL</Text><Text style={styles.statBoxVal}>{level}</Text></View>
                    ) : (
                        <View style={styles.statBox}><Text style={styles.statBoxLabel}>MODO</Text><Text style={styles.statBoxVal}>Reloj</Text></View>
                    )}
                    <View style={styles.statBox}><Text style={styles.statBoxLabel}>TIEMPO PROM.</Text><Text style={styles.statBoxVal}>{tiempoPromedio}s</Text></View>
                    <View style={[styles.statBox, {borderColor: THEME.correct, borderWidth: 1}]}><Text style={[styles.statBoxLabel, {color: THEME.correct}]}>ACIERTOS</Text><Text style={styles.statBoxVal}>{stats.correct}</Text></View>
                    <View style={[styles.statBox, {borderColor: THEME.incorrect, borderWidth: 1}]}><Text style={[styles.statBoxLabel, {color: THEME.incorrect}]}>ERRORES</Text><Text style={styles.statBoxVal}>{stats.incorrect}</Text></View>
                </View>

                {!isEligibleForLeaderboard && (
                    <Text style={styles.warningFinal}>⚠️ Partida personalizada. No guarda récord.</Text>
                )}

                <View style={styles.finalButtons}>
                    <TouchableOpacity style={[styles.btn, styles.btnCorrect, {marginBottom: 15}]} onPress={restartGame}><Text style={styles.btnText}>Volver a Jugar</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.btnAbandon]} onPress={onQuit}><Text style={styles.btnText}>Ir al Menú</Text></TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (!operation) return null;

    const renderKeyboard = () => {
        const keys = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['-', '0', 'del']];
        return (
            <View style={styles.keyboardContainer}>
                {keys.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.keyboardRow}>
                        {row.map(key => (
                            <TouchableOpacity key={key} style={[styles.keyBtn, key === 'del' && styles.keyBtnSpecial]} onPress={() => handleKeyPress(key)}>
                                <Text style={styles.keyText}>{key === 'del' ? '⌫' : key}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
                <TouchableOpacity style={[styles.btn, { backgroundColor: THEME.primary, marginTop: 10 }]} onPress={() => handleAnswer(false)} disabled={!userAnswer || userAnswer === '-'}>
                    <Text style={[styles.btnText, { color: THEME.bg }]}>Enviar Respuesta</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.containerWrapper}>
            <Animated.View style={[StyleSheet.absoluteFillObject,{borderWidth: 20, borderColor: flashColor, opacity: flashAnim, zIndex: 10, pointerEvents: 'none' }]} />

            <Animated.View style={[styles.container, { transform: [{ translateX: shakeAnim }] }]}>
                {/* MODIFICACIÓN: Cabecera con condicional para Ocultar Nivel */}
                <View style={styles.header}>
                    {gameMode !== 'reloj' ? (
                        <View style={styles.headerGroup}><Text style={styles.statsLabel}>NIVEL</Text><Text style={styles.statsVal}>{level}</Text></View>
                    ) : (
                        <View style={styles.headerGroup} /> 
                    )}
                    <View style={styles.headerMid}>
                        <Text style={styles.timer}>{Math.max(0, timeLeft)}s</Text>
                        {gameMode !== 'reloj' && <Text style={styles.livesText}>{'❤️'.repeat(Math.max(0, lives))}</Text>}
                    </View>
                    <View style={[styles.headerGroup, {alignItems: 'flex-end'}]}><Text style={styles.statsLabel}>PUNTOS</Text><Text style={styles.statsVal}>{score}</Text></View>
                </View>
                
                <View style={styles.operationWrapper}>
                    <View style={styles.operationCard}>
                        <Text style={styles.operationCardLabel}>
                            {gameMode === 'reloj' ? 'Muerte Súbita' : 'Calcula'}
                        </Text>
                        {gameMode === 'vof' ? (
                            <>
                                <Text style={styles.question}>{operation.question}</Text>
                                <View style={styles.divider} />
                                <Text style={styles.proposedAnswerText}>¿ {proposedAnswer} ?</Text>
                            </>
                        ) : (
                            <Text style={styles.question}>{operation.question}</Text>
                        )}
                    </View>
                </View>
                
                <View style={styles.controls}>
                    {(gameMode === 'clasico' || gameMode === 'reloj') && (
                        <View style={styles.customInputWrapper}>
                            <View style={styles.inputDisplay}>
                                <Text style={[styles.inputText, !userAnswer && {color: THEME.border}]}>
                                    {userAnswer || '?'}
                                </Text>
                            </View>
                            {renderKeyboard()}
                        </View>
                    )}

                    {gameMode === 'vof' && (
                        <View style={styles.rowButtons}>
                             <View style={{flex: 1, marginRight: 6}}>
                                 <TouchableOpacity style={[styles.btn, styles.btnResponse, styles.btnCorrect]} onPress={() => handleAnswer(false, proposedAnswer === operation.correctAnswer)}>
                                     <Text style={styles.btnText}>Verdadero</Text>
                                 </TouchableOpacity>
                             </View>
                             <View style={{flex: 1, marginLeft: 6}}>
                                 <TouchableOpacity style={[styles.btn, styles.btnResponse, styles.btnIncorrect]} onPress={() => handleAnswer(false, proposedAnswer !== operation.correctAnswer)}>
                                     <Text style={styles.btnText}>Falso</Text>
                                 </TouchableOpacity>
                             </View>
                        </View>
                    )}

                    {gameMode === 'choice' && (
                        <View style={styles.choiceGrid}>
                            {options.map((opt, index) => (
                                <View key={index} style={styles.choiceWrapper}>
                                    <TouchableOpacity style={[styles.btn, styles.btnResponse]} onPress={() => handleAnswer(false, opt === operation.correctAnswer)}>
                                        <Text style={styles.btnText}>{opt.toString()}</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
                
                {(gameMode === 'vof' || gameMode === 'choice') && (
                    <TouchableOpacity style={[styles.btn, styles.btnAbandon]} onPress={onQuit}><Text style={styles.btnText}>Abandonar Partida</Text></TouchableOpacity>
                )}
                {(gameMode === 'clasico' || gameMode === 'reloj') && (
                    <TouchableOpacity style={{alignItems: 'center', marginTop: 15, padding: 10}} onPress={onQuit}><Text style={{color: THEME.textSub, fontWeight: 'bold'}}>Abandonar Partida</Text></TouchableOpacity>
                )}
            </Animated.View>
        </SafeAreaView>

    );
}

const styles = StyleSheet.create({
    containerWrapper: { flex: 1, backgroundColor: THEME.bg },
    container: { flex: 1, padding: 15, justifyContent: 'space-between' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: THEME.border },
    headerGroup: { alignItems: 'flex-start', width: 80 }, // Ancho fijo simétrico para mantener el reloj centrado
    headerMid: { alignItems: 'center' },
    statsLabel: { fontSize: 12, color: THEME.textSub, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
    statsVal: { fontSize: 20, fontWeight: 'bold', color: THEME.text },
    timer: { fontSize: 32, color: THEME.primary, fontWeight: 'bold' },
    livesText: { fontSize: 16, marginTop: -5 },
    operationWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }, 
    operationCard: { backgroundColor: THEME.bgCard, width: '100%', paddingVertical: 25, paddingHorizontal: 20, borderRadius: 25, borderWidth: 2, borderColor: THEME.border, alignItems: 'center', justifyContent: 'center', elevation: 4 },
    operationCardLabel: { color: THEME.primary, fontSize: 12, fontWeight: '800', letterSpacing: 4, marginBottom: 10, textTransform: 'uppercase', opacity: 0.6 },
    question: { fontSize: 80, textAlign: 'center', fontWeight: 'bold', color: THEME.text, lineHeight: 85 }, 
    divider: { width: '40%', height: 2, backgroundColor: THEME.border, marginVertical: 10 },
    proposedAnswerText: { fontSize: 50, color: THEME.textSub, fontWeight: 'bold', textAlign: 'center' },
    controls: { width: '100%', alignItems: 'center', paddingBottom: 10 }, 
    rowButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
    choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', justifyContent: 'center' },
    choiceWrapper: { width: '50%', padding: 4 },
    customInputWrapper: { alignItems: 'center', width: '100%' },
    inputDisplay: { backgroundColor: THEME.bgCard, width: '100%', borderRadius: 15, borderWidth: 2, borderColor: THEME.border, alignItems: 'center', paddingVertical: 8, marginBottom: 8 },
    inputText: { fontSize: 36, color: THEME.text, fontWeight: 'bold' },
    keyboardContainer: { width: '100%', maxWidth: 350 },
    keyboardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    keyBtn: { backgroundColor: THEME.bgCard, flex: 1, marginHorizontal: 3, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: THEME.border },
    keyBtnSpecial: { backgroundColor: '#2A364F' },
    keyText: { color: THEME.text, fontSize: 20, fontWeight: 'bold' },
    btn: { paddingVertical: 14, borderRadius: 15, alignItems: 'center', elevation: 3, marginVertical: 5, width: '100%' },
    btnResponse: { backgroundColor: THEME.bgCard, borderWidth: 1, borderColor: THEME.border, width: '100%' },
    btnDisabled: { opacity: 0.4 },
    btnText: { color: THEME.text, fontSize: 16, fontWeight: 'bold' },
    btnCorrect: { backgroundColor: THEME.correct, borderColor: THEME.correct },
    btnIncorrect: { backgroundColor: THEME.incorrect, borderColor: THEME.incorrect },
    btnAbandon: { backgroundColor: '#37474F', marginTop: 5 },
    finishedContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 15 },
    finalTitle: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: THEME.text, marginBottom: 20 },
    scoreCircle: { alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.bgCard, paddingVertical: 30, borderRadius: 25, marginBottom: 20, borderWidth: 2, borderColor: THEME.primary, elevation: 5 },
    scoreLabel: { color: THEME.textSub, fontSize: 14, fontWeight: 'bold', letterSpacing: 2, marginBottom: 5 },
    scoreBig: { fontSize: 70, fontWeight: 'bold', color: THEME.primary },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
    statBox: { backgroundColor: THEME.bgCard, width: '48%', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 15, elevation: 2 },
    statBoxLabel: { fontSize: 12, color: THEME.textSub, fontWeight: 'bold', letterSpacing: 1, marginBottom: 5 },
    statBoxVal: { fontSize: 28, fontWeight: 'bold', color: THEME.text },
    warningFinal: { color: THEME.incorrect, textAlign: 'center', marginBottom: 25, fontWeight: 'bold', fontSize: 14 },
    finalButtons: { width: '100%', marginTop: 10 }
});