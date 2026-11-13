import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GymLogo from '../components/GymLogo';
import {
  Clock,
  MapPin,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Users,
  Calendar,
  ArrowRight,
  Menu,
  X,
  Search,
  Star
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();

  // Mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  const [currentSlide, setCurrentSlide] = useState(0);
  // Search modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Hero carousel slides inspired directly by the reference image
  const slides = [
    {
      id: 1,
      tagline: 'SHAPE YOUR BODY',
      titleHighlight: 'STRONG',
      titlePrefix: 'BE ',
      titleSuffix: 'TRAINING HARD',
      description: 'Push beyond your limits with calibrated strength equipment, Olympic platforms, and high-intensity conditioning programs.',
      bgImage: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1920&q=80',
      primaryBtn: 'GET INFO',
      secondaryBtn: 'JOIN NOW',
    },
    {
      id: 2,
      tagline: 'UNLEASH YOUR POWER',
      titleHighlight: 'POWER',
      titlePrefix: 'BUILD ',
      titleSuffix: 'CRUSH GOALS',
      description: 'Science-backed workout routines tailored by certified strength coaches for maximum hypertrophy and athletic longevity.',
      bgImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1920&q=80',
      primaryBtn: 'VIEW PLANS',
      secondaryBtn: 'START TODAY',
    },
    {
      id: 3,
      tagline: 'HIGH-INTENSITY COMMUNITY',
      titleHighlight: 'TOGETHER',
      titlePrefix: 'TRAIN ',
      titleSuffix: 'ACHIEVE MORE',
      description: 'Join elite group fitness classes led by enthusiastic trainers who hold you accountable every single repetition.',
      bgImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1920&q=80',
      primaryBtn: 'CLASS SCHEDULE',
      secondaryBtn: 'EXPLORE PASS',
    },
  ];

  // Auto-advance slides every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const scrollToSection = (id) => {
    setActiveNav(id);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Featured gym classes
  const classesList = [
    {
      id: 'c1',
      title: 'HIIT Blast',
      category: 'Conditioning',
      time: '07:00 - 08:00 AM',
      days: 'Mon / Wed / Fri',
      trainer: 'Staff Trainer',
      spots: 'Open Registration',
      image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'c2',
      title: 'Heavy Strength',
      category: 'Powerlifting',
      time: '05:00 - 06:30 PM',
      days: 'Tue / Thu / Sat',
      trainer: 'Staff Coach',
      spots: 'Open Registration',
      image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'c3',
      title: 'Functional Core',
      category: 'Core & Mobility',
      time: '09:00 - 10:00 AM',
      days: 'Mon / Wed',
      trainer: 'Movement Coach',
      spots: 'Open Registration',
      image: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'c4',
      title: 'Cross Conditioning',
      category: 'Athletic Performance',
      time: '06:30 - 07:30 PM',
      days: 'Everyday',
      trainer: 'Conditioning Coach',
      spots: 'Open Registration',
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    },
  ];

  // Membership plans
  const plansList = [
    {
      name: 'Basic',
      price: '500',
      period: 'per month',
      popular: false,
      description: 'Ideal for independent lifters needing consistent gym floor access.',
      features: [
        'Full Gym Floor Access',
        'Standard Free Weights & Barbells',
        'Cardio Deck & Machines',
        'Locker Room & Shower Access',
        'Mobile App Check-in',
      ],
      cta: 'Choose Basic',
      targetPlan: 'Basic',
    },
    {
      name: 'Standard',
      price: '1,000',
      period: 'per month',
      popular: true,
      description: 'Our most popular all-around athletic membership with classes & sauna.',
      features: [
        'Everything in Basic',
        'Unlimited Group Fitness Classes',
        'Sauna & Recovery Lounge',
        'Monthly Body Composition Scan',
        'Diet & Nutrition Guideline',
        'Priority Locker Assignment',
      ],
      cta: 'Get Standard',
      targetPlan: 'Standard',
    },
    {
      name: 'Premium VIP',
      price: '2,000',
      period: 'per month',
      popular: false,
      description: 'The ultimate training package with 1-on-1 personal coaching.',
      features: [
        'Everything in Standard',
        '4 x Personal Trainer Sessions / month',
        'Custom Tailored Workout Mesocycles',
        'Personal Towel & Locker Service',
        'VIP Guest Passes (2 per month)',
        'Direct Coach WhatsApp Support',
      ],
      cta: 'Get Premium',
      targetPlan: 'Premium',
    },
  ];

  // Trainers
  const trainersList = [
    {
      name: 'Strength & Conditioning',
      role: 'Head Strength Coach',
      specialty: 'Powerlifting & Hypertrophy',
      exp: 'Certified Coach',
      image: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Functional Fitness',
      role: 'Group Class Specialist',
      specialty: 'HIIT & Conditioning',
      exp: 'Certified Coach',
      image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Mobility & Form',
      role: 'Athlete Recovery Lead',
      specialty: 'Mobility & Injury Prevention',
      exp: 'Certified Coach',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-orange-600 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER / NAVBAR (Exact Inspiration Match) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#0a0a0c]/90 backdrop-blur-md border-b border-zinc-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <GymLogo size="md" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-zinc-300">
            <button
              onClick={() => scrollToSection('home')}
              className={`transition-colors hover:text-orange-500 ${
                activeNav === 'home' ? 'text-orange-500' : ''
              }`}
            >
              HOME
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className={`transition-colors hover:text-orange-500 ${
                activeNav === 'about' ? 'text-orange-500' : ''
              }`}
            >
              ABOUT US
            </button>
            <button
              onClick={() => scrollToSection('classes')}
              className={`transition-colors hover:text-orange-500 ${
                activeNav === 'classes' ? 'text-orange-500' : ''
              }`}
            >
              CLASSES
            </button>
            <button
              onClick={() => scrollToSection('team')}
              className={`transition-colors hover:text-orange-500 ${
                activeNav === 'team' ? 'text-orange-500' : ''
              }`}
            >
              OUR TEAM
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className={`transition-colors hover:text-orange-500 ${
                activeNav === 'pricing' ? 'text-orange-500' : ''
              }`}
            >
              PRICING
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className={`transition-colors hover:text-orange-500 ${
                activeNav === 'contact' ? 'text-orange-500' : ''
              }`}
            >
              CONTACT
            </button>
          </nav>

          {/* Right Action Icons & Auth Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Search Icon Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="text-zinc-400 hover:text-white transition-colors p-1.5"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            <Link
              to="/login"
              className="px-4 py-2 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              SIGN IN
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider rounded-md transition-all shadow-md shadow-orange-600/30"
            >
              JOIN NOW
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-zinc-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0d0d10] border-b border-zinc-800 px-4 py-5 space-y-3">
            <div className="flex flex-col space-y-2 text-sm font-bold uppercase tracking-wider">
              <button
                onClick={() => scrollToSection('home')}
                className="text-left py-2 text-orange-500"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-left py-2 text-zinc-300 hover:text-white"
              >
                About Us
              </button>
              <button
                onClick={() => scrollToSection('classes')}
                className="text-left py-2 text-zinc-300 hover:text-white"
              >
                Classes
              </button>
              <button
                onClick={() => scrollToSection('team')}
                className="text-left py-2 text-zinc-300 hover:text-white"
              >
                Our Team
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-left py-2 text-zinc-300 hover:text-white"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-left py-2 text-zinc-300 hover:text-white"
              >
                Contact
              </button>
            </div>
            <div className="pt-4 border-t border-zinc-800 flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full text-center py-2.5 bg-zinc-900 border border-zinc-700 text-white font-bold text-xs uppercase tracking-wider rounded-md"
              >
                Member Sign In
              </Link>
              <Link
                to="/register"
                className="w-full text-center py-2.5 bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-md"
              >
                Join As Member
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO CAROUSEL SECTION (Exact Inspiration Layout) */}
      {/* ========================================================================= */}
      <section id="home" className="relative h-[85vh] min-h-[580px] max-h-[850px] flex items-center overflow-hidden">
        {/* Background Image with dramatic moody gym gradients */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-105"
          style={{ backgroundImage: `url(${slide.bgImage})` }}
        >
          {/* Multi-layered cinematic gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-black/60" />
          {/* Subtle warm athletic glow */}
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Carousel Arrow Controls (Left & Right as in reference) */}
        <button
          onClick={handlePrevSlide}
          className="absolute left-4 sm:left-8 z-30 w-12 h-12 rounded-lg bg-black/40 hover:bg-orange-600/90 text-white flex items-center justify-center border border-zinc-800/80 backdrop-blur-sm transition-all group"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <button
          onClick={handleNextSlide}
          className="absolute right-4 sm:right-8 z-30 w-12 h-12 rounded-lg bg-black/40 hover:bg-orange-600/90 text-white flex items-center justify-center border border-zinc-800/80 backdrop-blur-sm transition-all group"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Hero Content (Positioned as seen in the inspiration image) */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex justify-end">
          <div className="max-w-2xl lg:mr-12 animate-fade-in">
            {/* Small uppercase tracked tagline */}
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-zinc-300 mb-4 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-orange-500 inline-block"></span>
              {slide.tagline}
            </p>

            {/* Giant, bold athletic headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-white leading-[1.05]">
              {slide.titlePrefix}
              <span className="text-orange-500">{slide.titleHighlight}</span>
              <br />
              {slide.titleSuffix}
            </h1>

            {/* Concise athletic description */}
            <p className="mt-5 text-sm sm:text-base text-zinc-300 max-w-lg leading-relaxed font-normal">
              {slide.description}
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => scrollToSection('pricing')}
                className="px-8 py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-none shadow-lg shadow-orange-600/30 hover:shadow-orange-600/50 transition-all active:scale-95"
              >
                {slide.primaryBtn}
              </button>

              <Link
                to="/register"
                className="px-8 py-3.5 border-2 border-white/80 hover:border-orange-500 hover:text-orange-500 text-white font-bold text-xs uppercase tracking-widest rounded-none transition-all"
              >
                {slide.secondaryBtn}
              </Link>
            </div>
          </div>
        </div>

        {/* Slide Indicators at bottom */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all ${
                currentSlide === idx ? 'w-8 bg-orange-500' : 'w-2.5 bg-zinc-600 hover:bg-zinc-400'
              }`}
            />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. ABOUT GYM SECTION */}
      {/* ========================================================================= */}
      <section id="about" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-orange-500">ABOUT OUR GYM</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mt-2 leading-tight">
              WE ARE COMMITTED TO FORGING REAL STRENGTH
            </h2>
            <p className="text-sm text-zinc-400 mt-5 leading-relaxed">
              Founded on the belief that real physical transformation requires discipline, elite facilities, and authentic coaching. Our facility combines old-school iron grit with modern sports medicine data tracking.
            </p>

            <div className="grid grid-cols-2 gap-6 mt-8">
              <div className="border-l-2 border-orange-500 pl-4">
                <p className="text-xl sm:text-2xl font-black text-white uppercase">Olympic Iron</p>
                <p className="text-xs uppercase tracking-wider text-zinc-400 mt-1">Calibrated Free Weights & Racks</p>
              </div>
              <div className="border-l-2 border-orange-500 pl-4">
                <p className="text-xl sm:text-2xl font-black text-white uppercase">QR Access</p>
                <p className="text-xs uppercase tracking-wider text-zinc-400 mt-1">Instant Digital Entry Pass</p>
              </div>
              <div className="border-l-2 border-orange-500 pl-4">
                <p className="text-xl sm:text-2xl font-black text-white uppercase">Progress Tracking</p>
                <p className="text-xs uppercase tracking-wider text-zinc-400 mt-1">Daily Logs & Strength Analytics</p>
              </div>
              <div className="border-l-2 border-orange-500 pl-4">
                <p className="text-xl sm:text-2xl font-black text-white uppercase">Fast Checkout</p>
                <p className="text-xs uppercase tracking-wider text-zinc-400 mt-1">Telebirr, CBE & Cash Support</p>
              </div>
            </div>

            <div className="mt-8">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                <span>CLAIM 1-DAY PASS</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-4/3 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl relative">
              <img
                src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1000&q=80"
                alt="Gym Weight Floor"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-black/60 backdrop-blur-md border border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-orange-500">Facility Standard</p>
                  <p className="text-sm font-semibold text-white">ISO-Certified Calibrated Free Weights Floor</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-black">
                  ★
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CLASSES GRID SECTION */}
      {/* ========================================================================= */}
      <section id="classes" className="py-20 bg-[#0d0d10] border-y border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-orange-500">OUR WORKOUTS</span>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mt-1">
                FEATURED TRAINING CLASSES
              </h2>
            </div>
            <Link
              to="/register"
              className="text-xs font-bold uppercase tracking-wider text-orange-500 hover:text-orange-400 flex items-center gap-1.5"
            >
              <span>View Full Weekly Schedule</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {classesList.map((cls) => (
              <div
                key={cls.id}
                className="bg-[#141418] rounded-xl overflow-hidden border border-zinc-800 hover:border-orange-500/60 transition-all flex flex-col group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={cls.image}
                    alt={cls.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141418] via-transparent to-transparent" />
                  <span className="absolute top-3 left-3 bg-black/70 text-orange-500 border border-zinc-700/60 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                    {cls.category}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-orange-500 transition-colors">
                      {cls.title}
                    </h3>
                    <div className="mt-3 space-y-1.5 text-xs text-zinc-400">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-orange-500" />
                        <span>{cls.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{cls.days}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Instructor: <strong className="text-zinc-200">{cls.trainer}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">{cls.spots}</span>
                    <Link
                      to="/register"
                      className="text-xs font-bold text-orange-500 hover:underline uppercase"
                    >
                      Enroll &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. MEMBERSHIP PRICING SECTION */}
      {/* ========================================================================= */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-orange-500">MEMBERSHIP TIERS</span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mt-1">
            CHOOSE YOUR COMMITMENT
          </h2>
          <p className="text-sm text-zinc-400 mt-3">
            Transparent rates with zero hidden registration fees. Upgrade or cancel anytime directly in your member portal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plansList.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 flex flex-col justify-between transition-all relative ${
                plan.popular
                  ? 'bg-[#15151a] border-2 border-orange-500 shadow-2xl shadow-orange-600/20 scale-105 z-10'
                  : 'bg-[#111114] border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-[11px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md">
                  MOST POPULAR
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold uppercase tracking-wider text-white">{plan.name}</h3>
                  {plan.popular && <Star className="w-5 h-5 text-orange-500 fill-orange-500" />}
                </div>

                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-4xl sm:text-5xl font-black text-white">{plan.price}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-500 ml-1">ETB</span>
                  <span className="text-xs text-zinc-400 ml-2">/ month</span>
                </div>

                <p className="text-xs text-zinc-400 mb-6 leading-relaxed">{plan.description}</p>

                <div className="space-y-3 pt-4 border-t border-zinc-800">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Included Features:</p>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-800/80">
                <Link
                  to={`/register?plan=${plan.targetPlan}`}
                  className={`w-full block text-center py-3.5 font-black text-xs uppercase tracking-widest transition-all ${
                    plan.popular
                      ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/30'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. EXPERT COACHES SECTION */}
      {/* ========================================================================= */}
      <section id="team" className="py-20 bg-[#0d0d10] border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-500">EXPERT GUIDANCE</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mt-1">
              MEET OUR HEAD COACHES
            </h2>
            <p className="text-xs text-zinc-400 mt-2">
              Every trainer on our floor is certified in biomechanics, movement screening, and injury mitigation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trainersList.map((t, idx) => (
              <div
                key={idx}
                className="bg-[#141418] border border-zinc-800 rounded-xl overflow-hidden hover:border-orange-500/60 transition-all group"
              >
                <div className="h-72 overflow-hidden relative">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141418] via-transparent to-transparent" />
                </div>
                <div className="p-5 text-center">
                  <h3 className="text-lg font-bold text-white">{t.name}</h3>
                  <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider mt-1">{t.role}</p>
                  <p className="text-xs text-zinc-400 mt-2">{t.specialty}</p>
                  <span className="inline-block mt-3 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[11px] text-zinc-300 font-medium">
                    {t.exp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. MOTIVATIONAL BANNER */}
      {/* ========================================================================= */}
      <section className="relative py-20 bg-gradient-to-r from-orange-600 to-orange-700 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-black/70">NO EXCUSES LEFT</p>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mt-1">
              START YOUR FITNESS JOURNEY TODAY
            </h2>
            <p className="text-sm text-white/90 mt-2 max-w-xl">
              Create your member account in under 60 seconds, choose your preferred plan, and get immediate QR access to the gym.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <Link
              to="/register"
              className="px-8 py-4 bg-black hover:bg-zinc-900 text-white font-black text-xs uppercase tracking-widest rounded-none shadow-xl transition-all"
            >
              REGISTER ONLINE
            </Link>
            <Link
              to="/login"
              className="px-6 py-4 border-2 border-white text-white font-black text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all"
            >
              SIGN IN
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. LOCATION & CONTACT FOOTER */}
      {/* ========================================================================= */}
      <footer id="contact" className="bg-[#070709] border-t border-zinc-800 text-zinc-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-zinc-800">
            {/* Brand Col */}
            <div className="space-y-4">
              <GymLogo size="lg" />
              <p className="text-xs text-zinc-400 leading-relaxed">
                Premier athletic fitness center and digital management system designed for high performance, strength, and community.
              </p>
              <div className="flex items-center gap-3 text-xs text-zinc-400 pt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-white font-medium">Facility Open Now</span>
              </div>
            </div>

            {/* Hours */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Operating Hours</h4>
              <ul className="space-y-2.5 text-xs">
                <li className="flex justify-between pb-1 border-b border-zinc-800/60">
                  <span>Monday - Friday</span>
                  <span className="font-semibold text-white">06:00 AM - 10:00 PM</span>
                </li>
                <li className="flex justify-between pb-1 border-b border-zinc-800/60">
                  <span>Saturday</span>
                  <span className="font-semibold text-white">07:00 AM - 09:00 PM</span>
                </li>
                <li className="flex justify-between pb-1 border-b border-zinc-800/60">
                  <span>Sunday</span>
                  <span className="font-semibold text-white">08:00 AM - 08:00 PM</span>
                </li>
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/login" className="hover:text-orange-500 transition-colors">Shared Member & Staff Login</Link></li>
                <li><Link to="/register" className="hover:text-orange-500 transition-colors">Public Member Registration</Link></li>
                <li><a href="#pricing" onClick={() => scrollToSection('pricing')} className="hover:text-orange-500 transition-colors">Membership Pricing</a></li>
                <li><a href="#classes" onClick={() => scrollToSection('classes')} className="hover:text-orange-500 transition-colors">Weekly Class Roster</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Get In Touch</h4>
              <ul className="space-y-2.5 text-xs">
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span>Bole Subcity, GymPro Athletic Complex, Addis Ababa</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>+251 911 234 567 / +251 116 789 012</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>info@gympro.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
            <p>&copy; {new Date().getFullYear()} GYM & Fitness Management System. All rights reserved.</p>
            <div className="flex gap-4">
              <Link to="/login" className="hover:text-white">Staff Login</Link>
              <Link to="/register" className="hover:text-white">Join As Member</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Simple Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-zinc-700 w-full max-w-lg rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Search Gym & Classes</h3>
              <button onClick={() => setIsSearchOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4">
              <input
                type="text"
                autoFocus
                placeholder="Search classes, trainers, or memberships..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setIsSearchOpen(false)}
                className="px-4 py-2 bg-zinc-800 text-white text-xs font-semibold rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
