import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [targetAngle, setTargetAngle] = useState(0);
  const [userAngle, setUserAngle] = useState(90);
  const [score, setScore] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const svgRef = useRef(null);

  const totalQuestions = 60;

  useEffect(() => {
    generateNewQuestion();
  }, []);

  useEffect(() => {
    const handleGlobalMove = (e) => {
      if (!isDragging || submitted) return;
      
      const pt = svgRef.current.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const cursorPt = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());

      const dx = cursorPt.x - 150;
      const dy = 150 - cursorPt.y; 
      
      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (angle < 0) angle += 360;

      if (angle > 180 && angle < 270) angle = 180;
      if (angle >= 270) angle = 0;

      setUserAngle(Math.round(angle));
    };

    const handleGlobalUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('pointermove', handleGlobalMove);
      window.addEventListener('pointerup', handleGlobalUp);
    }
    return () => {
      window.removeEventListener('pointermove', handleGlobalMove);
      window.removeEventListener('pointerup', handleGlobalUp);
    };
  }, [isDragging, submitted]);

  const generateNewQuestion = () => {
    setTargetAngle(Math.floor(Math.random() * 161) + 10);
    setUserAngle(90);
    setSubmitted(false);
    setMessage('');
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const difference = Math.abs(userAngle - targetAngle);
    if (difference <= 2) {
      setScore(score + 1);
      setMessage(`Correct. Target was ${targetAngle}°. You set ${userAngle}°.`);
    } else {
      setMessage(`Incorrect. Target was ${targetAngle}°. You set ${userAngle}°.`);
    }
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions) {
      setCurrentQuestion(currentQuestion + 1);
      generateNewQuestion();
    }
  };

  const resetTest = () => {
    setCurrentQuestion(1);
    setScore(0);
    generateNewQuestion();
  };

  if (currentQuestion > totalQuestions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded shadow-md text-center max-w-md w-full">
          <h1 className="text-3xl font-bold mb-4">Test Complete</h1>
          <p className="text-xl mb-6">Your final score: {score} / {totalQuestions}</p>
          <button 
            onClick={resetTest}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 w-full font-semibold"
          >
            Restart Test
          </button>
        </div>
      </div>
    );
  }

  const renderProtractor = () => {
    const elements = [];
    
    elements.push(
      <path key="arc" d="M 20 150 A 130 130 0 0 1 280 150" fill="transparent" stroke="black" strokeWidth="2" />
    );
    
    elements.push(
      <line key="baseline" x1="20" y1="150" x2="280" y2="150" stroke="black" strokeWidth="2" />
    );
    
    for (let i = 0; i <= 180; i += 5) {
      const isMajor = i % 10 === 0;
      const length = isMajor ? 15 : 8;
      const rad = i * (Math.PI / 180);
      const x1 = 150 + Math.cos(rad) * 130;
      const y1 = 150 - Math.sin(rad) * 130;
      const x2 = 150 + Math.cos(rad) * (130 - length);
      const y2 = 150 - Math.sin(rad) * (130 - length);
      
      elements.push(
        <line key={`tick-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="black" strokeWidth={isMajor ? 2 : 1} />
      );

      if (i % 30 === 0 || i === 0 || i === 180) {
        const textX = 150 + Math.cos(rad) * 100;
        const textY = 150 - Math.sin(rad) * 100;
        elements.push(
          <text key={`text-${i}`} x={textX} y={textY} fontSize="12" textAnchor="middle" alignmentBaseline="middle" fill="#333">
            {i}°
          </text>
        );
      }
    }
    
    elements.push(<circle key="origin" cx="150" cy="150" r="4" fill="black" />);
    
    const userRad = userAngle * (Math.PI / 180);
    const userX = 150 + Math.cos(userRad) * 130;
    const userY = 150 - Math.sin(userRad) * 130;
    
    elements.push(
      <line key="userline" x1="150" y1="150" x2={userX} y2={userY} stroke="red" strokeWidth="3" />
    );
    
    elements.push(
      <circle 
        key="handle"
        cx={userX} 
        cy={userY} 
        r="15" 
        fill="red" 
        className={`cursor-grab opacity-60 ${isDragging ? 'active:cursor-grabbing opacity-90' : ''}`}
        onPointerDown={() => !submitted && setIsDragging(true)}
      />
    );

    return elements;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 font-sans">
      <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full">
        
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <span className="text-gray-600 font-medium">Question: {currentQuestion} / {totalQuestions}</span>
          <span className="text-gray-600 font-medium">Score: {score}</span>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Drag the red line to exactly {targetAngle}°</h2>
          <p className="text-gray-500 text-sm mt-1">Current selection: {userAngle}°</p>
        </div>

        <div className="flex justify-center mb-8 relative select-none touch-none">
          <svg 
            ref={svgRef} 
            width="300" 
            height="180" 
            viewBox="0 0 300 180" 
            className="bg-transparent overflow-visible"
          >
            {renderProtractor()}
          </svg>
        </div>

        {message && (
          <div className={`p-3 rounded mb-4 text-center font-semibold ${message.includes('Correct') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {!submitted ? (
            <button 
              onClick={handleSubmit}
              className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 transition"
            >
              Submit Answer
            </button>
          ) : (
            <button 
              onClick={currentQuestion === totalQuestions ? () => setCurrentQuestion(totalQuestions + 1) : handleNext}
              className="w-full bg-gray-800 text-white py-3 rounded font-semibold hover:bg-gray-900 transition"
            >
              {currentQuestion === totalQuestions ? 'Finish Test' : 'Next Question'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}