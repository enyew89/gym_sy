import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Sliding window rate limiter: max 20 requests per minute per user/ip
const aiRateLimitMap = new Map();

function aiRateLimiter(req, res, next) {
  const identifier = req.user?._id?.toString() || req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 20;

  const timestamps = aiRateLimitMap.get(identifier) || [];
  const recent = timestamps.filter((t) => now - t < windowMs);

  if (recent.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many AI requests. Please wait a minute before asking Coach Aria again.',
    });
  }

  recent.push(now);
  aiRateLimitMap.set(identifier, recent);

  // Periodic cleanup if map grows
  if (aiRateLimitMap.size > 1000) {
    for (const [key, times] of aiRateLimitMap.entries()) {
      if (times.every((t) => now - t >= windowMs)) {
        aiRateLimitMap.delete(key);
      }
    }
  }

  next();
}

function getGeminiKeys() {
  const rawList = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
  return rawList
    .split(',')
    .map((k) => k.trim().replace(/^["']|["']$/g, ''))
    .filter((k) => k.length > 20);
}

/**
 * Call Google Gemini API (gemini-2.5-flash / gemini-1.5-flash) with multi-key failover pool
 */
async function callGemini(prompt, userRole, userName, fitnessGoal) {
  const keys = getGeminiKeys();
  if (keys.length === 0) return null;

  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  const systemPrompt =
    userRole === 'trainer'
      ? `You are the GymPro Coaching Assistant for certified gym trainers.
Deliver direct, practical, and highly actionable coaching advice.

CRITICAL INSTRUCTIONS:
1. SIMPLE & GRASPABLE: Keep everything straightforward, clear, and easy to apply immediately on the gym floor. Avoid academic fluff.
2. SHORT & CONCISE: Maximum 3 to 5 brief bullet points. Total response should be readable in 15 seconds.
3. CONVERSATIONAL: If the user says "hi", "are you working", "status", etc., respond in 1-2 friendly sentences without unsolicited routines.
4. FORMATTING: Use bold labels for key points, followed by 1 clear sentence with sets, reps, and cues.`
      : `You are Coach Aria, a friendly, encouraging personal trainer and nutrition coach at GymPro.
Address the user as ${userName || 'Athlete'}. Their stated goal is "${fitnessGoal || 'Fitness & Health'}".

CRITICAL INSTRUCTIONS:
1. SIMPLE & GRASPABLE: Use plain, everyday language that any regular gym member can immediately understand. Never use academic medical or biomechanical jargon (do NOT use terms like "clavicular head", "concentric adduction", "metabolic pathways", "hypertrophic mechanisms").
2. SHORT & BITE-SIZED: Keep replies concise (maximum 3 to 4 brief bullet points). Members read this on their phone between gym sets in 15 seconds. Never write long essays or walls of text.
3. PRACTICAL NUMBERS: Always give simple numbers (e.g., "3 sets of 10 reps", "2 boiled eggs with injera", "rest 60 seconds").
4. CONVERSATIONAL QUESTIONS: If the user says "hi", "hello", "are you working", "how are you", or tests if you work, respond in 1 to 2 warm, friendly sentences. NEVER dump unrequested workout routines on simple greetings.
5. ETHIOPIAN FITNESS FOODS: When nutrition or diet is asked, suggest familiar, healthy Ethiopian foods like Injera (clean energy carbs), Shiro & Misir (plant protein), Beef Tibs (lean meat), and Boiled Eggs.
6. FORMATTING: Use clean bullet points with bold labels. End with 1 short, motivating tip.`;

  for (const apiKey of keys) {
    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const payload = {
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 1000,
          },
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText && replyText.trim()) {
            return replyText.trim();
          }
        } else {
          console.warn(`Gemini (${model}) returned status ${response.status} with key ...${apiKey.slice(-6)}`);
        }
      } catch (err) {
        console.warn(`Gemini fetch error for ${model}:`, err.message);
      }
    }
  }

  return null;
}

/**
 * Built-in Sports Science & Athletic Intelligence Knowledge Engine
 */
