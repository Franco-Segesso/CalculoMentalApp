// src/hooks/useScores.js
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useScores = () => {
    const [historyData, setHistoryData] = useState([]);

    const loadHistory = async () => {
        try {
            const data = await AsyncStorage.getItem('@historial_puntajes');
            if (data) setHistoryData(JSON.parse(data));
        } catch (error) {
            console.error(error);
        }
    };

    const clearHistory = async () => {
        await AsyncStorage.removeItem('@historial_puntajes');
        setHistoryData([]);
    };

    // Agregamos playerName al guardado local
    const saveScore = async (finalScore, gameMode, difficulty, isEligible, playerName) => {
        if (!isEligible) return; 

        try {
            const storedHistory = await AsyncStorage.getItem('@historial_puntajes');
            let history = storedHistory ? JSON.parse(storedHistory) : [];
            
            history.push({
                id: Date.now().toString(),
                score: finalScore,
                mode: gameMode,
                difficulty: difficulty,
                date: new Date().toLocaleDateString(),
                name: playerName.trim() || 'Jugador' // Registro del nombre
            });

            const modesList = ['clasico', 'vof', 'choice', 'reloj'];
            const diffsList = ['facil', 'medio', 'dificil'];
            let optimizedHistory = [];

            modesList.forEach(m => {
                diffsList.forEach(d => {
                    const filtered = history
                        .filter(item => item.mode === m && item.difficulty === d)
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 5); 
                    optimizedHistory = [...optimizedHistory, ...filtered];
                });
            });

            await AsyncStorage.setItem('@historial_puntajes', JSON.stringify(optimizedHistory));
        } catch (error) {
            console.error("Error guardando el historial", error);
        }
    };

    return { historyData, loadHistory, clearHistory, saveScore };
};