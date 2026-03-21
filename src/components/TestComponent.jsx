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

  const toggleCheckboxAnswer = (questionId, answerIndex) => {
    setSelectedAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      const exists = current.includes(answerIndex);
      const next = exists ? current.filter((x) => x !== answerIndex) : [...current, answerIndex];
      return {
        ...prev,
        [questionId]: next
      };
    });
  };

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

    questions.forEach((question) => {
      if (question.type === 'text') return;
      if (!Array.isArray(question.options) || question.options.length === 0) return;

      total++;

      const expected = question.correctOption;
      const actual = selectedAnswers[question.id];

      if (question.type === 'checkbox') {
        const expectedArr = Array.isArray(expected) ? expected : (typeof expected === 'number' ? [expected] : []);
        const actualArr = Array.isArray(actual) ? actual : [];
        const expectedSorted = [...expectedArr].sort();
        const actualSorted = [...actualArr].sort();
        const isCorrect =
          expectedSorted.length === actualSorted.length &&
          expectedSorted.every((v, idx) => v === actualSorted[idx]);
        if (isCorrect) correct++;
        return;
      }

      if (actual === expected) {
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

  const isQuestionAnswered = (q) => {
    const v = selectedAnswers[q.id];
    if (q.type === 'text') return typeof v === 'string' && v.trim().length > 0;
    if (q.type === 'checkbox') return Array.isArray(v) && v.length > 0;
    return typeof v === 'number';
  };

  const allAnswered = questions.length > 0 && questions.every(isQuestionAnswered);

  const getCorrectAnswerLabel = (q) => {
    if (q.type === 'text') return '';
    const expected = q.correctOption;
    if (q.type === 'checkbox') {
      const expectedArr = Array.isArray(expected) ? expected : (typeof expected === 'number' ? [expected] : []);
      return expectedArr
        .filter((idx) => typeof idx === 'number' && idx >= 0)
        .map((idx) => q.options?.[idx])
        .filter(Boolean)
        .join(', ');
    }
    return q.options?.[expected] ?? '';
  };

  const getStudentAnswerLabel = (q) => {
    const actual = selectedAnswers[q.id];
    if (q.type === 'text') return typeof actual === 'string' ? actual : '';
    if (q.type === 'checkbox') {
      const arr = Array.isArray(actual) ? actual : [];
      return arr
        .filter((idx) => typeof idx === 'number' && idx >= 0)
        .map((idx) => q.options?.[idx])
        .filter(Boolean)
        .join(', ');
    }
    return q.options?.[actual] ?? '';
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
            <div className="py-8">
              <div className="text-center mb-6">
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

              <div className="mt-8">
                <h4 className="text-lg font-bold text-slate-800 mb-4">Answer Review</h4>
                <div className="space-y-4">
                  {questions.map((q, idx) => {
                    const expected = q.correctOption;
                    const actual = selectedAnswers[q.id];

                    let isCorrect = false;
                    if (q.type === 'text') {
                      isCorrect = false;
                    } else if (q.type === 'checkbox') {
                      const expectedArr = Array.isArray(expected) ? expected : (typeof expected === 'number' ? [expected] : []);
                      const actualArr = Array.isArray(actual) ? actual : [];
                      const expectedSorted = [...expectedArr].sort();
                      const actualSorted = [...actualArr].sort();
                      isCorrect =
                        expectedSorted.length === actualSorted.length &&
                        expectedSorted.every((v, i2) => v === actualSorted[i2]);
                    } else {
                      isCorrect = actual === expected;
                    }

                    const correctLabel = getCorrectAnswerLabel(q);
                    const studentLabel = getStudentAnswerLabel(q);

                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-xl border ${
                          q.type === 'text'
                            ? 'border-slate-200 bg-slate-50'
                            : isCorrect
                            ? 'border-green-200 bg-green-50'
                            : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-800">
                              Q{idx + 1}. {q.question}
                            </div>
                            {q.type === 'text' ? (
                              <div className="mt-2 text-sm text-slate-700">
                                <div className="font-semibold">Your answer:</div>
                                <div className="mt-1 whitespace-pre-wrap">{studentLabel || '-'}</div>
                              </div>
                            ) : (
                              <div className="mt-2 text-sm text-slate-700 space-y-1">
                                <div>
                                  <span className="font-semibold">Your answer:</span> {studentLabel || '-'}
                                </div>
                                <div>
                                  <span className="font-semibold">Correct answer:</span> {correctLabel || '-'}
                                </div>
                              </div>
                            )}
                          </div>
                          {q.type !== 'text' ? (
                            <div className={`text-xs font-bold px-3 py-1 rounded-full ${isCorrect ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                              {isCorrect ? 'Correct' : 'Wrong'}
                            </div>
                          ) : (
                            <div className="text-xs font-bold px-3 py-1 rounded-full bg-slate-700 text-white">
                              Submitted
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                ) : question.type === 'checkbox' ? (
                  <div className="space-y-3">
                    {(question.options || []).map((option, index) => {
                      const checked = Array.isArray(selectedAnswers[question.id])
                        ? selectedAnswers[question.id].includes(index)
                        : false;
                      return (
                        <label
                          key={index}
                          className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            checked
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCheckboxAnswer(question.id, index)}
                            className="mr-3"
                          />
                          <span className="flex-1 text-slate-700">{option}</span>
                        </label>
                      );
                    })}
                  </div>
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
                    disabled={!allAnswered}
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