function getLocalAIResponse(query, userRole, userName, fitnessGoal) {
  const q = query.toLowerCase().trim();
  const name = userName ? userName.split(' ')[0] : 'Athlete';

  // 1. Greetings & Introductions
  if (q === 'hi' || q === 'hello' || q === 'hey' || q.includes('who are you') || q.includes('what can you do')) {
    if (userRole === 'trainer') {
      return {
        reply: `Hey Coach! 👋 I'm your **GymPro Coaching Assistant**.\n\nAsk me for fast workout programming, exercise cues, recovery tips, or athlete nutrition advice. What are we designing today?`,
        recommendations: [
          '4-day workout plan for hypertrophy',
          'Squat cues for knee cave',
          'Post-workout recovery protocol',
        ],
      };
    }

    return {
      reply: `Hey ${name}! 👋 I'm Coach Aria, your GymPro fitness & nutrition assistant.\n\nAsk me anything simple—like what exercises to do today, how many sets and reps you need, or what healthy foods to eat! What can I help you with?`,
      recommendations: [
        'How do I build chest and arms?',
        'How much protein should I eat daily?',
        'Give me a simple 4-day workout plan',
        'Healthy Ethiopian foods for fitness',
      ],
    };
  }

  // 2. Chest & Pecs
  if (q.includes('chest') || q.includes('bench press') || q.includes('pec')) {
    return {
      reply: `Here are 4 simple and effective chest exercises for you:\n\n- **Flat Bench Press:** 3 sets of 8–10 reps. Lower the bar smoothly to your mid-chest and push back up.\n- **Incline Dumbbell Press:** 3 sets of 10–12 reps. Builds your upper chest.\n- **Chest Dips or Push-ups:** 3 sets of 10–15 reps. Great for building overall chest strength.\n- **Cable Flyes or Pec Deck:** 3 sets of 12–15 reps. Squeeze your chest muscles together at the front.\n\n💡 **Coach Tip:** Keep your shoulders back and control the weight on the way down. Don't bounce!`,
      recommendations: [
        'How to do bench press safely',
        'Simple chest and tricep workout',
        'What should I eat after chest day?',
      ],
    };
  }

  // 3. Arms, Biceps & Triceps
  if (q.includes('bicep') || q.includes('tricep') || q.includes('arm')) {
    return {
      reply: `Here is a simple, effective arm routine to build bigger arms:\n\n- **Dumbbell Bicep Curls:** 3 sets of 10–12 reps. Curl the weights smoothly without swinging your body.\n- **Hammer Curls:** 3 sets of 10–12 reps. Hold dumbbells with palms facing each other to build arm thickness.\n- **Tricep Rope Pushdowns:** 3 sets of 12–15 reps. Push down on the cable and spread the rope at the bottom.\n- **Dips or Bench Dips:** 3 sets of 10–12 reps. Fantastic for building your triceps.\n\n💡 **Coach Tip:** Keep your elbows pinned to your sides—let your arms do the lifting, not your shoulders!`,
      recommendations: [
        'Best exercises for biceps',
        'How often should I train arms each week?',
        'Simple arm workout routine',
      ],
    };
  }

  // 4. Back & Lats
  if (q.includes('back') || q.includes('lat') || q.includes('pull-up') || q.includes('row')) {
    return {
      reply: `Here are the top 4 exercises for a strong, wide back:\n\n- **Lat Pulldowns (or Pull-ups):** 3 sets of 8–10 reps. Pull the bar down to your collarbone and squeeze your back.\n- **Seated Cable Rows:** 3 sets of 10–12 reps. Pull the handle toward your belly button, keeping your back straight.\n- **Dumbbell Rows:** 3 sets of 10 reps per side. Rest one knee on a bench and pull the dumbbell up to your hip.\n- **Face Pulls:** 3 sets of 15 reps. Pull the rope toward your forehead to build upper back posture.\n\n💡 **Coach Tip:** Think of your hands as hooks and pull with your elbows, not your hands!`,
      recommendations: [
        'How to do more pull-ups',
        'How to prevent lower back pain during deadlifts',
        'Simple back and biceps workout',
      ],
    };
  }

  // 5. Legs, Squats & Quads
  if (q.includes('leg') || q.includes('squat') || q.includes('quad') || q.includes('hamstring') || q.includes('glute')) {
    return {
      reply: `Here is a simple, powerful leg workout:\n\n- **Barbell Back Squats:** 3 sets of 8–10 reps. Stand shoulder-width apart, sit back like you're sitting in a chair, and push back up.\n- **Leg Press:** 3 sets of 10–12 reps. Safe way to load your thighs without straining your back.\n- **Romanian Deadlift (Dumbbell or Barbell):** 3 sets of 10 reps. Bend at your hips with a slight knee bend to work your hamstrings and glutes.\n- **Lying Hamstring Curls:** 3 sets of 12–15 reps. Shapes the back of your thighs.\n- **Calf Raises:** 3 sets of 15–20 reps. Push up on your toes, pause for 1 second, and lower slowly.\n\n💡 **Coach Tip:** Rest 90 seconds between heavy leg exercises and make sure to drink plenty of water!`,
      recommendations: [
        'Squat form cues for knee pain',
        'Warm-up routine before heavy squats',
        'Simple leg day workout',
      ],
    };
  }

  // 6. Shoulders & Delts
  if (q.includes('shoulder') || q.includes('delt') || q.includes('overhead press') || q.includes('lateral raise')) {
    return {
      reply: `Here are 4 simple exercises to build round, strong shoulders:\n\n- **Overhead Dumbbell Press:** 3 sets of 8–10 reps. Press the dumbbells straight overhead, then lower to ear height.\n- **Dumbbell Lateral Raises:** 3 sets of 12–15 reps. Raise the dumbbells out to your sides up to shoulder height.\n- **Front Dumbbell Raises:** 3 sets of 10–12 reps. Lift weights straight in front of you for the front shoulders.\n- **Rear Delt Flyes:** 3 sets of 12–15 reps. Great for shoulder posture and roundness.\n\n💡 **Coach Tip:** Use light to medium weights on lateral raises so your neck muscles don't take over!`,
      recommendations: [
        'How to do lateral raises correctly',
        'Shoulder warm-up for bench press',
        'Simple upper body workout',
      ],
    };
  }

  // 7. Nutrition, Macros, Protein & Ethiopian Gym Food
  if (
    q.includes('diet') ||
    q.includes('nutrition') ||
    q.includes('protein') ||
    q.includes('food') ||
    q.includes('eat') ||
    q.includes('calorie') ||
    q.includes('ethiopia') ||
    q.includes('injera') ||
    q.includes('shiro')
  ) {
    return {
      reply: `Here is a simple, easy-to-follow nutrition guide for building muscle and staying healthy:\n\n- **Daily Protein Target:** Aim for about **1.6 to 2 grams of protein per kg of body weight** (around 120g–150g per day for most members).\n- **Boiled or Scrambled Eggs:** 2 to 3 whole eggs are an easy, high-protein breakfast.\n- **Beef Tibs / Lean Meat:** Great source of complete protein and iron to help your muscles recover.\n- **Injera:** Excellent clean source of energy (complex carbs and iron) before workouts.\n- **Shiro & Misir (Lentils):** High-protein, healthy choices (especially on fasting days). Add a boiled egg to Shiro for complete protein!\n- **Water:** Drink 2.5 to 3 liters of water every day to keep your energy high.\n\n💡 **Simple Rule:** Have one source of protein (eggs, beef, or lentils) in every main meal!`,
      recommendations: [
        'How much protein do I need per day?',
        'What should I eat before and after workout?',
        'High-protein fasting (Tsom) meals',
      ],
    };
  }

  // 8. Fat Loss, Weight Loss, Cutting, Belly Fat
  if (q.includes('fat loss') || q.includes('lose weight') || q.includes('belly') || q.includes('cut') || q.includes('cardio')) {
    return {
      reply: `Here is a simple, realistic plan to lose body fat and keep your muscle:\n\n- **Eat Slightly Less:** Cut out sugary sodas, pastries, and fried snacks. That alone helps drop fat quickly.\n- **Eat More Protein:** Protein (eggs, meat, shiro, lentils) keeps you full longer and protects your muscles.\n- **Lift Weights 3–4 Days a Week:** Lifting signals your body to burn fat while keeping your muscle firm.\n- **Do Simple Cardio:** Walk on an inclined treadmill for 20–25 minutes after your workout, or walk 8,000–10,000 steps daily.\n- **Sleep 7–8 Hours:** Poor sleep increases hunger cravings and slows down fat loss.\n\n💡 **Simple Rule:** Consistency beats perfection. Aim to lose about 0.5 kg per week for long-lasting results!`,
      recommendations: [
        'Calculate my daily calorie target',
        'Best cardio routine for burning belly fat',
        'High-protein meal plan for weight loss',
      ],
    };
  }

  // 9. Supplements (Creatine, Whey, Pre-workout)
  if (q.includes('creatine') || q.includes('whey') || q.includes('supplement') || q.includes('pre workout') || q.includes('bcaa')) {
    return {
      reply: `Here are the only 3 supplements most gym members actually need:\n\n- **Creatine Monohydrate:** 5 grams once a day with water. Helps you push 1–2 more reps and builds strength.\n- **Whey Protein Powder:** 1 scoop (about 25g protein) after your workout if you don't have time for a cooked meal.\n- **Coffee or Pre-Workout:** A cup of black coffee 30 minutes before your workout gives you great energy and focus.\n\n💡 **Coach Tip:** Food comes first! Supplements are just helpers. Real food like eggs, meat, and injera will do 90% of the work.`,
      recommendations: [
        'Does creatine cause water retention?',
        'How much protein do I need per day?',
        'Best post-workout recovery tips',
      ],
    };
  }

  // 10. Workout Plans & Splits
  if (q.includes('workout') || q.includes('routine') || q.includes('split') || q.includes('plan') || q.includes('program')) {
    const routine = {
      name: 'GymPro 4-Day Progressive Hypertrophy Split',
      days: [
        {
          day: 'Day 1 - Upper Power',
          focus: 'Chest, Back & Shoulders',
          exercises: [
            { name: 'Barbell Bench Press', sets: 4, reps: '6-8', weight: '65kg', rest: '120s' },
            { name: 'Barbell Bent-Over Row', sets: 4, reps: '8-10', weight: '55kg', rest: '90s' },
            { name: 'Standing Overhead Press', sets: 3, reps: '8-10', weight: '40kg', rest: '90s' },
            { name: 'Incline Dumbbell Curls', sets: 3, reps: '12', weight: '14kg', rest: '60s' },
            { name: 'Tricep Rope Pushdowns', sets: 3, reps: '12-15', weight: '25kg', rest: '60s' },
          ],
        },
        {
          day: 'Day 2 - Lower Power',
          focus: 'Quads & Posterior Chain',
          exercises: [
            { name: 'Barbell Back Squat', sets: 4, reps: '6-8', weight: '85kg', rest: '120s' },
            { name: 'Romanian Deadlift (RDL)', sets: 3, reps: '8-10', weight: '75kg', rest: '90s' },
            { name: 'Leg Press', sets: 3, reps: '12', weight: '140kg', rest: '90s' },
            { name: 'Lying Hamstring Curls', sets: 3, reps: '12-15', weight: '45kg', rest: '60s' },
            { name: 'Standing Calf Raises', sets: 4, reps: '15-20', weight: 'BW+30kg', rest: '60s' },
          ],
        },
        {
          day: 'Day 3 - Upper Hypertrophy',
          focus: 'Volume, Arms & Pecs',
          exercises: [
            { name: 'Incline Dumbbell Press', sets: 4, reps: '10-12', weight: '24kg', rest: '90s' },
            { name: 'Neutral-Grip Pull-ups / Lat Pulldown', sets: 4, reps: '10', weight: 'BW', rest: '90s' },
            { name: 'Dumbbell Lateral Raises', sets: 4, reps: '15', weight: '10kg', rest: '60s' },
            { name: 'Cable Face Pulls', sets: 3, reps: '15', weight: '20kg', rest: '60s' },
            { name: 'Overhead Tricep Extension', sets: 3, reps: '12', weight: '22kg', rest: '60s' },
          ],
        },
        {
          day: 'Day 4 - Lower Hypertrophy & Core',
          focus: 'Glutes, Hamstrings & Abs',
          exercises: [
            { name: 'Conventional Deadlift', sets: 3, reps: '5', weight: '100kg', rest: '180s' },
            { name: 'Bulgarian Split Squats', sets: 3, reps: '10/leg', weight: '16kg', rest: '75s' },
            { name: 'Leg Extensions', sets: 3, reps: '15', weight: '50kg', rest: '60s' },
            { name: 'Hanging Leg Raises', sets: 3, reps: '15', weight: 'BW', rest: '45s' },
          ],
        },
      ],
    };

    return {
      reply: `Here is a simple, balanced 4-day workout plan:\n\n- **Monday (Upper Body):** Bench Press, Rows, Shoulder Press, and Arm Curls.\n- **Tuesday (Lower Body):** Squats, Leg Press, Hamstring Curls, and Calves.\n- **Wednesday:** Rest day (take a brisk walk or stretch).\n- **Thursday (Upper Body):** Incline Press, Pull-downs, Lateral Raises, and Triceps.\n- **Friday (Lower Body & Core):** Deadlifts or Romanian Deadlifts, Lunges, and Abs.\n- **Weekend:** Rest and enjoy healthy meals!\n\n💡 **Coach Tip:** Stick with this split for 4 to 6 weeks. When a weight feels easy, add 1–2 kg!`,
      structuredRoutine: routine,
      recommendations: [
        'Explain Day 1 Upper Body exercises',
        'How much rest between heavy sets?',
        'Tips for muscle recovery after leg day',
      ],
    };
  }

  // 11. Injuries, Pain & Joint Health
  if (q.includes('hurt') || q.includes('pain') || q.includes('injury') || q.includes('knee') || q.includes('shoulder')) {
    return {
      reply: `Here are quick, safe tips to protect your joints during workouts:\n\n- **Knee Pain During Squats:** Make sure your knees point in the same direction as your toes. Don't let your knees cave inward.\n- **Shoulder Pain on Bench Press:** Keep your elbows tucked at roughly a 45-degree angle (like an arrow, not a wide 'T').\n- **Lower Back Pain:** Keep your chest proud and tighten your core like you're about to get punched.\n- **Always Warm Up:** Spend 5 minutes on a treadmill and do 1–2 light warm-up sets before lifting heavy.\n\n⚠️ **Important:** If you feel sharp or stinging pain, stop immediately and rest!`,
      recommendations: [
        'Squat warm-up routine for knee pain',
        'Shoulder warm-up for bench press',
        'Stretching routine for recovery',
      ],
    };
  }

  // 12. Recovery, DOMS, Sleep & Sauna
  if (q.includes('recovery') || q.includes('sore') || q.includes('doms') || q.includes('sleep') || q.includes('sauna')) {
    return {
      reply: `Muscles grow when you rest, not while you lift! Here are 4 easy ways to recover faster:\n\n- **Sleep 7.5 to 8 Hours:** Deep sleep is when your body releases natural growth hormones to repair muscle.\n- **Drink Water:** Aim for 2.5 to 3 liters of water daily. Dehydrated muscles cramp and stay sore longer.\n- **Light Walking:** A 15-minute walk on rest days boosts blood flow and washes away soreness.\n- **Eat Protein After Workouts:** Have a meal with protein (eggs, meat, lentils) within 1–2 hours after training.\n\n💡 **Coach Tip:** If you're very sore, a warm shower or 10 minutes in the sauna does wonders!`,
      recommendations: [
        'Post-workout stretching routine',
        'How much sleep is needed for muscle growth?',
        'Supplements for muscle recovery',
      ],
    };
  }

  // Conversational check: are you working / online / there
  if (
    q.includes('are you working') ||
    q.includes('you working') ||
    q.includes('is this working') ||
    q.includes('are you there') ||
    q.includes('working') ||
    q.includes('status')
  ) {
    return {
      reply: `Yes, ${name}! 🚀 I'm online, connected, and ready to help. What fitness, workout, or nutrition topic can I help you with right now?`,
      recommendations: [
        'Give me a simple chest workout',
        'How much protein should I eat daily?',
        'Give me a simple 4-day workout plan',
        'Healthy Ethiopian gym foods for muscle',
      ],
    };
  }

  // Default Fallback
  return {
    reply: `Hey ${name}! I'm Coach Aria, here to help you get great results from your training and meals. Ask me for a simple workout plan, how to do any exercise, or what healthy foods to eat!`,
    recommendations: [
      'What exercises build chest and arms?',
      'How much protein do I need per day?',
      'Give me a 4-day workout split',
      'Healthy Ethiopian foods for fitness',
    ],
  };
}

