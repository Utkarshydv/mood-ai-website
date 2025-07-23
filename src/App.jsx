    const emojiMap = {
  JOY: '😄',
  SADNESS: '😢',
  ANGER: '😠',
  FEAR: '😨',
  SURPRISE: '😲',
  DISGUST: '🤢',
  NEUTRAL: '😐',
};
import React, { useState, useEffect } from 'react';

import './App.css';
import {
  MdPsychology, MdMenuOpen, MdMenu, MdDelete,
  MdHistory, MdBarChart,
  MdMargin
} from 'react-icons/md';
import { AiOutlineSend } from 'react-icons/ai';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSidebarHidden, setIsSidebarHidden] = useState(window.innerWidth <= 768);
  const [isLoading, setIsLoading] = useState(false);
  const [loaderText, setLoaderText] = useState('');
  const [emotionHistory, setEmotionHistory] = useState([]);

  useEffect(() => {
    let interval;
    if (isLoading) {
      let dots = '';
      interval = setInterval(() => {
        dots = dots.length < 3 ? dots + '.' : '';
        setLoaderText(`Typing${dots}`);
      }, 500);
    } else {
      setLoaderText('');
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const toggleSidebar = () => {
    setIsSidebarHidden(!isSidebarHidden);
  };

  const generateAIResponse = (msg, sentiment, confidence) => {
    const confidencePercent = (confidence * 100).toFixed(1);

    const emoji = emojiMap[sentiment.toUpperCase()] || '🤖';

    switch (sentiment.toUpperCase()) {
  case 'JOY':
    return `${emoji} I'm glad to hear that! "${msg}" sounds joyful.\n\nConfidence: ${confidencePercent}%`;
  case 'SADNESS':
    return `${emoji} I'm here for you. "${msg}" sounds sad.\n\nConfidence: ${confidencePercent}%`;
  case 'ANGER':
    return `${emoji} It sounds like you're angry. Let's take a breath together.\n\nConfidence: ${confidencePercent}%`;
  case 'FEAR':
    return `${emoji} That seems scary. I'm here to support you.\n\nConfidence: ${confidencePercent}%`;
  case 'SURPRISE':
    return `${emoji} That was unexpected!\n\nConfidence: ${confidencePercent}%`;
  case 'DISGUST':
    return `${emoji} That doesn't sound pleasant.\n\nConfidence: ${confidencePercent}%`;
  case 'NEUTRAL':
    return `${emoji} Thanks for sharing: "${msg}".\n\nConfidence: ${confidencePercent}%`;
  default:
    return `${emoji} Hmm, I'm not sure how to feel about that.\n\nConfidence: ${confidencePercent}%`;
}

  };

const handleSend = async (msg = input) => {
  if (!msg.trim()) return;

  const newMessages = [...messages, { sender: 'user', text: msg }];
  setMessages(newMessages);
  setInput('');
  setIsLoading(true);

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: msg }),
      }
    );

    const result = await response.json();
    if (!Array.isArray(result) || !result[0]) throw new Error('Invalid response');

    // Get top emotion by confidence
    const topEmotion = result[0].reduce((a, b) => (a.score > b.score ? a : b));
    const sentiment = topEmotion.label.toUpperCase();
    const confidence = topEmotion.score;

    const aiReply = generateAIResponse(msg, sentiment, confidence);

    setEmotionHistory((prev) => [...prev, sentiment]);
    setMessages((prev) => [...prev, { sender: 'ai', text: aiReply }]);
  } catch (error) {
    console.error('API error:', error);
    setMessages((prev) => [
      ...prev,
      { sender: 'ai', text: '⚠️ Sorry, something went wrong with the AI.' },
    ]);
  } finally {
    setIsLoading(false);
  }
};

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleClear = () => {
    setMessages([]);
    setEmotionHistory([]);
  };

  const getEmotionCounts = () => {
    const counts = {};
    emotionHistory.forEach((e) => {
      counts[e] = (counts[e] || 0) + 1;
    });
    return counts;
  };

  const emotionCounts = getEmotionCounts();

  return (
    <div className="app">
      <div className={`sidebar ${isSidebarHidden ? 'hidden' : ''}`}>
        <div className="sidebar-header">
          <h2>MoodAI ⚛︎ </h2>
          <button onClick={toggleSidebar}><MdMenuOpen size={15} /></button>
        </div>

        <div className="section">
          <h3><MdDelete /> Clear Chat</h3>
          <button onClick={handleClear}>Clear now</button>
        </div>

        <div className="section">
          <h3><MdHistory /> History</h3>
          <ul className="emotion-history">
            {emotionHistory.length === 0 ? (
              <li>No history yet</li>
            ) : (
              emotionHistory.map((e, i) => {
  const emoji = emojiMap[e.toUpperCase()] || '❓';
  return <li key={i}>{emoji} {e}</li>;
})

            )}
          </ul>
        </div>

        <div className="section">
          <h3><MdBarChart /> Analytics</h3>
          {Object.keys(emotionCounts).length === 0 ? (
            <p>No data</p>
          ) : (
            <div className="analytics">
              <ul>
  {Object.entries(emotionCounts).map(([emotion, count]) => {
    const emoji = emojiMap[emotion.toUpperCase()] || '❓';
    return (
      <li key={emotion}>
        <strong>{emoji} {emotion}:</strong> {count}
      </li>
    );
  })}
</ul>

              <div className="bar-chart">
                {Object.entries(emotionCounts).map(([emotion, count]) => (
                  <div key={emotion} className="bar">
                    <div className="bar-label">{emotion}</div>
                    <div className="bar-fill" style={{ width: `${count * 20}px` }}></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`main ${isSidebarHidden ? 'expanded' : ''}`}>
        {isSidebarHidden && (
          <button className="show-menu" onClick={toggleSidebar}>
            <MdMenu size={20} />
          </button>
        )}

        <div className="chat-box">
          {messages.length === 0 ? (
            <div className="intro">
              <h2>Hello ⚛︎</h2>
              <p>Type in a message for me to analyse your mood...</p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.sender}`}>
                  {msg.text}
                </div>
              ))}
              {isLoading && <div className="message ai"><em>{loaderText}</em></div>}
            </>
          )}
        </div>

        <div className="input-section">
          {messages.length === 0 && (
            <div className="suggestions">
              {['I’m feeling really upbeat and excited today!', 'I’m genuinely scared about today.', 'I’m frustrated and things just aren’t good.'].map((text, i) => (
                <button key={i} onClick={() => {
                  setInput(text);
                  handleSend(text);
                }}>{text}</button>
              ))}
            </div>
          )}
          <div className="input-bar">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
            />
            <button onClick={handleSend}><AiOutlineSend /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;