import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { io, Socket } from "socket.io-client";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner"; // ✅ FIXED: Use Sonner

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  ShieldCheck, 
  Smartphone, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  LayoutDashboard 
} from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { user } = useAuth();
  
  // State for Email Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // State for QR Login
  const [socket, setSocket] = useState<Socket | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isQrScanned, setIsQrScanned] = useState(false);
  const [activeTab, setActiveTab] = useState("qr");

  // If already logged in, go home
  if (user) {
    setLocation("/");
    return null;
  }

  // 1. WebSocket Connection for QR Code
  useEffect(() => {
    const newSocket = io("/", { path: "/socket.io/" });

    newSocket.on("connect", () => {
      console.log("[WebSocket] Connected for QR Login:", newSocket.id);
      setQrCodeData(newSocket.id || null);
      newSocket.emit("join-login-session");
    });

    // Listen for success signal from Mobile App via Backend
    newSocket.on("dashboard-login-success", async (data) => {
      console.log("Login Success via QR:", data);
      setIsQrScanned(true);
      
      // ✅ FIXED: Sonner Toast Syntax
      toast.success("Verified!", {
        description: `Welcome back, ${data.user.name || "Admin"}`,
      });

      setTimeout(async () => {
        await utils.auth.me.invalidate();
        window.location.href = "/"; // Hard reload to ensure cookies/session update
      }, 1500);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // 2. Existing Firebase Email Logic
  const onEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();

      const resp = await fetch("/api/auth/firebase/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      });

      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}));
        throw new Error(j?.error || "Login failed");
      }

      await utils.auth.me.invalidate();
      
      toast.success("Login successful"); // ✅ FIXED
      setLocation("/");
    } catch (e: any) {
      setErr(e?.message || "Login failed");
      toast.error("Login failed", { description: e?.message }); // ✅ FIXED
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 overflow-hidden font-sans">
      
      {/* LEFT SIDE: Branding / Artwork (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-slate-950 relative items-center justify-center p-12 overflow-hidden">
        {/* Abstract Background Effects */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-lg text-white"
        >
          <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-blue-900/50">
            <LayoutDashboard className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight leading-tight mb-6">
            Digital Identity <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              Admin Portal
            </span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Manage users, verify KYC documents, and monitor system activity in real-time. 
            Securely sync with your mobile application.
          </p>

          <div className="flex gap-6 mt-12">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <ShieldCheck className="w-5 h-5 text-green-400" /> Enterprise Security
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 className="w-5 h-5 text-blue-400" /> Real-time Sync
            </div>
          </div>
        </motion.div>
      </div>

      {/* RIGHT SIDE: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {/* Mobile Background Blob */}
        <div className="lg:hidden absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-blue-200/50 rounded-full blur-[80px]" />

        <Card className="w-full max-w-md border-0 shadow-2xl shadow-slate-200/60 bg-white/90 backdrop-blur-xl z-10 overflow-hidden">
          {/* Top Accent Line */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
          
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
              <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
            </div>

            <Tabs defaultValue="qr" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 p-1 rounded-lg">
                <TabsTrigger value="qr" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-md transition-all">
                  <Smartphone className="w-4 h-4 mr-2" /> Scan QR
                </TabsTrigger>
                <TabsTrigger value="email" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-md transition-all">
                  <Mail className="w-4 h-4 mr-2" /> Email
                </TabsTrigger>
              </TabsList>

              {/* QR CODE TAB */}
              <TabsContent value="qr" className="mt-0 min-h-[300px] flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                  {isQrScanned ? (
                     <motion.div
                       initial={{ opacity: 0, scale: 0.8 }}
                       animate={{ opacity: 1, scale: 1 }}
                       className="flex flex-col items-center justify-center py-8 space-y-4"
                     >
                       <div className="h-24 w-24 bg-green-50 rounded-full flex items-center justify-center mb-2">
                         <CheckCircle2 className="h-12 w-12 text-green-600" />
                       </div>
                       <h3 className="text-xl font-bold text-slate-800">Verification Complete</h3>
                       <p className="text-slate-500 text-sm">Redirecting to dashboard...</p>
                       <Loader2 className="h-5 w-5 animate-spin text-slate-400 mt-4" />
                     </motion.div>
                  ) : (
                    <motion.div
                      key="qr-view"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex flex-col items-center space-y-6"
                    >
                      <div className="relative group p-1 bg-white rounded-2xl shadow-sm border border-slate-100">
                        {qrCodeData ? (
                          <QRCodeSVG 
                            value={qrCodeData} 
                            size={200}
                            level="H"
                            className="p-2"
                            imageSettings={{
                              src: "/icon-192.png", 
                              x: undefined,
                              y: undefined,
                              height: 30,
                              width: 30,
                              excavate: true,
                            }}
                          />
                        ) : (
                          <div className="h-[200px] w-[200px] flex flex-col items-center justify-center bg-slate-50 rounded-xl">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                            <span className="text-xs text-slate-400">Connecting...</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-center space-y-1">
                        <p className="text-sm font-medium text-slate-900">Scan with Mobile App</p>
                        <p className="text-xs text-slate-500 max-w-[200px] mx-auto">
                          Open your Digital-ID app and point the camera at this code.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>

              {/* EMAIL TAB */}
              <TabsContent value="email">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-2"
                >
                  <form onSubmit={onEmailSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="password">Password</Label>
                        <span className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer font-medium">Forgot?</span>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-11"
                      />
                    </div>

                    {err && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        {err}
                      </motion.div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 mt-2" 
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating...
                        </>
                      ) : (
                        <>
                          Sign In <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </motion.div>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <div className="bg-slate-50/50 p-4 text-center border-t border-slate-100">
             <p className="text-xs text-slate-400">
               Protected by Enterprise Grade Security. <br/>
               &copy; {new Date().getFullYear()} Digital-ID System.
             </p>
          </div>
        </Card>
      </div>
    </div>
  );
}