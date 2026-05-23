


export const generateOperation = (difficulty) => {
    let maxNum;
    let operators = ['+', '-'];

    if (difficulty === 'facil') {
        maxNum = 10;
    } else if (difficulty === 'medio') {
        maxNum = 50;
        operators.push('*');
    } else { // dificil
        maxNum = 100;
        operators.push('*', '/');
    }

    const num1 = Math.floor(Math.random() * maxNum) + 1;
    let num2 = Math.floor(Math.random() * maxNum) + 1;
    const operator = operators[Math.floor(Math.random() * operators.length)];

    // Evitar divisiones con decimales para simplificar el juego
    if (operator === '/') {
        num2 = Math.floor(Math.random() * 10) + 1; 
        const result = num1 * num2; 
        return {
            question: `${result} / ${num2}`,
            correctAnswer: num1
        };
    }

    let correctAnswer;
    switch (operator) {
        case '+': correctAnswer = num1 + num2; break;
        case '-': correctAnswer = num1 - num2; break;
        case '*': correctAnswer = num1 * num2; break;
    }

    return {
        question: `${num1} ${operator} ${num2}`,
        correctAnswer: correctAnswer
    };
};


export const generateMultipleChoiceOptions = (correctAnswer) => {
    const options = new Set([correctAnswer]);
    while (options.size < 4) {
        const offset = Math.floor(Math.random() * 20) - 10;
        if (offset !== 0) options.add(correctAnswer + offset);
    }
    return Array.from(options).sort(() => Math.random() - 0.5); // Mezclar opciones
};


export const calculateScore = (timeSpentMs, maxTimeMs, isCorrect) => {
    // Penalizaciones fijas
    if (!isCorrect) return -30; // Respuesta incorrecta
    if (timeSpentMs >= maxTimeMs) return -50; // Sin respuesta a tiempo

    // Calcula el porcentaje exacto de tiempo que el usuario AHORRÓ.
    // Ej: Si el máximo era 10s y tardó 2s, ahorró 8s (80%).
    const timeSavedPercentage = (maxTimeMs - timeSpentMs) / maxTimeMs;
    
    // El puntaje máximo por velocidad es 100.
    // Multiplicamos 100 por el porcentaje de tiempo ahorrado.
    const points = Math.floor(100 * timeSavedPercentage);

    // Garantizamos un puntaje mínimo de 10 puntos si el usuario respondió
    // correctamente pero en el ultimo segundo, para no darle 0.
    return Math.max(10, points);
};