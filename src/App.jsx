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
      <svg ref={svgRef} viewBox="0 0 300 180" style={{ width: '100%', height: 'auto', display: 'block' }} className="select-none touch-none">
        <path d="M 20 150 A 130 130 0 0 1 280 150 L 150 150 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="20" y1="150" x2="280" y2="150" stroke="#1e293b" strokeWidth="2" />
        {ticks}
        <circle cx="150" cy="150" r="4" fill="#1e293b" />
        <line x1="150" y1="150" x2={ux} y2={uy} stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
        <circle 
          cx={ux} cy={uy} r="18" fill="#ef4444" fillOpacity="0.2" style={{ cursor: 'grab' }}
          onMouseDown={() => !submitted && setIsDragging(true)}
          onTouchStart={() => !submitted && setIsDragging(true)}
        />
        <circle cx={ux} cy={uy} r="6" fill="#ef4444" />
      </svg>
    );
  };

  if (currentQuestion > totalQuestions) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '40px', maxWidth: '448px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', marginBottom: '8px' }}>Quiz Finished</h1>
          <p style={{ color: '#64748b', marginBottom: '32px' }}>Final Score: {score} / {totalQuestions}</p>
          <button onClick={() => window.location.reload()} style={{ width: '100%', backgroundColor: '#0f172a', color: 'white', padding: '16px', borderRadius: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Restart Session</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '600px', width: '100%' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ backgroundColor: 'white', padding: '8px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', display: 'block' }}>ACCURACY</span>
              <span style={{ fontSize: '20px', fontWeight: '900' }}>{Math.round((score/currentQuestion)*100)}%</span>
            </div>
            <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>Problem {currentQuestion} of {totalQuestions}</span>
          </div>
          <div style={{ height: '12px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ height: '100%', backgroundColor: '#3b82f6', width: `${progress}%`, transition: 'width 0.5s' }} />
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '40px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '32px', border: '1px solid #f1f5f9' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '12px', color: '#94a3b8', letterSpacing: '2.4px', marginBottom: '12px' }}>OBJECTIVE</h2>
            <p style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a' }}>Construct an angle of <span style={{ color: '#3b82f6', textDecoration: 'underline' }}>{targetAngle}°</span></p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px', position: 'relative' }}>
            <div style={{ width: '100%', maxWidth: '400px' }}>
              {renderProtractor()}
            </div>
            <div style={{ position: 'absolute', bottom: '-20px', backgroundColor: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: '900' }}>
              {userAngle}° Selected
            </div>
          </div>

          {message && (
            <div style={{ marginBottom: '24px', padding: '20px', borderRadius: '24px', border: '2px solid', backgroundColor: message.success ? '#ecfdf5' : '#fef2f2', borderColor: message.success ? '#d1fae5' : '#fee2e2' }}>
              <p style={{ fontWeight: '900', color: message.success ? '#064e3b' : '#7f1d1d' }}>{message.text}</p>
              <p style={{ fontSize: '14px', color: message.success ? '#065f46' : '#991b1b' }}>{message.detail}</p>
            </div>
          )}

          {!submitted ? (
            <button onClick={handleSubmit} style={{ width: '100%', backgroundColor: '#0f172a', color: 'white', padding: '20px', borderRadius: '24px', fontWeight: '900', fontSize: '20px', border: 'none', cursor: 'pointer', transition: 'transform 0.1s' }}>Verify Angle</button>
          ) : (
            <button onClick={handleNext} style={{ width: '100%', backgroundColor: '#2563eb', color: 'white', padding: '20px', borderRadius: '24px', fontWeight: '900', fontSize: '20px', border: 'none', cursor: 'pointer' }}>Next Challenge</button>
          )}
        </div>
      </div>
    </div>
  );
}