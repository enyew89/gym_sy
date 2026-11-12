import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/ui';
import { aiApi } from '../../services/api';
import FormattedMessage from '../../components/FormattedMessage';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Copy,
  Check,
  Dumbbell,
  RefreshCw,
  Lightbulb,
  Zap,
  ArrowRight,
  BookmarkPlus,
  TrendingUp,
  Sliders,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TrainerAI() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // Suggested quick prompts
  const suggestedPrompts = [
    'Create a workout plan for muscle building',
    'Explain proper squat form',
    'Summarize member progress',
    'Recommend post-workout recovery protocol',
  ];

  // Pre-populated initial conversation
  const [messages, setMessages] = useState([
    {
      id: 'msg-1',
      sender: 'trainer',
      text: 'Create a 4-day hypertrophy workout routine focusing on progressive overload for intermediate lifters.',
      time: '10:14 AM',
    },
    {
      id: 'msg-2',
      sender: 'ai',
      text: `Here is a tailored **4-Day Hypertrophy Routine (Upper / Lower Split)** built for intermediate lifters with built-in progressive overload:

### 🏋️ Day 1: Upper Power & Hypertrophy
- **Barbell Bench Press**: 4 sets × 6–8 reps (90–120s rest)
- **Barbell Bent-Over Row**: 4 sets × 8–10 reps (90s rest)
- **Standing Overhead Press**: 3 sets × 8–10 reps (90s rest)
- **Incline Dumbbell Flyes**: 3 sets × 12–15 reps (60s rest)
- **Tricep Rope Pushdowns**: 3 sets × 12–15 reps (60s rest)

### 🦵 Day 2: Lower Quad & Posterior Chain
- **Barbell Back Squat**: 4 sets × 6–8 reps (120s rest)
- **Romanian Deadlift (RDL)**: 3 sets × 8–10 reps (90s rest)
- **Leg Press**: 3 sets × 12 reps (90s rest)
- **Lying Hamstring Curls**: 3 sets × 12–15 reps (60s rest)
- **Standing Calf Raises**: 4 sets × 15–20 reps (60s rest)

### 🏋️ Day 3: Upper Volume & Detail
- **Incline Barbell Bench**: 3 sets × 8–10 reps (90s rest)
- **Neutral Grip Pull-ups / Lat Pulldown**: 4 sets × 8–10 reps (90s rest)
- **Dumbbell Lateral Raises**: 4 sets × 12–15 reps (45–60s rest)
- **Incline Dumbbell Curls**: 3 sets × 10–12 reps (60s rest)
- **Cable Overhead Tricep Extension**: 3 sets × 12–15 reps (60s rest)

### 🦵 Day 4: Lower Glute & Hamstring Focus
- **Conventional Deadlift / Trap Bar**: 3 sets × 5 reps (180s rest)
- **Bulgarian Split Squats**: 3 sets × 10 reps/leg (75s rest)
- **Leg Extension (Quads)**: 3 sets × 15 reps (60s rest)
- **Hanging Leg Raises / Core**: 3 sets × 15 reps (45s rest)

💡 **Trainer Tip**: Target an RPE of 7–8 in Weeks 1–3, then increase load by 2.5kg or add 1 rep before a scheduled deload on Week 5.`,
      time: '10:15 AM',
      actions: true,
    },
    {
      id: 'msg-3',
      sender: 'trainer',
      text: 'Explain proper squat form and key cues for an athlete suffering from knee cave (valgus).',
      time: '10:22 AM',
    },
    {
      id: 'msg-4',
      sender: 'ai',
      text: `When an athlete experiences **knee valgus (knee cave)** during the ascent of a squat, it is typically driven by weak gluteus medius/maximus activation, poor ankle dorsiflexion, or quad fatigue.

### 🔑 Key Coaching Cues & Adjustments:
1. **"Screw your feet into the floor"**: Instruct the athlete to rotate their hips externally, generating arch tension and engaging the lateral glutes before initiating the descent.
2. **"Spread the floor with your shoes"**: Keep outward radial pressure throughout the entire concentric drive.
3. **Band Placement**: Place a light looped resistance band just above the athlete's knees during warm-up squats to create reactive neuromuscular facilitation (RNT).
4. **Ankle Mobility Check**: Verify if heels elevate; if so, consider using weightlifting shoes with an elevated heel or 1.25kg plates under heels.`,
      time: '10:23 AM',
      actions: true,
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Auto scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (textToSend) => {
    const query = typeof textToSend === 'string' ? textToSend : inputMessage;
    if (!query.trim()) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'trainer',
      text: query.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const res = await aiApi.chat({ message: query.trim() });
      if (res.success && res.reply) {
        const aiMsg = {
          id: `msg-${Date.now() + 1}`,
          sender: 'ai',
          text: res.reply,
          time: res.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actions: true,
          structuredRoutine: res.structuredRoutine || null,
          progressSummary: res.progressSummary || null,
          recommendations: res.recommendations || [],
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
        return;
      }
    } catch (err) {
      // Fallback to local response if offline
    }

    setTimeout(() => {
      let aiResponseText = '';
      let routineData = null;
      let summaryData = null;
      const lower = query.toLowerCase();

      if (lower.includes('muscle building') || lower.includes('hypertrophy') || lower.includes('workout plan')) {
        aiResponseText = `Here is an optimized **Hypertrophy Acceleration Plan**:
- **Chest & Triceps**: Barbell Flat Bench (4×8-10 @ 70%), Incline DB Press (3×10), Cable Crossover (3×15), Dips (3×Failure).
- **Back & Biceps**: Weighted Pull-ups (4×6-8), Chest-supported T-Bar Row (3×10), Lat Pulldown (3×12), Incline Bicep Curls (3×12).
- **Legs & Core**: Back Squats (4×8 @ 75%), Romanian Deadlift (3×10), Leg Press (3×12), Standing Calf Raises (4×15).

Target 1.6g–2.2g of protein per kg of bodyweight, and sleep 7–8 hours for optimal protein synthesis.`;
        routineData = {
          name: 'AI Hypertrophy Acceleration Plan',
          days: [
            {
              day: 'Day 1 - Chest & Triceps',
              focus: 'Push Hypertrophy',
              exercises: [
                { name: 'Barbell Flat Bench', sets: 4, reps: '8-10', weight: '70kg', rest: '90s' },
                { name: 'Incline DB Press', sets: 3, reps: '10', weight: '24kg', rest: '60s' },
                { name: 'Cable Crossover', sets: 3, reps: '15', weight: '15kg', rest: '60s' },
                { name: 'Dips', sets: 3, reps: 'Failure', weight: 'BW', rest: '60s' },
              ],
            },
            {
              day: 'Day 2 - Back & Biceps',
              focus: 'Pull Hypertrophy',
              exercises: [
                { name: 'Weighted Pull-ups', sets: 4, reps: '6-8', weight: 'BW+10kg', rest: '90s' },
                { name: 'Chest-supported T-Bar Row', sets: 3, reps: '10', weight: '45kg', rest: '90s' },
                { name: 'Incline Bicep Curls', sets: 3, reps: '12', weight: '14kg', rest: '60s' },
              ],
            },
            {
              day: 'Day 3 - Legs & Core',
              focus: 'Lower Power & Calves',
              exercises: [
                { name: 'Back Squats', sets: 4, reps: '8', weight: '85kg', rest: '120s' },
                { name: 'Romanian Deadlift', sets: 3, reps: '10', weight: '75kg', rest: '90s' },
                { name: 'Leg Press', sets: 3, reps: '12', weight: '140kg', rest: '90s' },
              ],
            },
          ],
        };
      } else if (lower.includes('squat form') || lower.includes('squat')) {
        aiResponseText = `### 📋 Comprehensive Squat Technique Protocol:
1. **Set Up**: Barbell rests across upper traps (high bar) or rear delts (low bar). Grip firmly and pull elbows in.
2. **Stance**: Shoulder-width apart, toes slightly flared outward (15–30 degrees).
3. **Descent**: Take a deep diaphragmatic breath, brace your core 360°, sit back and down between knees.
4. **Depth**: Crease of the hip passes below the top of the patella.
5. **Ascent**: Drive through mid-foot, lead with the chest, and exhale past the sticking point.`;
      } else if (lower.includes('member progress') || lower.includes('progress') || lower.includes('summarize')) {
        aiResponseText = `### 📊 Assigned Member Progress Summary:
- **Active Roster**: Real-time athlete metrics are tracked automatically as assigned members log exercises and PRs.
- **Recommendations**: Ensure assigned athletes have custom workout plans and log their compound lifts (Bench, Squat, Deadlift) to generate automated performance trends.`;
        summaryData = {
          strengthGain: 'Tracked per athlete',
          bodyFatChange: 'Biometric tracking active',
          adherence: 'Session attendance monitored',
          recommendation: 'Assign split routines to new members',
        };
      } else if (lower.includes('recovery') || lower.includes('post-workout') || lower.includes('soreness')) {
        aiResponseText = `### ⚡ Elite Post-Workout Recovery Protocol:
1. **Immediate (0–30 mins)**: 25–35g rapid-absorbing protein + 40g carbohydrate source to replenish muscle glycogen.
2. **Rehydration**: 500ml water + electrolytes (sodium, potassium, magnesium) per 0.5kg lost in sweat.
3. **Active Recovery**: 10 minutes low-intensity zone 1 cycling or brisk walking to clear blood lactate.
4. **Sleep Quality**: Target 8+ hours with consistent sleep-wake timing; 95% of human growth hormone release occurs during slow-wave sleep.`;
      } else if (lower.includes('are you working') || lower.includes('working') || lower.includes('hi') || lower.includes('hello') || lower.includes('status')) {
        aiResponseText = `Hey Coach! 👋 I'm online and ready to assist with workout programming, athlete cues, or training split design. What can I build for you?`;
      } else {
        aiResponseText = `Hey Coach! For **${query}**, I recommend focusing on consistent progression and clear exercise form.\n\nLet me know if you want me to write a custom routine split or specific coaching cues for your athletes!`;
      }

      const aiMsg = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: aiResponseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: true,
        structuredRoutine: routineData,
        progressSummary: summaryData,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 900);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputMessage);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)] min-h-[550px]">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">AI Fitness Coaching Assistant</h1>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                GPT-4 Powered
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Form analysis, workout builder suggestions, and athlete recovery coaching
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages(messages.slice(0, 2));
            toast.success('Chat history cleared');
          }}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-xs flex items-center gap-1"
          title="Reset Conversation"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Suggested Prompts Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 pl-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Prompts:
        </div>
        {suggestedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="px-3 py-1.5 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-700 border border-slate-200 rounded-full text-xs font-medium whitespace-nowrap shadow-2xs transition-all shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm overflow-y-auto space-y-5">
        {messages.map((msg) => {
          const isTrainer = msg.sender === 'trainer';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isTrainer ? 'justify-end' : 'justify-start'}`}
            >
              {/* Bot Avatar */}
              {!isTrainer && (
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              {/* Message Bubble Container */}
              <div
                className={`max-w-[85%] sm:max-w-[78%] flex flex-col ${
                  isTrainer ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isTrainer
                      ? 'bg-emerald-600 text-white rounded-tr-none shadow-xs'
                      : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-200'
                  }`}
                >
                  {!isTrainer ? (
                    <FormattedMessage text={msg.text} />
                  ) : (
                    <div className="whitespace-pre-wrap font-normal">{msg.text}</div>
                  )}

                  {/* AI Structured Routine Box */}
                  {!isTrainer && msg.structuredRoutine && (
                    <div className="mt-3 p-3.5 bg-white border border-emerald-200 rounded-xl shadow-xs space-y-2.5 text-slate-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-2">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-xs">
                          <Dumbbell className="w-4 h-4 text-emerald-600" />
                          <span>Generated Routine: {msg.structuredRoutine.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            sessionStorage.setItem('ai_imported_plan', JSON.stringify(msg.structuredRoutine));
                            toast.success('Routine loaded! Redirecting to Workout Creator...');
                            navigate('/trainer/workouts/create');
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                        >
                          <BookmarkPlus className="w-3.5 h-3.5" />
                          <span>Import into Builder</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {msg.structuredRoutine.days.map((d, dIdx) => (
                          <div key={dIdx} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="font-bold text-slate-900 block">{d.day}</span>
                            <span className="text-[11px] text-slate-500">{d.focus}</span>
                            <div className="text-[11px] text-emerald-700 mt-1 font-medium">
                              {d.exercises?.length || 0} targeted movements
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Progress Summary Box */}
                  {!isTrainer && msg.progressSummary && (
                    <div className="mt-3 p-3.5 bg-white border border-blue-200 rounded-xl shadow-xs space-y-2.5 text-slate-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-2">
                        <div className="flex items-center gap-1.5 font-bold text-blue-900 text-xs">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          <span>Athlete Progress Analytics Summary</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigate('/trainer/progress');
                            toast.success('Navigated to Client Progress & Analytics');
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                        >
                          <span>Open Progress Hub</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div className="p-2 bg-blue-50/60 rounded-lg border border-blue-100">
                          <span className="text-[10px] text-blue-600 block uppercase font-bold">Strength Milestone</span>
                          <span className="font-bold text-slate-900 text-xs">{msg.progressSummary.strengthGain}</span>
                        </div>
                        <div className="p-2 bg-blue-50/60 rounded-lg border border-blue-100">
                          <span className="text-[10px] text-blue-600 block uppercase font-bold">Body Composition</span>
                          <span className="font-bold text-slate-900 text-xs">{msg.progressSummary.bodyFatChange}</span>
                        </div>
                        <div className="p-2 bg-blue-50/60 rounded-lg border border-blue-100 col-span-2 sm:col-span-1">
                          <span className="text-[10px] text-blue-600 block uppercase font-bold">Workout Adherence</span>
                          <span className="font-bold text-slate-900 text-xs">{msg.progressSummary.adherence}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recommendations Chips */}
                  {!isTrainer && msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-slate-200/60">
                      {msg.recommendations.map((rec, rIdx) => (
                        <button
                          key={rIdx}
                          type="button"
                          onClick={() => handleSend(rec)}
                          className="text-[11px] px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 transition-colors text-left font-medium"
                        >
                          💡 {rec}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bubble Footer: Time & Action Buttons */}
                <div className="flex items-center gap-3 mt-1.5 px-1">
                  <span className="text-[10px] text-slate-400 font-medium">{msg.time}</span>

                  {!isTrainer && msg.actions && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          toast.success('Navigating to Workout Builder with AI plan...');
                          navigate('/trainer/workouts/create');
                        }}
                        className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 transition-colors ml-1"
                      >
                        <BookmarkPlus className="w-3 h-3 text-emerald-600" />
                        <span>Use in Plan</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Trainer Avatar */}
              {isTrainer && (
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* AI Typing Indicator */}
        {isTyping && (
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
              <span
                className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                style={{ animationDelay: '0.2s' }}
              ></span>
              <span
                className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                style={{ animationDelay: '0.4s' }}
              ></span>
              <span className="text-xs text-slate-400 ml-2 font-medium">
                AI Coach is analyzing...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 sm:p-3 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputMessage);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask AI Coach for routine design, exercise biomechanics, recovery advice..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs sm:text-sm shadow-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
