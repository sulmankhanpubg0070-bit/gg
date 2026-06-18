import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Edit2, Check, RefreshCw, Palette, Type, Heart, Eye, ArrowRight } from 'lucide-react';

interface GreetingStyle {
  id: string;
  name: string;
  welcomeText: string;
  helloText: string;
  subText: string;
}

export default function App() {
  const stylesList: GreetingStyle[] = [
    {
      id: 'punjabi',
      name: 'Punjabi Touch',
      welcomeText: 'Ji Aayan Nu!',
      helloText: 'Sat Sri Akal',
      subText: 'Dunia de kone kone se aaye saare bhraavan nu dilo bhalia ji aayan nu kehte haan.',
    },
    {
      id: 'urdu',
      name: 'Urdu Adaab',
      welcomeText: 'Khush Amdeed',
      helloText: 'Assalam-o-Alaikum',
      subText: 'Aap ki tashreef aawari hamare liye bais-e-musarrat hai. Khush amdeed o khair maqdam.',
    },
    {
      id: 'modern',
      name: 'Modern Swiss',
      welcomeText: 'WELCOME',
      helloText: 'HELLO',
      subText: 'Experience a new standard of digital interaction. We craft ultra-bold interfaces with strict typographic discipline.',
    },
    {
      id: 'creative',
      name: 'Digital Archive',
      welcomeText: 'ENTER PLACE',
      helloText: 'HELLO GUEST',
      subText: 'Curating modern visuals and typography crafted to perfection. Tap the editor to customize every letter.',
    }
  ];

  // Application state
  const [activeStyle, setActiveStyle] = useState<GreetingStyle>(stylesList[0]);
  const [welcomeInput, setWelcomeInput] = useState<string>(activeStyle.welcomeText);
  const [helloInput, setHelloInput] = useState<string>(activeStyle.helloText);
  const [descriptionInput, setDescriptionInput] = useState<string>(activeStyle.subText);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [previewTheme, setPreviewTheme] = useState<'stark-black' | 'titanium-white' | 'dim-neon'>('stark-black');
  const [fontSize, setFontSize] = useState<'standard' | 'large' | 'huge'>('large');

  // Apply a preset
  const applyPreset = (preset: GreetingStyle) => {
    setActiveStyle(preset);
    setWelcomeInput(preset.welcomeText);
    setHelloInput(preset.helloText);
    setDescriptionInput(preset.subText);
    setIsEditing(false);
  };

  // Reset helper
  const handleReset = () => {
    applyPreset(stylesList[0]);
    setPreviewTheme('stark-black');
    setFontSize('large');
  };

  // Theme styling for the display
  const getThemeClasses = () => {
    switch (previewTheme) {
      case 'titanium-white':
        return 'bg-white text-black border-slate-200';
      case 'dim-neon':
        return 'bg-neutral-900 text-lime-400 border-lime-500/30';
      case 'stark-black':
      default:
        return 'bg-[#0a0a0a] text-white border-white/10';
    }
  };

  // Font size resolver for giant text
  const getGiantSizeClass = () => {
    switch (fontSize) {
      case 'huge':
        return 'text-[3.5rem] sm:text-[6.5rem] md:text-[8rem] lg:text-[8.5rem]';
      case 'standard':
        return 'text-[2.2rem] sm:text-[4rem] md:text-[5.5rem] lg:text-[6rem]';
      case 'large':
      default:
        return 'text-[2.8rem] sm:text-[5.5rem] md:text-[7rem] lg:text-[7.5rem]';
    }
  };

  const getSubGiantSizeClass = () => {
    switch (fontSize) {
      case 'huge':
        return 'text-[3rem] sm:text-[5.5rem] md:text-[7rem] lg:text-[7.5rem]';
      case 'standard':
        return 'text-[1.8rem] sm:text-[3.2rem] md:text-[4.5rem] lg:text-[5rem]';
      case 'large':
      default:
        return 'text-[2.4rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[6.5rem]';
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-between font-sans selection:bg-white selection:text-black antialiased relative overflow-hidden">
      
      {/* Decorative Grid Guideline Overlays */}
      <div className="absolute top-0 right-0 h-full w-[1px] bg-white/5 mr-32 sm:mr-64 pointer-events-none hidden md:block" />
      <div className="absolute top-0 left-0 h-full w-[1px] bg-white/5 ml-16 sm:ml-32 pointer-events-none hidden md:block" />

      {/* Header */}
      <header className="border-b border-white/10 bg-[#050505]/90 backdrop-blur-md sticky top-0 z-30 py-5 px-6 sm:px-12 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-tighter text-white">
            IKV<span className="text-white/40">.STUDIO</span>
          </span>
          <div className="h-4 w-[1px] bg-white/20 mx-1 hidden sm:block" />
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-medium hidden sm:inline">
            Bold Typography Archetype
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold tracking-wider text-slate-400 hover:text-white bg-transparent border border-white/10 rounded-md hover:border-white/30 transition duration-150"
          >
            <RefreshCw className="w-3 h-3" />
            RESET THEME
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl w-full mx-auto px-6 sm:px-12 py-10 flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10">
        
        {/* Left Side: Editorial Typography Controls */}
        <div className="lg:col-span-4 flex flex-col gap-6 order-2 lg:order-1">
          
          {/* Section Indicator */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Section 01</span>
            <div className="h-[1px] bg-white/10 flex-grow" />
          </div>

          {/* Preset Customization Block */}
          <div className="bg-[#0f0f0f] border border-white/10 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4 justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-white" />
                Select Language Mood
              </span>
              <span className="text-[10px] font-mono text-slate-500">Preset Selector</span>
            </div>

            <div className="flex flex-col gap-2">
              {stylesList.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`w-full text-left p-4 rounded border transition-all duration-150 flex justify-between items-center ${
                    activeStyle.id === preset.id
                      ? 'border-white bg-white text-black font-extrabold shadow-lg'
                      : 'border-white/5 bg-[#141414] hover:bg-[#1a1a1a] text-slate-300'
                  }`}
                >
                  <div>
                    <div className="text-xs uppercase tracking-wider">{preset.name}</div>
                    <div className="text-[10px] opacity-70 mt-0.5 font-mono">
                      {preset.welcomeText}  →  {preset.helloText}
                    </div>
                  </div>
                  {activeStyle.id === preset.id && <Check className="w-4 h-4 text-black shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Text Editor Input Panel */}
          <div className="bg-[#0f0f0f] border border-white/10 rounded-lg p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5 text-white" />
                Heading Editor
              </span>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded transition duration-150 ${
                  isEditing
                    ? 'bg-amber-400/90 text-black'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {isEditing ? 'lock grid' : 'edit words'}
              </button>
            </div>

            {isEditing ? (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Welcome Heading (Filled)
                  </label>
                  <input
                    type="text"
                    value={welcomeInput}
                    onChange={(e) => setWelcomeInput(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 bg-[#141414] border border-white/10 rounded text-sm text-white focus:outline-none focus:border-white font-mono uppercase"
                    placeholder="Wecome Text"
                  />
                </div>
                
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Hello Heading (Outlined)
                  </label>
                  <input
                    type="text"
                    value={helloInput}
                    onChange={(e) => setHelloInput(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 bg-[#141414] border border-white/10 rounded text-sm text-white focus:outline-none focus:border-white font-mono uppercase"
                    placeholder="Hello Text"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Slogan/Description Paragraph
                  </label>
                  <textarea
                    rows={3}
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 bg-[#141414] border border-white/10 rounded text-xs text-white focus:outline-none focus:border-white font-sans"
                    placeholder="E.g., Creative Design Agency..."
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 leading-relaxed font-light">
                <p className="mb-2">
                  Aap controls pane se visual theme, size, aur heading values badal sakte hain.
                </p>
                <p>
                  Press <button onClick={() => setIsEditing(true)} className="underline text-white pointer-events-auto">"edit words"</button> to write your bespoke messaging live.
                </p>
              </div>
            )}

            {/* Customizer Sub-sections */}
            <div className="border-t border-white/10 pt-4 flex flex-col gap-4">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  Display Backdrop
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['stark-black', 'titanium-white', 'dim-neon'] as const).map((themeChoice) => (
                    <button
                      key={themeChoice}
                      onClick={() => setPreviewTheme(themeChoice)}
                      className={`py-1.5 text-[10px] font-bold tracking-wider rounded border text-center uppercase transition duration-150 ${
                        previewTheme === themeChoice
                          ? 'border-white bg-white text-black'
                          : 'border-white/10 bg-transparent text-slate-400 hover:text-white'
                      }`}
                    >
                      {themeChoice === 'stark-black' ? 'STARK' : themeChoice === 'titanium-white' ? 'LIGHT' : 'CHROME'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                  <Type className="w-3 h-3" /> Typographic Scale
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['standard', 'large', 'huge'] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setFontSize(sz)}
                      className={`py-1.5 text-[10px] font-bold tracking-wider rounded border text-center uppercase transition duration-150 ${
                        fontSize === sz
                          ? 'border-white bg-white text-black'
                          : 'border-white/10 bg-transparent text-slate-400 hover:text-white'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Showcase Canvas rendering giant bold text */}
        <div className="lg:col-span-8 flex flex-col justify-center items-center order-1 lg:order-2 w-full">
          <motion.div
            layout
            id="greeting-frame"
            className={`w-full p-8 sm:p-12 md:p-16 rounded-lg border flex flex-col justify-between min-h-[500px] lg:min-h-[600px] transition-all duration-300 relative overflow-hidden select-none ${getThemeClasses()}`}
          >
            {/* Minimal line details for architectural aesthetic */}
            <div className="absolute top-0 left-24 h-full w-[1px] bg-current opacity-[0.03] pointer-events-none" />
            <div className="absolute top-0 right-24 h-full w-[1px] bg-current opacity-[0.03] pointer-events-none" />

            {/* Top Row inside Stage */}
            <div className="flex justify-between items-baseline z-10 w-full mb-8">
              <div className="flex items-baseline gap-2.5">
                <span className="text-[10px] font-bold tracking-widest uppercase opacity-40">Section 01</span>
                <span className="text-[10px] font-mono tracking-widest opacity-25">// DUAL STATE</span>
              </div>
              <div className="text-[10px] font-mono tracking-widest opacity-40 flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${previewTheme === 'dim-neon' ? 'bg-lime-400' : 'bg-red-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${previewTheme === 'dim-neon' ? 'bg-lime-500' : 'bg-red-500'}`}></span>
                </span>
                LIVE STAGE
              </div>
            </div>

            {/* Middle giant layout */}
            <div className="flex-grow flex flex-col justify-center items-start gap-1 sm:gap-2 select-text">
              
              {/* Dynamic Welcome text (Solid fill) */}
              <motion.div
                key={welcomeInput}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="w-full text-left"
              >
                <h1 className={`font-black uppercase tracking-tighter leading-none ${getGiantSizeClass()}`}>
                  {welcomeInput || "WELCOME"}
                </h1>
              </motion.div>

              {/* Hello row combining outline text and rotated badge */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-1 w-full text-left">
                <motion.div
                  key={helloInput}
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
                >
                  <h2 className={`font-black uppercase tracking-tighter leading-none text-outline ${getSubGiantSizeClass()}`}>
                    {helloInput || "HELLO"}
                  </h2>
                </motion.div>

                {/* Rotating typographic emblem pill */}
                <motion.div
                  initial={{ rotate: -5, scale: 0.9 }}
                  animate={{ rotate: 12, scale: 1 }}
                  transition={{ duration: 0.5, type: "spring" }}
                  whileHover={{ scale: 1.1, rotate: -6 }}
                  className={`px-3 py-3 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center text-center font-bold text-[9px] sm:text-[10px] leading-tight uppercase transition-colors shrink-0 shadow-lg ${
                    previewTheme === 'titanium-white'
                      ? 'bg-black text-white'
                      : previewTheme === 'dim-neon'
                      ? 'bg-lime-400 text-black border border-black/10'
                      : 'bg-white text-black'
                  }`}
                >
                  Creative Bold Design Arch NYC
                </motion.div>
              </div>

              {/* Dynamic Description / Slogan paragraph */}
              <div className="w-full flex justify-end mt-4 sm:mt-8">
                <div className="max-w-md text-right">
                  <motion.p
                    key={descriptionInput}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    transition={{ delay: 0.3 }}
                    className="text-xs sm:text-sm font-light leading-relaxed opacity-75"
                  >
                    {descriptionInput || "Experience a new standard of digital interaction. We build interfaces that command attention and drive engagement through uncompromising typographic discipline."}
                  </motion.p>
                </div>
              </div>
            </div>

            {/* Grid line separator */}
            <div className="h-[1px] bg-current opacity-10 w-full my-6" />

            {/* Bottom Row inside Stage */}
            <div className="flex justify-between items-end w-full">
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[9px] uppercase tracking-widest opacity-40">Bespoke Creator</span>
                <span className="text-xs font-mono font-bold flex items-center gap-1.5">
                  SULMAN KHAN DIGITAL
                </span>
              </div>
              <div className="flex flex-col items-end gap-1 text-right">
                <span className="text-[9px] uppercase tracking-widest opacity-40">Licence</span>
                <span className="text-xs font-mono opacity-80">© 2026 IKV ARCHIVE</span>
              </div>
            </div>

          </motion.div>
        </div>

      </main>

      {/* Footer */}
      <footer className="py-8 px-6 sm:px-12 border-t border-white/10 bg-[#050505] flex flex-col sm:flex-row justify-between items-center gap-4 z-10">
        <div className="flex flex-col gap-0.5 text-center sm:text-left">
          <span className="text-[9px] uppercase tracking-widest text-slate-500">SYSTEM AGGREGATOR ARCHIVE</span>
          <span className="text-xs font-mono flex items-center justify-center sm:justify-start gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            COMPILATION COMPLETED : LIVE VIEW ACTIVE
          </span>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-1">
          Crafted with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> • IKV Digital Studio
        </div>
      </footer>
    </div>
  );
}
