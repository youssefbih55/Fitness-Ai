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
  potentialScore?: number;
}

interface MealAnalysis {
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  healthScore: number;
  insight: string;
}

// --- Translations ---
const TRANSLATIONS = {
  en: {
    welcome: "ELITE PERFORMANCE AI",
    start: "Initialize Matrix",
    onboardingTitle: "Biometric Protocol",
    generate: "Synthesize Optimized Plan",
    dashboard: "Command Center",
    stats: "Evolution Tracker",
    bodyScan: "Neural Reconstruction",
    challenges: "Active Trials",
    settings: "Configuration",
    logout: "Deactivate",
    login: "Auth with Google",
    water: "Fluid Saturation",
    estimatedTime: "ETA to Goal",
    analyze: "Start Neural Scan",
    challenges_desc: "Gaming the Success",
    claimReward: "Claim Reward",
    getRecipe: "Analyze Recipe",
    back: "Return to Matrix",
    deleteProgress: "Reset All Progress",
    watchVideo: "Watch Guide",
    muscleGroup: "Muscle Target",
    age: "Age",
    gender: "Gender",
    height: "Height (cm)",
    weight: "Weight (kg)",
    goal: "Primary Goal",
    experience: "Experience Level",
    male: "Male",
    female: "Female",
    loseWeight: "Lose Weight",
    muscleGain: "Gain Muscle",
    maintenance: "Maintenance",
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    analyzingStats: "Analyzing Structure...",
    recipeIntelligence: "Synthesizing Nutrients...",
    bmi: "BMI",
    tdee: "TDEE",
    protein: "Protein",
    carbs: "Carbs",
    fats: "Fats",
    calories: "Calories",
    switchNutrition: "Show Nutrition",
    switchWorkout: "Show Workout",
    downloadPDF: "Download PDF",
    weightEvolution: "Weight Evolution (KG)",
    logWeight: "Log Today's Weight",
    save: "Save",
    weightChange: "Weight Change",
    consistency: "Consistency",
    estimatedStats: "Estimated Stats",
    bodyFat: "Body Fat %",
    bodyType: "Body Type",
    deepAnalysis: "Deep Analysis",
    analyzeNew: "Analyze New Photo",
    potentialScore: "Genetic Potential",
    mealVision: "Meal Analysis Vision",
    analyzeMeal: "Analyze Meal Photo",
    mealName: "Dish Identification",
    healthScore: "Health Score",
    expertInsight: "Nutritional Logic",
    analyzingMeal: "Analyzing Nutrients...",
    waterReminders: "Water Reminders",
    sleepReminders: "Sleep Reminders",
    waterRemindersDesc: "Daily intake push notifications",
    sleepRemindersDesc: "Sleep optimization alerts",
    externalIntegrations: "External Integrations",
    dataManagement: "Data Management",
    ingredients: "Ingredients",
    method: "Preparation Method",
    complexity: "Complexity",
    low: "Low",
    hiChat: "AI Coach",
    askAnything: "Ask anything...",
    syncing: "Syncing Intelligence",
    logoutGoogle: "Logout From Google",
    expertAnalysis: "Daily Expert Analysis",
    expertTip: "Elite Recommendation",
  },
  ar: {
    welcome: "مدرب النخبة الذكي",
    start: "ابدأ البروتوكول",
    onboardingTitle: "البيانات الحيوية",
    generate: "توليد الخطة المثالية",
    dashboard: "مركز القيادة",
    stats: "مؤشرات التطور",
    bodyScan: "المسح الضوئي الذكي",
    challenges: "تحديات النخبة",
    settings: "الإعدادات",
    logout: "خروج",
    login: "دخول جوجل",
    water: "مستوى الترطيب",
    estimatedTime: "موعد الإنجاز",
    analyze: "بدء التحليل البصري",
    challenges_desc: "مستوى احترافي من التحدي",
    claimReward: "استلم الجائزة",
    getRecipe: "تحليل الوصفة",
    back: "العودة للوحة القيادة",
    deleteProgress: "حذف كل البيانات",
    watchVideo: "فيديو توضيحي",
    muscleGroup: "العضلة المستهدفة",
    age: "العمر",
    gender: "الجنس",
    height: "الطول (سم)",
    weight: "الوزن (كيلو)",
    goal: "الهدف الأساسي",
    experience: "المستوى الرياضي",
    male: "ذكر",
    female: "أنثى",
    loseWeight: "خسارة وزن",
    muscleGain: "بناء عضلات",
    maintenance: "حماية الوزن",
    beginner: "مبتدئ",
    intermediate: "متوسط",
    advanced: "متقدم",
    analyzingStats: "جاري تحليل بنية الجسم...",
    recipeIntelligence: "جاري تحليل العناصر...",
    bmi: "مؤشر الكتلة",
    tdee: "السعرات اليومية",
    protein: "بروتين",
    carbs: "كارب",
    fats: "دهون",
    calories: "سعرات",
    switchNutrition: "عرض التغذية",
    switchWorkout: "عرض التمارين",
    downloadPDF: "تحميل PDF",
    weightEvolution: "تطور الوزن (كيلو)",
    logWeight: "سجل وزنك اليوم",
    save: "حفظ",
    weightChange: "تغير الوزن",
    consistency: "الالتزام",
    estimatedStats: "الإحصاءات المتوقعة",
    bodyFat: "نسبة الدهون %",
    bodyType: "نوع الجسم",
    deepAnalysis: "تحليل عميق",
    analyzeNew: "تحليل صورة جديدة",
    potentialScore: "الإمكانيات الجينية",
    mealVision: "تحليل الوجبات بالذكاء الاصطناعي",
    analyzeMeal: "تحليل صورة الوجبة",
    mealName: "اسم الوجبة",
    healthScore: "مؤشر الصحة",
    expertInsight: "رأي خبير التغذية",
    analyzingMeal: "جاري تحليل العناصر الغذائية...",
    waterReminders: "تنبيهات المياه",
    sleepReminders: "تنبيهات النوم",
    waterRemindersDesc: "إشعارات يومية لشرب الماء",
    sleepRemindersDesc: "تنبيهات لتحسين جودة النوم",
    externalIntegrations: "تكامل خارجي",
    dataManagement: "إدارة البيانات",
    ingredients: "المكونات",
    method: "طريقة التحضير",
    complexity: "الصعوبة",
    low: "سهل",
    hiChat: "المدرب الذكي",
    askAnything: "اسأل أي شيء...",
    syncing: "جاري التحليل",
    logoutGoogle: "تسجيل الخروج من جوجل",
    expertAnalysis: "تحليل الخبراء اليومي",
    expertTip: "توصية النخبة",
  }
};

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
  
  const getEstimatedBodyType = (height: number, weight: number): string => {
    const bmi = weight / ((height / 100) ** 2);
    if (bmi < 18.5) return "ectomorph";
    if (bmi > 25 && bmi < 29.9) return "endomorph";
    return "mesomorph";
  };

  useEffect(() => {
    if (formData.height && formData.weight) {
      setFormData(prev => ({ ...prev, bodyType: getEstimatedBodyType(formData.height, formData.weight) }));
    }
  }, [formData.height, formData.weight]);

  const [plan, setPlan] = useState<FullPlan | null>(null);
  const [error, setError] = useState<{ message: string, isUnavailable?: boolean } | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Advanced Features State
  const [weightHistory, setWeightHistory] = useState<WeightRecord[]>([]);
  const [analysisResult, setAnalysisResult] = useState<BodyAnalysis | null>(null);
  const [mealAnalysis, setMealAnalysis] = useState<MealAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingMeal, setIsAnalyzingMeal] = useState(false);
  const [waterGoal, setWaterGoal] = useState(3000); // ml
  const [waterIntake, setWaterIntake] = useState(0);
  const [expertInsight, setExpertInsight] = useState<{ title: string, insight: string, tip: string } | null>(null);
  const [reminders, setReminders] = useState({ water: true, sleep: true });
  
  useEffect(() => {
    if (plan && user) {
      const fetchInsight = async () => {
        try {
          const response = await fetch("/api/expert-insight", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userData: formData, weightHistory }),
          });
          const data = await response.json();
          setExpertInsight(data);
        } catch (e) {
          console.error(e);
        }
      };
      fetchInsight();
    }
  }, [plan, user, weightHistory]);

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

  const handleAnalyzeMeal = async (file: File) => {
    setIsAnalyzingMeal(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const response = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      const data = await response.json();
      setMealAnalysis(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzingMeal(false);
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

  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<any>(null);

  const generateRecipe = async (meal: any) => {
    setSelectedMeal(meal);
    setIsGeneratingRecipe(true);
    setGeneratedRecipe(null);
    try {
      const response = await fetch("/api/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          preferences: formData.preferences, 
          mealType: meal.name 
        }),
      });
      const data = await response.json();
      setGeneratedRecipe(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingRecipe(false);
    }
  };

  const t = TRANSLATIONS[lang];

  const deleteUserProgress = async () => {
    if (!user || !window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف كل بياناتك وتطورك؟ لا يمكن التراجع عن هذا العمل.' : 'Are you sure you want to delete all your progress data? This cannot be undone.')) return;
    
    try {
      // In a real app we'd delete all collections, for now reset local state
      setPlan(null);
      setWeightHistory([]);
      setAnalysisResult(null);
      setWaterIntake(0);
      setStep("onboarding");
      // Note: Full deletion of Firestore collections would require a batch or recursive delete utility
    } catch (e) {
      console.error(e);
    }
  };

  const getExerciseImage = (muscle?: string) => {
    const m = muscle?.toLowerCase() || "";
    if (m.includes("chest")) return "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400&h=300&fit=crop";
    if (m.includes("back")) return "https://images.unsplash.com/photo-1603287611837-f2146f5de8e8?q=80&w=400&h=300&fit=crop";
    if (m.includes("leg")) return "https://images.unsplash.com/photo-1434608519344-49d77a699?q=80&w=400&h=300&fit=crop";
    if (m.includes("shoulder")) return "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=400&h=300&fit=crop";
    if (m.includes("arm") || m.includes("bicep") || m.includes("tricep")) return "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=400&h=300&fit=crop";
    if (m.includes("abs") || m.includes("core")) return "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400&h=300&fit=crop";
    return "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400&h=300&fit=crop";
  };

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
          <motion.div 
            key="landing" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-12 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-grid opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-app-bg to-app-bg" />
            
            <motion.div 
              initial={{ y: 50, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              transition={{ delay: 0.2 }}
              className="relative z-10 space-y-6 max-w-4xl"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 text-brand text-[10px] uppercase font-bold tracking-widest mb-4">
                <Zap size={14} /> Professional Intelligence
              </div>
              <h1 className="text-7xl md:text-[140px] font-black italic text-white tracking-tighter leading-[0.8] mb-4">
                FITNESS <span className="text-brand shadow-[0_0_50px_rgba(163,255,18,0.3)]">AI</span>
              </h1>
              <p className="text-xl md:text-2xl text-white/40 max-w-2xl mx-auto font-light leading-relaxed arabic-text px-4">
                {lang === "ar" 
                  ? "المستقبل الذكي للتدريب والتغذية. خطط مخصصة 100% وتحليل بصري متقدم لجسمك."
                  : "The intelligent future of training and nutrition. 100% personalized plans and advanced visual analysis."}
              </p>
            </motion.div>

            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              transition={{ delay: 0.4 }}
              className="relative z-10 flex flex-col md:flex-row gap-4 w-full max-w-md mx-auto px-6"
            >
              <Button 
                onClick={() => {
                  if (!user) {
                    signInWithGoogle();
                  } else {
                    setStep(plan ? "dashboard" : "onboarding");
                  }
                }} 
                className="flex-1 py-8 text-lg font-bold group bg-brand text-black hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(163,255,18,0.2)]"
              >
                {user ? t.start : t.login}
                <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.6 }}
              className="relative z-10 grid grid-cols-3 gap-6 pt-20 px-4"
            >
              {[
                { l: "AI Precision", v: "100%" },
                { l: "Biometric Data", v: "24/7" },
                { l: "Active Users", v: "10k+" }
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl md:text-3xl font-mono text-white mb-1">{stat.v}</p>
                  <p className="text-[10px] uppercase text-white/20 font-bold tracking-widest">{stat.l}</p>
                </div>
              ))}
            </motion.div>

            {/* Background Accents */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-brand/5 blur-[120px] rounded-full" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-brand/5 blur-[120px] rounded-full" />
          </motion.div>
        )}

        {step === "onboarding" && (
          <motion.div key="onboarding" className="p-10 md:p-20 flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="max-w-4xl w-full space-y-12">
               <div className="text-center">
                <h2 className="text-5xl font-serif italic mb-4">{t.onboardingTitle}</h2>
                <div className="h-1 w-24 bg-brand mx-auto mb-10" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-12 bg-white/[0.02] border border-white/10 rounded-3xl">
                <Input label={t.age} type="number" value={formData.age} onChange={(e: any) => setFormData({...formData, age: Number(e.target.value)})} />
                <Select label={t.gender} value={formData.gender} options={[{ label: t.male, value: "male" }, { label: t.female, value: "female" }]} onChange={(e: any) => setFormData({...formData, gender: e.target.value})} />
                <Input label={t.height} type="number" value={formData.height} onChange={(e: any) => setFormData({...formData, height: Number(e.target.value)})} />
                <Input label={t.weight} type="number" value={formData.weight} onChange={(e: any) => setFormData({...formData, weight: Number(e.target.value)})} />
                <Select label={t.goal} value={formData.goal} options={[{ label: t.loseWeight, value: "lose-weight" }, { label: t.muscleGain, value: "muscle-gain" }, { label: t.maintenance, value: "maintenance" }]} onChange={(e: any) => setFormData({...formData, goal: e.target.value})} />
                <Select label={t.experience} value={formData.experience} options={[{ label: t.beginner, value: "beginner" }, { label: t.intermediate, value: "intermediate" }, { label: t.advanced, value: "advanced" }]} onChange={(e: any) => setFormData({...formData, experience: e.target.value})} />
              </div>
              <div className="flex justify-center">
                <Button onClick={() => setStep("loading")} className="px-12 py-5 font-bold">{t.generate}</Button>
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
                    <p className="text-[10px] text-white/40 uppercase mb-1">{t.bmi}</p>
                    <p className="text-3xl font-mono tracking-tighter text-white">{plan.analysis.bmi.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 uppercase mb-1">{t.tdee}</p>
                    <p className="text-3xl font-mono tracking-tighter text-brand">{plan.analysis.tdee} kcal</p>
                  </div>
                  <Button onClick={() => setActiveTab(activeTab === "workout" ? "nutrition" : "workout")} variant="outline" className="w-full">
                    {activeTab === "workout" ? t.switchNutrition : t.switchWorkout}
                  </Button>
                  <button onClick={exportPDF} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest transition-all">
                    <Download size={14} /> {t.downloadPDF}
                  </button>
              </div>
            </aside>

            <main className="flex-1 space-y-10">
              {activeTab === "workout" && expertInsight && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <Card className="bg-brand/5 border-brand/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Zap size={80} className="text-brand" />
                    </div>
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand/10 rounded-lg">
                          <Activity size={18} className="text-brand" />
                        </div>
                        <h4 className="text-sm font-bold uppercase tracking-widest text-brand">{t.expertAnalysis}</h4>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold">{expertInsight.title}</h3>
                        <p className="text-sm text-white/60 leading-relaxed arabic-text">{expertInsight.insight}</p>
                      </div>
                      <div className="pt-4 border-t border-white/5 flex items-start gap-3">
                        <Trophy size={14} className="text-brand mt-1 shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase font-bold text-brand mb-1">{t.expertTip}</p>
                          <p className="text-xs text-white/40 arabic-text">{expertInsight.tip}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {activeTab === "workout" ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {plan.workoutPlan.days.map((day) => (
                    <Card key={day.dayNumber} className="bg-white/[0.01] hover:bg-white/[0.03] transition-all overflow-hidden p-0">
                       <div className="p-6">
                        <h4 className="text-[10px] text-brand uppercase font-bold mb-1">Day {day.dayNumber}</h4>
                        <h3 className="text-2xl font-bold mb-6">{day.title}</h3>
                       </div>
                       <div className="space-y-4 p-6 pt-0">
                        {day.exercises.map((ex, i) => (
                          <div key={i} className="flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-white/5 group/ex">
                            <div className="w-full md:w-32 h-24 rounded-lg overflow-hidden shrink-0 border border-white/10">
                              <img src={getExerciseImage(ex.muscleGroup)} className="w-full h-full object-cover group-hover/ex:scale-110 transition-transform duration-500" alt={ex.name} />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-bold text-white/90">{ex.name}</h5>
                                  <p className="text-[10px] text-brand uppercase font-medium">{ex.muscleGroup || t.muscleGroup}</p>
                                </div>
                                <span className="font-mono text-brand text-xs font-bold">{ex.sets} × {ex.reps}</span>
                              </div>
                              <div className="flex gap-2">
                                <a 
                                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + ' exercise proper form')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-widest text-white/40 hover:text-brand transition-colors"
                                >
                                  <Zap size={10} className="text-brand" /> {t.watchVideo}
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                       </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Meal Vision Section */}
                  <Card className="bg-white/[0.01] border-brand/20 overflow-hidden p-0">
                    <div className="p-8 space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold uppercase text-brand tracking-widest">{t.mealVision}</h4>
                          <p className="text-white/20 text-[10px] uppercase font-bold tracking-widest">Instant Biometric Food Analysis</p>
                        </div>
                        <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center">
                          <Camera size={18} className="text-brand" />
                        </div>
                      </div>

                      {!mealAnalysis ? (
                        <div className="relative group">
                          <input 
                            type="file" 
                            onChange={(e) => e.target.files?.[0] && handleAnalyzeMeal(e.target.files[0])} 
                            className="hidden" 
                            id="meal-upload" 
                            accept="image/*" 
                          />
                          <Button 
                            onClick={() => document.getElementById('meal-upload')?.click()} 
                            disabled={isAnalyzingMeal}
                            className="w-full py-8 border-dashed border-2 border-white/5 hover:border-brand/30 transition-all bg-transparent"
                          >
                            {isAnalyzingMeal ? (
                              <div className="flex items-center gap-3">
                                <Loader2 className="animate-spin" size={16} />
                                <span>{t.analyzingMeal}</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <div className="text-lg font-bold">{t.analyzeMeal}</div>
                                <div className="text-[9px] opacity-40 uppercase tracking-widest">Neural Vision Processing</div>
                              </div>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                            <div className="p-4 bg-brand/10 rounded-xl">
                              <Utensils size={24} className="text-brand" />
                            </div>
                            <div className="flex-1">
                              <p className="text-[10px] text-white/40 uppercase font-bold">{t.mealName}</p>
                              <p className="text-xl font-bold">{mealAnalysis.mealName}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-white/40 uppercase font-bold">{t.healthScore}</p>
                              <p className="text-2xl font-mono text-brand font-bold">{mealAnalysis.healthScore}/10</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-3">
                            {[
                              { l: t.calories, v: mealAnalysis.calories, u: "kcal" },
                              { l: t.protein, v: mealAnalysis.protein, u: "g" },
                              { l: t.carbs, v: mealAnalysis.carbs, u: "g" },
                              { l: t.fats, v: mealAnalysis.fats, u: "g" },
                            ].map(m => (
                              <div key={m.l} className="bg-white/5 p-3 rounded-xl text-center border border-white/5">
                                <p className="text-[8px] text-white/40 uppercase mb-1">{m.l}</p>
                                <p className="text-sm font-mono font-bold">{m.v}{m.u}</p>
                              </div>
                            ))}
                          </div>

                          <div className="p-5 bg-white/5 rounded-2xl border border-white/5 border-l-4 border-l-brand">
                            <p className="text-[9px] text-brand uppercase font-bold mb-2 tracking-widest">{t.expertInsight}</p>
                            <p className="text-xs text-white/60 arabic-text leading-relaxed">{mealAnalysis.insight}</p>
                          </div>
                          
                          <Button onClick={() => setMealAnalysis(null)} variant="ghost" className="w-full text-[9px]">Reset Analysis</Button>
                        </motion.div>
                      )}
                    </div>
                  </Card>

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
                      <div key={i} className="flex gap-6 items-start group relative">
                         <div className="text-6xl font-serif italic text-white/5 group-hover:text-brand/10 transition-colors pointer-events-none absolute -left-8 top-0">0{i+1}</div>
                         <div className="flex-1 border-b border-white/5 pb-6">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-xl font-bold group-hover:text-brand transition-colors">{meal.name}</h4>
                              <span className="text-xs font-mono text-brand bg-brand/5 px-2 py-1 rounded">{meal.calories} kcal</span>
                            </div>
                            <p className="text-white/40 leading-relaxed mb-4">{meal.description}</p>
                            <button 
                              onClick={() => generateRecipe(meal)}
                              className="text-[10px] uppercase font-bold tracking-widest text-brand hover:underline flex items-center gap-2"
                            >
                              <Zap size={12} /> {t.getRecipe}
                            </button>
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
                    <p className="text-[10px] text-white/40 uppercase mb-1">{t.consistency}</p>
                    <p className="text-3xl font-mono text-white">94%</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === "body-scan" && (
          <motion.div key="body-scan" className="p-6 sm:p-20 max-w-4xl mx-auto space-y-12 relative" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
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
                  <Button onClick={() => document.getElementById('photo-upload')?.click()} disabled={isAnalyzing} className="px-12 py-4 relative overflow-hidden">
                    {isAnalyzing && <div className="scan-line" />}
                    {isAnalyzing ? <><Loader2 className="animate-spin mr-2" size={16} /> Analyzing Structure...</> : t.analyze}
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
                    {analysisResult.potentialScore && (
                      <div className="pt-4 border-t border-white/5">
                        <p className="text-[10px] text-white/40 uppercase mb-3 font-bold tracking-widest">{t.potentialScore}</p>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ width: `${analysisResult.potentialScore * 10}%` }}
                              className="h-full bg-gradient-to-r from-brand/50 to-brand"
                            />
                          </div>
                          <span className="font-mono text-brand font-bold">{analysisResult.potentialScore}/10</span>
                        </div>
                      </div>
                    )}
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
                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest text-center">Data Management</p>
                    <Button onClick={deleteUserProgress} variant="outline" className="w-full border-red-500/20 text-red-500 hover:bg-red-500/10">
                      {t.deleteProgress}
                    </Button>
                 </div>

                 <Button onClick={logout} variant="outline" className="w-full border-white/10 text-white/40 hover:bg-white/5 mt-4">
                   Logout From Google
                 </Button>
              </div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Coach stays the same but maybe more compact */}
      {/* ... previous chat implementation ... */}
      <AnimatePresence>
        {selectedMeal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-app-bg border border-white/10 p-8 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar relative"
            >
              <button 
                onClick={() => setSelectedMeal(null)}
                className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="space-y-8">
                <div className="space-y-2">
                  <h3 className="text-3xl font-serif italic text-brand">{selectedMeal.name}</h3>
                  <p className="text-white/40 arabic-text">{selectedMeal.description}</p>
                </div>

                {isGeneratingRecipe ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-6">
                    <div className="w-16 h-16 border-t-2 border-brand rounded-full animate-spin" />
                    <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-brand animate-pulse">{t.recipeIntelligence}</p>
                  </div>
                ) : generatedRecipe ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                    <div className="grid grid-cols-3 gap-4">
                       <div className="bg-white/5 p-4 rounded-xl text-center">
                          <p className="text-[10px] text-white/20 uppercase mb-1">Calories</p>
                          <p className="text-xl font-mono text-white">{generatedRecipe.calories}</p>
                       </div>
                       <div className="bg-white/5 p-4 rounded-xl text-center">
                          <p className="text-[10px] text-white/20 uppercase mb-1">Protein</p>
                          <p className="text-xl font-mono text-brand">{generatedRecipe.macros.protein}g</p>
                       </div>
                       <div className="bg-white/5 p-4 rounded-xl text-center">
                          <p className="text-[10px] text-white/20 uppercase mb-1">Complexity</p>
                          <p className="text-[10px] font-bold uppercase text-white/40 pt-2">Low</p>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h4 className="text-xs font-bold uppercase text-brand tracking-widest flex items-center gap-2">
                          <Dumbbell size={14} /> {lang === "ar" ? "المكونات" : "Ingredients"}
                       </h4>
                       <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-white/60 arabic-text">
                          {generatedRecipe.ingredients.map((ing: string, i: number) => (
                             <li key={i} className="flex items-center gap-2 bg-white/[0.02] p-3 rounded-lg">
                                <span className="w-1.5 h-1.5 bg-brand rounded-full" />
                                {ing}
                             </li>
                          ))}
                       </ul>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                       <h4 className="text-xs font-bold uppercase text-brand tracking-widest flex items-center gap-2">
                          <Zap size={14} /> {lang === "ar" ? "خطوات التحضير" : "Method"}
                       </h4>
                       <div className="space-y-4 arabic-text">
                          {generatedRecipe.instructions.map((step: string, i: number) => (
                             <div key={i} className="flex gap-4">
                                <span className="text-xl font-serif italic text-brand/20">0{i+1}</span>
                                <p className="text-sm text-white/80 leading-relaxed pt-1">{step}</p>
                             </div>
                          ))}
                       </div>
                    </div>

                    <Button onClick={() => setSelectedMeal(null)} className="w-full py-4 text-[10px]">
                       {t.back}
                    </Button>
                  </motion.div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FloatingChat formData={formData} lang={lang} />

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(163, 255, 18, 0.2); }
        .bg-grid { background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0); background-size: 40px 40px; }
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .scan-line {
          height: 2px;
          background: #a3ff12;
          box-shadow: 0 0 20px #a3ff12, 0 0 40px #a3ff12;
          position: absolute;
          width: 100%;
          animation: scan 2s linear infinite;
        }
      `}} />
    </div>
  );
}

function FloatingChat({ formData, lang = "en" }: { formData: any, lang?: "en" | "ar" }) {
  const t = TRANSLATIONS[lang];
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
                {isChatLoading && (
                  <div className="flex items-center gap-2 pt-2 ml-auto">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                      <div className="w-1 h-1 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-1 h-1 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-brand/40">Syncing Intelligence</span>
                  </div>
                )}
              </div>
              <div className="p-5 bg-white/5 border-t border-white/10 flex gap-3">
                <input value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Ask anything..." className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2 text-sm" />
                <button onClick={handleSendMessage} disabled={isChatLoading} className="bg-brand text-black p-3 rounded-lg flex items-center justify-center hover:bg-brand/80 disabled:opacity-50 transition-colors">
                  <Zap size={20} className={cn(isChatLoading && "animate-pulse")} />
                </button>
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
