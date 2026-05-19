import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Dumbbell, 
  Utensils, 
  TrendingUp, 
  ChevronRight, 
  ChevronLeft, 
  Loader2, 
  CheckCircle2, 
  MessageSquare, 
  X,
  Target,
  Scale,
  Activity,
  User,
  Zap,
  Clock,
  AlertTriangle,
  Camera,
  Download,
  LogOut,
  Settings,
  Droplets,
  Moon,
  Globe,
  Trophy
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { UserData, FullPlan } from "@/types";
import { 
  auth, 
  db, 
  signInWithGoogle, 
  logout, 
  OperationType, 
  handleFirestoreError 
} from "./lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  setDoc, 
  doc, 
  getDoc,
  serverTimestamp 
} from "firebase/firestore";
import { useAuth, FirebaseProvider } from "./components/FirebaseProvider";

// --- Components ---

const Button = ({ 
  children, 
  className, 
  variant = 'primary', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' }) => {
  const variants = {
    primary: "bg-white text-black hover:bg-brand font-bold shadow-lg hover:shadow-brand/20",
    secondary: "bg-brand text-black hover:bg-brand-dark",
    outline: "border border-white/10 hover:border-brand hover:text-brand bg-transparent text-white/80",
    ghost: "hover:bg-white/5 text-white/40 hover:text-white"
  };
  
  return (
    <button 
      className={cn(
        "px-6 py-3 rounded-md font-semibold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none uppercase tracking-widest text-[10px]",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) => (
  <div id={id} className={cn("bg-white/[0.02] border border-white/5 rounded-2xl p-6 backdrop-blur-sm", className)}>
    {children}
  </div>
);

const Input = ({ label, className, arabicLabel, ...props }: any) => (
  <div className="space-y-2">
    <label className="flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 px-1">
      <span className="font-display">{label}</span>
      {arabicLabel && <span className="arabic-text font-medium">{arabicLabel}</span>}
    </label>
    <input 
      {...props}
      className={cn(
        "w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-zinc-100 placeholder:text-white/20 focus:outline-none focus:border-brand/50 transition-all text-sm font-mono",
        className
      )}
    />
  </div>
);

const Select = ({ label, options, arabicLabel, ...props }: any) => (
  <div className="space-y-2">
    <label className="flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 px-1">
      <span className="font-display">{label}</span>
      {arabicLabel && <span className="arabic-text font-medium">{arabicLabel}</span>}
    </label>
    <select 
      {...props}
      className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:border-brand/50 transition-all appearance-none cursor-pointer text-sm font-mono"
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value} className="bg-app-bg">{opt.label}</option>
      ))}
    </select>
  </div>
);

const Navbar = ({ onReset }: { onReset: () => void }) => (
  <nav className="flex items-center justify-between px-8 py-4 border-b border-white/10 bg-app-bg/80 backdrop-blur-md sticky top-0 z-40">
    <div className="flex items-center gap-3 cursor-pointer group" onClick={onReset}>
      <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center transition-transform group-hover:rotate-12">
        <div className="w-3 h-3 bg-black rounded-sm rotate-45"></div>
      </div>
      <span className="text-xl font-bold tracking-tighter uppercase italic text-white">Fitness AI</span>
    </div>
    <div className="flex items-center gap-6">
      <div className="text-right hidden sm:block">
        <p className="text-[10px] text-white/40 uppercase tracking-widest">Coach Status</p>
        <p className="text-xs font-medium text-brand">AI Active Analysis</p>
      </div>
      <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-display font-bold">
        AI
      </div>
    </div>
  </nav>
);

// --- Main App Implementation ---

interface WeightRecord {
  date: string;
  weight: number;
}

