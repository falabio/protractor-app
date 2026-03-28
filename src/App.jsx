import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [targetAngle, setTargetAngle] = useState(0);
  const [userAngle, setUserAngle] = useState(90);
  const [score, setScore] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState(null);
  const svgRef = useRef(null);

  const totalQuestions = 60;
  const progress = (currentQuestion / totalQuestions) * 100;

  useEffect(() => {
    generateNewQuestion();
  }, []);

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging || submitted) return;
      
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      pt.x = clientX;
      pt.y = clientY;
      const cursorPt = pt.matrixTransform(svg.getScreenCTM().inverse());

      const dx = cursorPt.x - 150;
      const dy = 150 - cursorPt.y; 
      
      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (angle < 0) angle += 360;
      if (angle > 180 && angle < 270) angle = 180;
      if (angle >= 270) angle = 0;

      setUserAngle(Math.round(angle));
    };

    const handleUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, submitted]);

  const generateNewQuestion = () => {
    setTargetAngle(Math.floor(Math.random() * 161) + 10);
    setUserAngle(90);
    setSubmitted(false);
    setMessage(null);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const diff = Math.abs(userAngle - targetAngle);
    const isCorrect = diff <= 2;
    if (isCorrect) setScore(s => s + 1);
    setMessage({
      success: isCorrect,
      text: isCorrect ? "Perfect accuracy!" : `Off by ${diff}°.`,
      detail: `Target: ${targetAngle}° | Your set: ${userAngle}°`
    });
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions) {
      setCurrentQuestion(q => q + 1);
      generateNewQuestion();
    }
  };

  const renderProtractor = () => {
    const ticks = [];
    for (let i = 0; i <= 180; i += 1) {
      const isMajor = i % 10 === 0;
      const isMid = i % 5 === 0;
      let length = 5;
      if (isMajor) length = 15;
      else if (isMid) length = 10;
      
      const rad = i * (Math.PI / 180);
      const x1 = 150 + Math.cos(rad) * 130;
      const y1 = 150 - Math.sin(rad) * 130;
      const x2 = 150 + Math.cos(rad) * (130 - length);
      const y2 = 150 - Math.sin(rad) * (130 - length);
      
      ticks.push(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1e293b" strokeWidth={isMajor ? 1.5 : 0.5} />
      );

      if (isMajor && i % 20 === 0) {
        const tx = 150 + Math.cos(rad) * 105;
        const ty = 150 - Math.sin(rad) * 105;
        ticks.push(
          <text key={`t-${i}`} x={tx} y={ty} fontSize="10" fontWeight="600" textAnchor="middle" alignmentBaseline="middle" fill="#475569">
            {i}
          </text>
        );
      }
    }
    
    const userRad = userAngle * (Math.PI / 180);
    const ux = 150 + Math.cos(userRad) * 135;
    const uy = 150 - Math.sin(userRad) * 135;

    return (
      <svg ref={svgRef} viewBox="0 0 300 180" className="w-full h-auto max-w-md drop-shadow-sm select-none touch-none">
        <path d="M 20 150 A 130 130 0 0 1 280 150 L 150 150 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="20" y1="150" x2="280" y2="150" stroke="#1e293b" strokeWidth="2" />
        {ticks}
        <circle cx="150" cy="150" r="4" fill="#1e293b" />
        <line x1="150" y1="150" x2={ux} y2={uy} stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
        <circle 
          cx={ux} cy={uy} r="18" fill="#ef4444" fillOpacity="0.2" className="cursor-grab active:cursor-grabbing"
          onMouseDown={() => !submitted && setIsDragging(true)}
          onTouchStart={() => !submitted && setIsDragging(true)}
        />
        <circle cx={ux} cy={uy} r="6" fill="#ef4444" />
      </svg>
    );
  };

  if (currentQuestion > totalQuestions) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center border border-slate-100">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl font-bold">🏆</div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Quiz Finished</h1>
          <p className="text-slate-500 mb-8">You completed the angle challenge with high precision.</p>
          <div className="bg-slate-50 rounded-2xl p-6 mb-8">
            <span className="block text-slate-400 uppercase tracking-widest text-xs font-bold mb-1">Final Score</span>
            <span className="text-5xl font-black text-slate-900">{score} <span className="text-2xl text-slate-300">/ {totalQuestions}</span></span>
          </div>
          <button onClick={() => window.location.reload()} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-95">Restart Session</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-6 font-sans antialiased text-slate-900">
      <div className="max-w-2xl w-full">
        <div className="mb-8 flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 inline-flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400 leading-none">Accuracy</span>
              <span className="text-xl font-black text-slate-800 leading-none mt-1">{Math.round((score/currentQuestion)*100)}%</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 font-bold text-sm tracking-tight italic">Problem {currentQuestion} of {totalQuestions}</span>
            </div>
          </div>
          <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-blue-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100 mb-6 transition-all">
          <div className="text-center mb-10">
            <h2 className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs mb-3">Objective</h2>
            <p className="text-4xl font-black text-slate-900 leading-tight">Construct an angle of <span className="text-blue-600 underline decoration-blue-200 underline-offset-8 italic">{targetAngle}°</span></p>
          </div>

          <div className="flex justify-center mb-10 relative px-4">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50 opacity-20 pointer-events-none" />
            {renderProtractor()}
            <div className="absolute bottom-[-10px] bg-slate-900 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg">
              {userAngle}° Selected
            </div>
          </div>

          {message && (
            <div className={`mb-6 p-5 rounded-3xl border-2 animate-in fade-in slide-in-from-bottom-4 duration-300 ${message.success ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm ${message.success ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                  {message.success ? '✓' : '!'}
                </div>
                <div>
                  <p className={`font-black text-lg leading-none mb-1 ${message.success ? 'text-emerald-900' : 'text-rose-900'}`}>{message.text}</p>
                  <p className={`text-sm font-medium opacity-70 ${message.success ? 'text-emerald-800' : 'text-rose-800'}`}>{message.detail}</p>
                </div>
              </div>
            </div>
          )}

          {!submitted ? (
            <button 
              onClick={handleSubmit}
              className="group w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-xl hover:bg-black transition-all shadow-[0_15px_30px_-10px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] active:scale-95 active:shadow-none"
            >
              Verify Angle
            </button>
          ) : (
            <button 
              onClick={handleNext}
              className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-xl hover:bg-blue-700 transition-all shadow-[0_15px_30px_-10px_rgba(59,130,246,0.3)] hover:shadow-[0_20px_40px_-10px_rgba(59,130,246,0.4)] active:scale-95"
            >
              Next Challenge
            </button>
          )}
        </div>
        <p className="text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest opacity-50">Precision Educational Engine v4.0</p>
      </div>
    </div>
  );
}