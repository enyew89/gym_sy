import { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, Sparkles, User, Dumbbell, Apple,
  Flame, Heart, RotateCcw, Copy, Check, Info, Zap
} from 'lucide-react';
import { PageHeader } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { workoutPlans } from '../../data/mockData';
import { aiApi } from '../../services/api';
import FormattedMessage from '../../components/FormattedMessage';

export default function MemberAI() {
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  const athleteName = user?.name?.split(' ')[0] || 'Athlete';

  const initialMessages = [
    {
      id: 'm-1',
      sender: 'ai',
      text: `Hello ${athleteName}! I'm Coach Aria, your AI fitness & nutrition specialist. Ask me anything about workout routines, nutrition plans, recovery tips, or exercise alternatives!`,
      timestamp: 'Today',
    },
  ];

  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const quickPrompts = [
    { label: 'What exercises target biceps?', query: 'What are the best exercises to target both heads of the biceps?' },
    { label: 'Create a stretching routine', query: 'Create a 10-minute post-workout stretching routine for upper body.' },
    { label: 'How much protein do I need?', query: 'How much daily protein should I consume to build lean muscle at 75kg?' },
    { label: 'Explain my workout plan', query: 'Can you explain the structure and frequency of my assigned workout program?' },
    { label: 'Tips for muscle recovery', query: 'What are the best tips to reduce delayed onset muscle soreness (DOMS)?' },
    { label: 'Warm-up before heavy squats', query: 'Give me a specific warm-up protocol before doing heavy squats.' },
  ];

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const generateAIResponse = (userQuery) => {
    const q = userQuery.toLowerCase();

    if (q.includes('bicep') || q.includes('tricep') || q.includes('arm')) {
      return `Here is a simple arm routine to build stronger arms:
- **Dumbbell Bicep Curls:** 3 sets of 10–12 reps. Curl up smoothly without swinging your body.
- **Hammer Curls:** 3 sets of 10–12 reps. Hold dumbbells with palms facing each other to build arm thickness.
- **Tricep Rope Pushdowns:** 3 sets of 12–15 reps. Push down and spread the rope at the bottom.
- **Bench Dips or Dips:** 3 sets of 10–12 reps. Great for building your triceps.

💡 **Coach Tip:** Keep your elbows pinned to your sides—let your arms do the work!`;
    }

    if (q.includes('chest') || q.includes('bench press') || q.includes('pec')) {
      return `Here are 4 simple and effective chest exercises:
- **Flat Bench Press:** 3 sets of 8–10 reps. Lower the bar smoothly to your mid-chest and push back up.
- **Incline Dumbbell Press:** 3 sets of 10–12 reps. Builds your upper chest.
- **Chest Dips or Push-ups:** 3 sets of 10–15 reps. Great for building chest strength.
- **Cable Flyes or Pec Deck:** 3 sets of 12–15 reps. Squeeze your chest muscles together at the front.

💡 **Coach Tip:** Keep your shoulders back and control the weight on the way down. Don't bounce!`;
    }

    if (q.includes('stretch') || q.includes('flexibility') || q.includes('mobility')) {
      return `Here is a quick **10-minute post-workout stretch**:
- **Doorway Chest Stretch:** 30 seconds per side to open your chest.
- **Overhead Tricep Stretch:** 30 seconds per arm.
- **Cross-Body Shoulder Stretch:** 30 seconds per arm.
- **Hamstring & Quad Stretches:** 40 seconds per leg.
- **Deep Breaths in Child's Pose:** Relax for 1 minute to cool down.`;
    }

    if (q.includes('protein') || q.includes('nutrition') || q.includes('diet') || q.includes('food') || q.includes('injera') || q.includes('shiro')) {
      return `Simple nutrition guide for energy and muscle:
- **Protein Goal:** Eat about **1.6 to 2g of protein per kg of body weight** (~120g–150g per day for most).
- **Boiled Eggs:** 2 to 3 eggs for a quick high-protein breakfast.
- **Beef Tibs / Lean Meat:** Great source of protein and iron for muscle recovery.
- **Injera:** Clean carbohydrate energy to power your workouts.
- **Shiro & Misir (Lentils):** Great plant protein (especially on fasting days). Add a boiled egg to Shiro for complete protein!
- **Water:** Drink 2.5 to 3 liters daily.

💡 **Simple Rule:** Include one source of protein in every main meal!`;
    }

    if (q.includes('fat loss') || q.includes('lose weight') || q.includes('belly') || q.includes('cardio')) {
      return `Simple steps to burn fat and keep muscle:
- **Eat Slightly Less:** Cut sugary sodas, juices, and fried fast food.
- **Eat High Protein:** Eggs, beef, lentils, and shiro keep you full and protect muscles.
- **Lift Weights 3–4 Days a Week:** Keeps your body firm and burning calories.
- **Easy Cardio:** 20–25 minutes of brisk walking or treadmill incline walking after your lifts.
- **Sleep 7–8 Hours:** Good sleep stops junk food cravings.`;
    }

    if (q.includes('plan') || q.includes('program') || q.includes('routine') || q.includes('split')) {
      return `Simple 4-Day Weekly Workout Routine:
- **Monday (Upper Body):** Bench Press, Rows, Shoulder Press, Arm Curls.
- **Tuesday (Lower Body):** Squats, Leg Press, Hamstring Curls, Calves.
- **Wednesday:** Rest day (take a walk or stretch).
- **Thursday (Upper Body):** Incline Press, Pull-downs, Lateral Raises, Triceps.
- **Friday (Lower Body & Abs):** Deadlifts, Lunges, and Core.
- **Weekend:** Rest, eat well, and recharge!`;
    }

    if (q.includes('creatine') || q.includes('whey') || q.includes('supplement')) {
      return `The 3 supplements worth taking:
- **Creatine Monohydrate:** 5g daily with water. Gives you more power during heavy lifts.
- **Whey Protein:** 1 scoop post-workout if you can't eat a meal right away.
- **Coffee:** 1 cup 30 mins before your workout gives you clean energy.

💡 **Coach Tip:** Real food like eggs, meat, and injera does 90% of the work!`;
    }

    if (q.includes('recovery') || q.includes('sore') || q.includes('doms') || q.includes('sleep')) {
      return `Easy ways to recover from sore muscles:
- **Sleep 7.5 to 8 Hours:** This is when your muscles rebuild and grow.
- **Drink Water:** At least 2.5 to 3 liters a day.
- **Light Walking:** 15 minutes of easy walking flushes out soreness.
- **Eat Protein:** Have a healthy meal with eggs, meat, or lentils after training.`;
    }

    if (q.includes('squat') || q.includes('knee') || q.includes('warm')) {
      return `Safe Squat Guide & Knee Protection:
- **Warm-Up:** 5 minutes brisk walking on treadmill before lifting.
- **Foot Position:** Feet shoulder-width apart, toes pointed slightly out.
- **Knees Follow Toes:** Push your knees outward in line with your toes—don't let them collapse inward.
- **Warm-up Sets:** Barbell only (10 reps) → Light weight (5 reps) → then your working sets!`;
    }

    if (q.includes('are you working') || q.includes('working') || q.includes('hi') || q.includes('hello')) {
      return `Hey ${athleteName}! 🚀 I'm online and ready to help. What workout or nutrition question can I answer for you right now?`;
    }

    return `Hey ${athleteName}! I'm Coach Aria. Ask me for a quick workout routine, how to do any exercise, or what healthy foods to eat for your goal!`;
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await aiApi.chat({
        message: text.trim(),
        fitnessGoal: user?.fitnessGoal || 'Hypertrophy & Strength',
      });
      if (res && res.success && res.reply) {
        const aiMsg = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: res.reply,
          recommendations: res.recommendations || [],
          timestamp: res.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
        return;
      }
    } catch (err) {
      console.warn('Backend AI chat error, using local fallback:', err);
    }

    setTimeout(() => {
      const aiReplyText = generateAIResponse(text);
      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReplyText,
        recommendations: [
          'What exercises target biceps & triceps?',
          'How much protein do I need per day?',
          'Create a 4-day workout plan',
          'Healthy Ethiopian gym foods',
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages(initialMessages.slice(0, 1));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Fitness Assistant"
        subtitle="Your 24/7 intelligent trainer for workout optimization, diet plans, and technique tips"
        action={
          <button
            onClick={handleClearChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Chat</span>
          </button>
        }
      />

      {/* Main Chat Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[750px]">
        {/* Assistant Header Banner */}
        <div className="px-6 py-4 bg-gradient-to-r from-violet-700 via-indigo-700 to-primary-700 text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-md">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-violet-800 rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">Coach Aria</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 uppercase tracking-wider text-violet-100">
                  AI Fitness Pro
                </span>
              </div>
              <p className="text-xs text-violet-200">
                Online • Synced with your personal fitness profile
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-violet-200 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Fitness Coach</span>
          </div>
        </div>

        {/* Suggested Quick Prompts Horizontal Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-100 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 pl-1">
              <Zap className="w-3 h-3 text-amber-500" />
              Quick Prompts:
            </span>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p.query)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-white hover:bg-violet-50 text-slate-700 hover:text-violet-700 border border-slate-200 hover:border-violet-300 transition-colors shadow-2xs whitespace-nowrap"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages Scroll View */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/40">
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isAi ? 'justify-start' : 'justify-end'}`}
              >
                {isAi && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-xl group relative`}>
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isAi
                        ? 'bg-white text-slate-800 border border-slate-200/80 shadow-sm rounded-tl-sm'
                        : 'bg-primary-600 text-white shadow-md rounded-tr-sm'
                    }`}
                  >
                    {isAi ? (
                      <FormattedMessage text={msg.text} />
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    )}

                    {isAi && msg.recommendations && msg.recommendations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                        {msg.recommendations.map((rec, rIdx) => (
                          <button
                            key={rIdx}
                            type="button"
                            onClick={() => handleSendMessage(rec)}
                            className="text-[11px] px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-800 rounded-lg border border-violet-200 transition-colors text-left font-medium"
                          >
                            💡 {rec}
                          </button>
                        ))}
                      </div>
                    )}

                    <div
                      className={`flex items-center justify-between gap-3 mt-2 pt-1 border-t text-[10px] ${
                        isAi
                          ? 'border-slate-100 text-slate-400'
                          : 'border-white/20 text-white/70'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {isAi && (
                        <button
                          onClick={() => copyToClipboard(msg.text, msg.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-slate-600 flex items-center gap-1"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {!isAi && (
                  <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center flex-shrink-0 shadow-sm mt-1 text-xs uppercase">
                    {(user?.name || 'Athlete')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-start gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-slate-400 ml-2">Coach Aria is writing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar at Bottom */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Coach Aria about exercises, recovery, protein, or technique..."
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none bg-slate-50 focus:bg-white transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className={`p-3 rounded-xl transition-all flex items-center justify-center ${
                inputText.trim() && !isTyping
                  ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-md active:scale-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          <p className="text-[11px] text-slate-400 text-center mt-2">
            Coach Aria provides fitness suggestions based on sports science. Always listen to your body and consult your personal trainer for form checks.
          </p>
        </div>
      </div>
    </div>
  );
}