interface BodyAnalysis {
  bodyFatRange: string;
  bodyType: string;
  analysis: string;
  advice: string;
}

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<"landing" | "onboarding" | "loading" | "dashboard" | "stats" | "body-scan" | "challenges" | "settings">("landing");
  const [activeTab, setActiveTab] = useState<"workout" | "nutrition">("workout");
  const [lang, setLang] = useState<"en" | "ar">("ar");
  const [formData, setFormData] = useState<UserData>({
    age: 28,
    gender: "male",
    height: 184,
    weight: 82.5,
    goal: "muscle-gain",
    experience: "intermediate",
    trainingDays: 5,
    sessionDuration: 75,
    location: "gym",
    equipment: "full-gym",
    injuries: "None",
    bodyType: "mesomorph",
    allergies: "None",
    preferences: "High Protein",
    budget: "Medium",
    mealsPerDay: 5,
    sleepHours: 8,
    activityLevel: "Moderate"
  });
  
  const [plan, setPlan] = useState<FullPlan | null>(null);
  const [error, setError] = useState<{ message: string, isUnavailable?: boolean } | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Advanced Features State
  const [weightHistory, setWeightHistory] = useState<WeightRecord[]>([]);
  const [analysisResult, setAnalysisResult] = useState<BodyAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [waterGoal, setWaterGoal] = useState(3000); // ml
  const [waterIntake, setWaterIntake] = useState(0);
  const [reminders, setReminders] = useState({ water: true, sleep: true });
  
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Load User Data & Plan
  useEffect(() => {
    if (user) {
      const q = query(collection(db, `users/${user.uid}/weightLogs`), orderBy("date", "asc"));
      const unsub = onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
          date: format(doc.data().date.toDate(), "MMM dd"),
          weight: doc.data().weight
        }));
        setWeightHistory(logs);
      });

      // Load Water
      const today = format(new Date(), "yyyy-MM-dd");
      const waterDoc = doc(db, `users/${user.uid}/water/${today}`);
      getDoc(waterDoc).then(s => {
        if (s.exists()) setWaterIntake(s.data().amount);
      });

      return () => unsub();
    }
  }, [user]);

  useEffect(() => {
    if (step === "loading") {
      const generatePlan = async () => {
        setError(null);
        try {
          const response = await fetch("/api/generate-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });
          
          const data = await response.json();
          if (!response.ok) throw data;
          
          setPlan(data);
          
          // Save Plan to Firebase
          if (user) {
            await addDoc(collection(db, `users/${user.uid}/plans`), {
              planData: data,
              createdAt: serverTimestamp()
            });
          }
          
          setStep("dashboard");
        } catch (err: any) {
          setError({ message: err.details || err.error || "Error", isUnavailable: err.isUnavailable });
          setStep("onboarding");
        }
      };
      generatePlan();
    }
  }, [step, formData, user]);

  const handleWeightUpdate = async (newWeight: number) => {
    if (!user) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/weightLogs`), {
        weight: newWeight,
        date: serverTimestamp()
      });
      setFormData(prev => ({ ...prev, weight: newWeight }));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, "weightLogs");
    }
  };

  const handleWaterAdd = async (amount: number) => {
    if (!user) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const newAmount = waterIntake + amount;
    try {
      await setDoc(doc(db, `users/${user.uid}/water/${today}`), {
        userId: user.uid,
        amount: newAmount,
        date: today
      });
      setWaterIntake(newAmount);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, "water");
    }
  };

  const handleAnalyzeBody = async (file: File) => {
    setIsAnalyzing(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const response = await fetch("/api/analyze-body", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, userData: formData }),
      });
      const data = await response.json();
      setAnalysisResult(data);

      if (user) {
        await addDoc(collection(db, `users/${user.uid}/progressPhotos`), {
          photoUrl: "base64_hidden_for_demo",
          analysis: data,
          date: serverTimestamp()
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportPDF = async () => {
    if (!dashboardRef.current) return;
    const canvas = await html2canvas(dashboardRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("fitness-ai-plan.pdf");
  };

  const t = {
    en: {
      welcome: "AI Personal Trainer",
      start: "Start Your Journey",
      onboardingTitle: "Biometric Data",
      generate: "Generate Custom Plan",
      dashboard: "Performance Dashboard",
      stats: "Evolution",
      bodyScan: "Body Scan",
      settings: "Settings",
      logout: "Logout",
      login: "Login with Google",
      water: "Water Intake",
      estimatedTime: "Goal Arrival",
      analyze: "Analyze Photo",
      challenges: "Active Challenges",
      claimReward: "Claim Reward"
    },
    ar: {
      welcome: "مدربك الذكي للياقة",
      start: "ابدأ رحلتك الآن",
      onboardingTitle: "بياناتك البدنية",
      generate: "توليد الخطة المخصصة",
      dashboard: "لوحة التحكم",
      stats: "تطور الجسم",
      bodyScan: "تحليل الصور",
      settings: "الإعدادات",
      logout: "تسجيل الخروج",
      login: "الدخول بحساب جوجل",
      water: "متابعة المياه",
      estimatedTime: "موعد الوصول للهدف",
      analyze: "تحليل الصورة",
      challenges: "التحديات الحالية",
      claimReward: "استلم الجائزة"
    }
  }[lang];

  if (authLoading) return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center">
      <Loader2 className="animate-spin text-brand" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-app-bg text-white selection:bg-brand selection:text-black overflow-x-hidden" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      {step !== "landing" && step !== "loading" && (
        <nav className="flex items-center justify-between px-8 py-4 border-b border-white/10 bg-app-bg/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setStep("landing")}>
            <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center">
              <Zap size={16} className="text-black" />
            </div>
            <span className="text-xl font-bold tracking-tighter uppercase italic text-white">Fitness AI</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="p-2 rounded-full hover:bg-white/5 text-white/40">
              <Globe size={20} />
            </button>
            
            {user ? (
              <div className="flex items-center gap-4">
                <div onClick={() => setStep("settings")} className="cursor-pointer flex items-center gap-2 group">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-white/40 uppercase font-bold">{user.displayName}</p>
                    <p className="text-[9px] text-brand uppercase">{formData.goal}</p>
                  </div>
                  <img src={user.photoURL || ""} className="w-10 h-10 rounded-full border border-white/10 group-hover:border-brand transition-colors" alt="profile" />
                </div>
                <button onClick={logout} className="p-2 rounded-full hover:bg-red-500/10 text-red-500">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Button onClick={signInWithGoogle} variant="outline" className="text-[10px]">
                {t.login}
              </Button>
            )}
          </div>
        </nav>
      )}

      {/* Tabs Menu */}
      {step !== "landing" && step !== "onboarding" && step !== "loading" && (
        <div className="flex justify-center border-b border-white/5 bg-white/[0.01]">
          {[
            { id: "dashboard", label: t.dashboard, icon: Activity },
            { id: "stats", label: t.stats, icon: TrendingUp },
            { id: "body-scan", label: t.bodyScan, icon: Camera },
            { id: "challenges", label: t.challenges, icon: Trophy },
            { id: "settings", label: t.settings, icon: Settings },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setStep(item.id as any)}
              className={cn(
                "px-6 sm:px-8 py-4 text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.2em] flex items-center gap-2 transition-all border-b-2",
                step === item.id ? "border-brand text-brand bg-brand/5" : "border-transparent text-white/40 hover:text-white"
              )}
            >
              <item.icon size={14} />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === "landing" && (
          <motion.div key="landing" className="flex flex-col items-center justify-center min-h-screen px-6 text-center space-y-12 bg-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="space-y-6 max-w-4xl" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-brand text-[10px] uppercase font-bold tracking-widest">
                <Zap size={14} /> Professional AI Coaching
              </div>
              <h1 className="text-8xl md:text-[140px] font-serif italic tracking-tighter leading-[0.8] arabic-text">
                {lang === "ar" ? "مدربك" : "Your"} <span className="text-brand">{lang === "ar" ? "الذكي" : "AI"}</span> <br />
                {lang === "ar" ? "للياقة البدنية" : "Fitness Pro"}
              </h1>
              <p className="text-white/40 text-xl md:text-3xl max-w-2xl mx-auto arabic-text font-light">
                {lang === "ar" ? "حول جسمك باستخدام أقوى تقنيات الذكاء الاصطناعي في التدريب والتغذية." : "Transform your body with the world's most advanced AI training matrix."}
              </p>
            </motion.div>
            <Button onClick={() => setStep(user ? "onboarding" : "landing")} className="px-16 py-6 text-lg rounded-none" onClickCapture={() => !user && signInWithGoogle()}>
              {user ? t.start : t.login}
            </Button>
          </motion.div>
        )}

        {step === "onboarding" && (
          <motion.div key="onboarding" className="p-20 flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="max-w-4xl w-full space-y-12">
               <div className="text-center">
                <h2 className="text-5xl font-serif italic mb-4">{t.onboardingTitle}</h2>
                <div className="h-1 w-24 bg-brand mx-auto mb-10" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-12 bg-white/[0.02] border border-white/10 rounded-3xl">
                <Input label="Age" type="number" value={formData.age} onChange={(e: any) => setFormData({...formData, age: Number(e.target.value)})} />
                <Select label="Gender" value={formData.gender} options={[{ label: "Male", value: "male" }, { label: "Female", value: "female" }]} onChange={(e: any) => setFormData({...formData, gender: e.target.value})} />
                <Input label="Height (cm)" type="number" value={formData.height} onChange={(e: any) => setFormData({...formData, height: Number(e.target.value)})} />
                <Input label="Weight (kg)" type="number" value={formData.weight} onChange={(e: any) => setFormData({...formData, weight: Number(e.target.value)})} />
                <Select label="Goal" value={formData.goal} options={[{ label: "Lose Weight", value: "lose-weight" }, { label: "Gain Muscle", value: "muscle-gain" }, { label: "Maintenance", value: "maintenance" }]} onChange={(e: any) => setFormData({...formData, goal: e.target.value})} />
                <Select label="Experience" value={formData.experience} options={[{ label: "Beginner", value: "beginner" }, { label: "Intermediate", value: "intermediate" }, { label: "Advanced", value: "advanced" }]} onChange={(e: any) => setFormData({...formData, experience: e.target.value})} />
              </div>
              <div className="flex justify-center">
                <Button onClick={() => setStep("loading")} className="px-12 py-5">{t.generate}</Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === "dashboard" && plan && (
          <motion.div key="dashboard" ref={dashboardRef} className="p-10 flex flex-col lg:flex-row gap-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <aside className="w-full lg:w-80 space-y-8">
               <Card className="bg-brand text-black">
                <p className="text-[10px] uppercase font-bold opacity-60 mb-2">{t.estimatedTime}</p>
                <div className="flex items-center gap-3">
                  <Clock size={24} />
                  <p className="text-2xl font-bold tracking-tighter">{plan.analysis.estimatedTime}</p>
                </div>
              </Card>

              <Card className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] uppercase font-bold text-white/40">{t.water}</h4>
                  <Droplets size={16} className="text-blue-400" />
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-xs font-mono">
                    <span>{waterIntake}ml</span>
                    <span className="text-white/20">Target: {waterGoal}ml</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min(100, (waterIntake/waterGoal)*100)}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleWaterAdd(250)} className="bg-white/5 hover:bg-white/10 py-2 rounded text-[10px] font-bold">+250ml</button>
                  <button onClick={() => handleWaterAdd(500)} className="bg-white/5 hover:bg-white/10 py-2 rounded text-[10px] font-bold">+500ml</button>
                </div>
              </Card>

              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">
                 <div>
                    <p className="text-[10px] text-white/40 uppercase mb-1">Current BMI</p>
                    <p className="text-3xl font-mono tracking-tighter text-white">{plan.analysis.bmi.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 uppercase mb-1">TDEE</p>
                    <p className="text-3xl font-mono tracking-tighter text-brand">{plan.analysis.tdee} kcal</p>
                  </div>
                  <Button onClick={prev => setActiveTab(activeTab === "workout" ? "nutrition" : "workout")} variant="outline" className="w-full">
                    {activeTab === "workout" ? "Switch to Nutrition" : "Switch to Workout"}
                  </Button>
                  <button onClick={exportPDF} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest transition-all">
                    <Download size={14} /> Download PDF
                  </button>
              </div>
            </aside>

            <main className="flex-1 space-y-10">
              {activeTab === "workout" ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {plan.workoutPlan.days.map((day) => (
                    <Card key={day.dayNumber} className="bg-white/[0.01] hover:bg-white/[0.03] transition-all">
                       <h4 className="text-[10px] text-brand uppercase font-bold mb-1">Day {day.dayNumber}</h4>
                       <h3 className="text-2xl font-bold mb-6">{day.title}</h3>
                       <div className="space-y-4">
                        {day.exercises.map((ex, i) => (
                          <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-white/5">
                            <span className="font-medium text-white/80">{ex.name}</span>
                            <span className="font-mono text-brand text-xs">{ex.sets} × {ex.reps}</span>
                          </div>
                        ))}
                       </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-3 gap-6">
                    {[
                      { l: "Protein", v: plan.nutritionPlan.macros.protein },
                      { l: "Carbs", v: plan.nutritionPlan.macros.carbs },
                      { l: "Fats", v: plan.nutritionPlan.macros.fats },
                    ].map(m => (
                      <Card key={m.l} className="text-center">
                        <p className="text-[10px] text-white/40 uppercase mb-1">{m.l}</p>
                        <p className="text-3xl font-mono tracking-tighter">{m.v}g</p>
                      </Card>
                    ))}
                  </div>
                  <div className="space-y-6">
                    {plan.nutritionPlan.meals.map((meal, i) => (
                      <div key={i} className="flex gap-6 items-start group">
                         <div className="text-6xl font-serif italic text-white/5 group-hover:text-brand/10 transition-colors">0{i+1}</div>
                         <div className="flex-1 border-b border-white/5 pb-6">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-xl font-bold">{meal.name}</h4>
                              <span className="text-xs font-mono text-brand">{meal.calories} kcal</span>
                            </div>
                            <p className="text-white/40 leading-relaxed">{meal.description}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </main>
          </motion.div>
        )}

        {step === "stats" && (
          <motion.div key="stats" className="p-20 max-w-6xl mx-auto space-y-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-serif italic">{t.stats}</h2>
              <p className="text-white/20 uppercase tracking-[0.4em] text-[10px] font-bold">Biometric Longitudinal Analysis</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <Card className="h-[400px] flex flex-col">
                <h3 className="text-[10px] uppercase font-bold text-white/40 mb-6 px-2">Weight Evolution (KG)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weightHistory}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a3ff12" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#a3ff12" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="date" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                    <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="weight" stroke="#a3ff12" fillOpacity={1} fill="url(#colorWeight)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <div className="space-y-6">
                <Card>
                  <h4 className="text-xs font-bold uppercase mb-4">Log Today's Weight</h4>
                  <div className="flex gap-4">
                    <input type="number" placeholder="Enter weight..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-6 py-4 focus:outline-none focus:border-brand" onKeyDown={(e: any) => e.key === 'Enter' && handleWeightUpdate(Number(e.target.value))} />
                    <Button onClick={() => {}} className="px-8">Save</Button>
                  </div>
                </Card>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-white/40 uppercase mb-1">Weight Change</p>
                    <p className="text-3xl font-mono text-brand">-2.4 KG</p>
                  </div>
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-white/40 uppercase mb-1">Consistency</p>
                    <p className="text-3xl font-mono text-white">94%</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === "body-scan" && (
          <motion.div key="body-scan" className="p-6 sm:p-20 max-w-4xl mx-auto space-y-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-serif italic text-brand shadow-brand/20 drop-shadow-2xl">{t.bodyScan}</h2>
              <p className="text-white/20 uppercase tracking-[0.4em] text-[10px] font-bold">Visual Neural Reconstruction</p>
            </div>

            <div className="space-y-8">
              {!analysisResult ? (
                <div className="border-2 border-dashed border-white/10 rounded-3xl p-10 sm:p-20 text-center space-y-6 hover:border-brand/30 transition-all group bg-white/[0.01]">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform group-hover:bg-brand/10">
                    <Camera size={36} className="text-white/40 group-hover:text-brand" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <p className="text-2xl font-bold mb-2">Upload Body Photo</p>
                    <p className="text-sm text-white/20 arabic-text leading-relaxed">
                      ارفع صورة واضحة للجسم ليقوم الذكاء الاصطناعي بتحليل عميق لنسبة الدهون وتوزيع العضلات وشكل الجسم.
                    </p>
                  </div>
                  <input type="file" onChange={(e) => e.target.files?.[0] && handleAnalyzeBody(e.target.files[0])} className="hidden" id="photo-upload" accept="image/*" />
                  <Button onClick={() => document.getElementById('photo-upload')?.click()} disabled={isAnalyzing} className="px-12 py-4">
                    {isAnalyzing ? <><Loader2 className="animate-spin mr-2" size={16} /> Analyzing...</> : t.analyze}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="space-y-6 bg-white/[0.01] border-brand/20">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <h4 className="text-sm font-bold uppercase text-brand">Estimated Stats</h4>
                      <CheckCircle2 size={20} className="text-brand" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <p className="text-[10px] text-white/40 uppercase mb-1">Body Fat %</p>
                          <p className="text-4xl font-mono text-brand font-bold">{analysisResult.bodyFatRange}</p>
                       </div>
                       <div>
                          <p className="text-[10px] text-white/40 uppercase mb-1">Body Type</p>
                          <p className="text-xl font-bold">{analysisResult.bodyType}</p>
                       </div>
                    </div>
                  </Card>
                  <Card className="space-y-4 bg-white/[0.01] border-white/5">
                    <h4 className="text-xs font-bold uppercase text-brand">Deep Analysis</h4>
                    <p className="text-sm leading-relaxed text-white/60 arabic-text">{analysisResult.analysis}</p>
                    <div className="bg-brand/5 p-4 rounded-xl border border-brand/10">
                      <p className="text-xs font-light text-white/80 arabic-text"><strong>نصيحة الخبير:</strong> {analysisResult.advice}</p>
                    </div>
                    <Button onClick={() => setAnalysisResult(null)} variant="ghost" className="w-full text-[10px] hover:bg-white/5">Analyze New Photo</Button>
                  </Card>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {step === "challenges" && (
          <motion.div key="challenges" className="p-6 sm:p-20 max-w-5xl mx-auto space-y-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-serif italic text-brand">{t.challenges}</h2>
              <p className="text-white/20 uppercase tracking-[0.4em] text-[10px] font-bold">Gaming the Success</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Hydration Hero", desc: "Keep water intake above 3L for 7 days.", icon: Droplets, progress: 80, badge: "Master of Water", color: "blue" },
                { title: "Early Bird", desc: "Sleep before 11 PM for 5 consecutive nights.", icon: Moon, progress: 40, badge: "Zen Walker", color: "purple" },
                { title: "Protein King", desc: "Hit your protein goal 10 days in a row.", icon: Zap, progress: 20, badge: "Anabolic Titan", color: "brand" },
              ].map((c, idx) => (
                <Card key={idx} className="bg-white/[0.01] border-white/5 hover:border-brand/30 transition-all flex flex-col group">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", 
                    c.color === "blue" ? "bg-blue-500/20 text-blue-400" : 
                    c.color === "purple" ? "bg-purple-500/20 text-purple-400" : 
                    "bg-brand/20 text-brand")}>
                    <c.icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{c.title}</h3>
                  <p className="text-xs text-white/40 mb-6 flex-1">{c.desc}</p>
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-[10px] uppercase font-bold">
                      <span className="text-white/20">Progress</span>
                      <span className="text-brand">{c.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-brand transition-all duration-500" style={{ width: `${c.progress}%` }} />
                    </div>
                  </div>
                  <button disabled={c.progress < 100} className={cn("w-full py-3 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all", 
                    c.progress >= 100 ? "bg-brand text-black shadow-[0_0_20px_rgba(163,255,18,0.3)]" : "bg-white/5 text-white/20 cursor-not-allowed")}>
                    {c.progress >= 100 ? t.claimReward : "In Progress"}
                  </button>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {step === "settings" && (
           <motion.div key="settings" className="p-6 sm:p-20 max-w-2xl mx-auto space-y-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="text-center space-y-4">
                <h2 className="text-5xl font-serif italic underline decoration-brand/30 underline-offset-8">{t.settings}</h2>
              </div>
              <div className="space-y-6">
                 <Card className="flex items-center justify-between bg-white/[0.01] border-white/5">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Droplets size={20} />
                       </div>
                       <div>
                          <p className="font-bold">Water Reminders</p>
                          <p className="text-xs text-white/40">Daily intake push notifications</p>
                       </div>
                    </div>
                    <button onClick={() => setReminders({...reminders, water: !reminders.water})} className={cn("w-12 h-6 rounded-full transition-all relative overflow-hidden", reminders.water ? "bg-brand" : "bg-white/10")}>
                       <div className={cn("w-4 h-4 bg-white rounded-full transition-all absolute top-1", reminders.water ? "left-7" : "left-1")} />
                    </button>
                 </Card>

                 <Card className="flex items-center justify-between bg-white/[0.01] border-white/5">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <Moon size={20} />
                       </div>
                       <div>
                          <p className="font-bold">Sleep Reminders</p>
                          <p className="text-xs text-white/40">Sleep optimization alerts</p>
                       </div>
                    </div>
                    <button onClick={() => setReminders({...reminders, sleep: !reminders.sleep})} className={cn("w-12 h-6 rounded-full transition-all relative overflow-hidden", reminders.sleep ? "bg-brand" : "bg-white/10")}>
                       <div className={cn("w-4 h-4 bg-white rounded-full transition-all absolute top-1", reminders.sleep ? "left-7" : "left-1")} />
                    </button>
                 </Card>

                 <div className="pt-6 border-t border-white/5 space-y-4">
                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest text-center">External Integrations</p>
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" className="text-[10px] border-white/5 opacity-40 cursor-not-allowed">Apple Health</Button>
                      <Button variant="outline" className="text-[10px] border-white/5 opacity-40 cursor-not-allowed">Google Fit</Button>
                    </div>
                 </div>

                 <Button onClick={logout} variant="outline" className="w-full border-red-500/20 text-red-500 hover:bg-red-500/10 mt-10">
                   Logout From Google
                 </Button>
              </div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Coach stays the same but maybe more compact */}
      {/* ... previous chat implementation ... */}
      <FloatingChat formData={formData} />

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(163, 255, 18, 0.2); }
        .bg-grid { background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0); background-size: 40px 40px; }
      `}} />
    </div>
  );
}