/**
 * POST /api/ai/chat
 * Handles fitness coaching queries for members and trainers.
 * Supports Google Gemini API (if GEMINI_API_KEY is configured in .env)
 * with instant fallback to the built-in Sports Science AI engine.
 */
router.post('/chat', isAuthenticated, aiRateLimiter, async (req, res) => {
  try {
    const { message, fitnessGoal, experienceLevel } = req.body;
    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const user = req.user || {};
    const userRole = user.role || 'member';
    const userName = user.name || 'Athlete';
    const goal = fitnessGoal || user.fitnessGoal || 'Hypertrophy & Conditioning';

    let reply = null;
    let recommendations = [];
    let structuredRoutine = null;
    let progressSummary = null;

    // 1. Try Gemini API first if configured
    if (process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYS) {
      reply = await callGemini(message, userRole, userName, goal);
    }

    // 2. If Gemini is not set or failed, use local sports science knowledge engine
    if (!reply) {
      const localResult = getLocalAIResponse(message, userRole, userName, goal);
      reply = localResult.reply;
      recommendations = localResult.recommendations || [];
      structuredRoutine = localResult.structuredRoutine || null;
      progressSummary = localResult.progressSummary || null;
    } else {
      // Add context-relevant recommendations for Gemini answers
      recommendations = [
        'Tell me more about exercise form',
        'What should I eat before and after workout?',
        'Can you create a weekly workout routine?',
      ];
    }

    res.json({
      success: true,
      reply,
      recommendations,
      structuredRoutine,
      progressSummary,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  } catch (error) {
    console.error('AI chat endpoint error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

