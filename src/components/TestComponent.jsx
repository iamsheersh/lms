import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { saveTestResult } from '../services/databaseService';

const TestComponent = ({ topic, test, onTestComplete, onClose }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [loading, setLoading] = useState(false);

  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    setSelectedAnswers({});
    setCurrentQuestion(0);
    setShowResults(false);
    setTestStarted(false);
    setTimeSpent(0);

    if (test?.questions?.length) {
      const normalized = test.questions.map((q, idx) => ({
        id: q.id ?? idx,
        question: q.question,
        options: q.options || [],
        type: q.type || 'mcq',
        correctOption: q.correctOption
      }));
      setQuestions(normalized);
      return;
    }

    setQuestions([]);
  }, [test]);

  // Timer
  useEffect(() => {
    let interval;
    if (testStarted && !showResults) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [testStarted, showResults]);

  const handleAnswerSelect = (questionId, answerIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    let total = 0;

    questions.forEach(question => {
      if (question.type === 'text') return;
      if (!Array.isArray(question.options) || question.options.length === 0) return;

      total++;
      if (selectedAnswers[question.id] === question.correctOption) {
        correct++;
      }
    });

    const safeTotal = total === 0 ? questions.length : total;
    const score = safeTotal === 0 ? 0 : Math.round((correct / safeTotal) * 100);
    return {
      score,
      correct,
      total: safeTotal,
      timeSpent: Math.floor(timeSpent / 60)
    };
  };

  const handleSubmitTest = async () => {
    setLoading(true);
    try {
      const results = calculateScore();
      
      // Get current user from Firebase auth
      const { auth } = await import('../firebase');
      const user = auth.currentUser;
      
      if (user) {
        await saveTestResult(user.uid, {
          testId: test?.id,
          testName: test?.test_name || `${topic?.name || 'Topic'} Test`,
          topic: test?.topic || topic?.name || 'General',
          score: results.score,
          totalQuestions: results.total,
          timeSpent: results.timeSpent,
          answers: selectedAnswers
        });
        
        setShowResults(true);
        if (onTestComplete) {
          onTestComplete(results);
        }
      }
    } catch (error) {
      console.error('Error saving test results:', error);
      alert('Error saving test results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!topic) return null;

  const question = questions[currentQuestion];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{test?.test_name || `${topic.name} Test`}</h2>
            <p className="text-sm text-slate-600">
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {!testStarted && (
              <div className="flex items-center gap-2 text-slate-600">
                <Clock size={16} />
                <span className="font-mono">{formatTime(timeSpent)}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Test Content */}
        <div className="p-6">
          {!testStarted ? (
            /* Start Screen */
            <div className="text-center py-12">
              <AlertCircle className="mx-auto mb-4 text-blue-500" size={48} />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to start the test?</h3>
              <p className="text-slate-600 mb-6">
                This test contains {questions.length} questions and has no time limit.
              </p>
              <button
                onClick={() => setTestStarted(true)}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
              >
                Start Test
              </button>
            </div>
          ) : showResults ? (
            /* Results Screen */
            <div className="text-center py-8">
              <div className="mb-6">
                {calculateScore().score >= 70 ? (
                  <CheckCircle className="mx-auto mb-4 text-green-500" size={64} />
                ) : (
                  <XCircle className="mx-auto mb-4 text-red-500" size={64} />
                )}
                <h3 className="text-2xl font-bold text-slate-800 mb-2">
                  Test Completed!
                </h3>
                <div className="text-5xl font-bold mb-4">
                  {calculateScore().score}%
                </div>
                <p className="text-slate-600 mb-2">
                  You got {calculateScore().correct} out of {calculateScore().total} questions correct
                </p>
                <p className="text-slate-600">
                  Time spent: {calculateScore().timeSpent} minutes
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={onClose}
                  className="bg-slate-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setCurrentQuestion(0);
                    setSelectedAnswers({});
                    setShowResults(false);
                    setTestStarted(false);
                    setTimeSpent(0);
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                  Retake Test
                </button>
              </div>
            </div>
          ) : question ? (
            /* Question Screen */
            <div>
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                    {currentQuestion + 1}
                  </span>
                  <h3 className="text-lg font-semibold text-slate-800 flex-1">
                    {question.question}
                  </h3>
                </div>
                
                {question.type === 'text' ? (
                  <textarea
                    value={selectedAnswers[question.id] || ''}
                    onChange={(e) => setSelectedAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
                    className="w-full p-4 border-2 rounded-lg focus:border-blue-500 outline-none"
                    placeholder="Type your answer..."
                    rows={4}
                  />
                ) : (
                  <div className="space-y-3">
                    {(question.options || []).map((option, index) => (
                      <label
                        key={index}
                        className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedAnswers[question.id] === index
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          checked={selectedAnswers[question.id] === index}
                          onChange={() => handleAnswerSelect(question.id, index)}
                          className="mr-3"
                        />
                        <span className="flex-1 text-slate-700">{option}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                     bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Previous
                </button>
                
                <div className="text-sm text-slate-600">
                  {currentQuestion + 1} / {questions.length}
                </div>
                
                {currentQuestion === questions.length - 1 ? (
                  <button
                    onClick={handleSubmitTest}
                    disabled={Object.keys(selectedAnswers).length < questions.length}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Submitting...' : 'Submit Test'}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-600">No questions available for this topic.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestComponent;