function FloatingChat({ formData }: { formData: any }) {
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userMsg = inputMessage;
    setInputMessage("");
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, userData: formData }),
      });
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'bot', text: data.text }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'bot', text: "عذراً، حدث خطأ ما." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="fixed bottom-10 left-10 z-50">
      <AnimatePresence>
        {showChat && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="absolute bottom-24 left-0 w-80 md:w-[400px] h-[550px] bg-app-bg border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-2xl">
              <div className="bg-white/5 border-b border-white/5 p-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-black">
                    <MessageSquare size={18} />
                  </div>
                  <h5 className="text-[10px] font-bold uppercase tracking-widest text-white">AI Coach</h5>
                </div>
                <button onClick={() => setShowChat(false)} className="text-white/20 hover:text-white"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={cn("max-w-[85%] p-4 rounded-xl text-sm arabic-text", msg.role === 'user' ? "bg-white/5 mr-auto text-white" : "bg-brand/10 text-white ml-auto")}>{msg.text}</div>
                ))}
                {isChatLoading && <div className="text-xs text-brand/40 animate-pulse ml-auto">Thinking...</div>}
              </div>
              <div className="p-5 bg-white/5 border-t border-white/10 flex gap-3">
                <input value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Ask anything..." className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2 text-sm" />
                <button onClick={handleSendMessage} className="bg-brand text-black p-3 rounded-lg"><ChevronLeft size={20} /></button>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setShowChat(!showChat)} className="w-16 h-16 rounded-full bg-brand text-black shadow-2xl flex items-center justify-center hover:scale-105 transition-all">
        {showChat ? <X size={28} /> : <MessageSquare size={28} />}
      </button>
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}
