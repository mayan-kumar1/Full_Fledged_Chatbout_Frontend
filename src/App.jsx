import React, { useState, useEffect, useContext, createContext } from "react";
import { FileText, Send, Upload, LogOut, Menu, X, Loader2 } from "lucide-react";

// You can change this to your actual backend URL if it's hosted elsewhere
const API_BASE = "http://127.0.0.1:8000";

// --- Authentication Context ---
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    // API expects application/x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${API_BASE}/api/v1/auth/login/access-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Invalid credentials");
    }

    const data = await response.json();
    // Assuming standard FastAPI return of {"access_token": "...", "token_type": "bearer"}
    const token = typeof data === "string" ? data : data.access_token;

    const userData = { token, username };
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// --- Components ---

const LandingPage = ({ onNavigate }) => (
  <div className="min-h-screen bg-slate-50">
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">PDF Chat</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate("login")}
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => onNavigate("signup")}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </nav>

    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight">
          Chat with your <span className="text-blue-600">Documents</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
          Upload your PDF documents and ask questions instantly. Our AI analyzes
          your content to provide accurate, context-aware answers.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <button
            onClick={() => onNavigate("signup")}
            className="px-8 py-3.5 text-base font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-all hover:scale-105"
          >
            Get Started for Free
          </button>
          <button
            onClick={() => onNavigate("login")}
            className="px-8 py-3.5 text-base font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-all"
          >
            Existing User
          </button>
        </div>
      </div>

      <div className="mt-24 grid md:grid-cols-3 gap-8">
        {[
          {
            icon: Upload,
            title: "Upload PDFs",
            desc: "Drag and drop your files securely.",
          },
          {
            icon: Send,
            title: "Ask Questions",
            desc: "Chat naturally with your documents.",
          },
          {
            icon: FileText,
            title: "Get Summaries",
            desc: "Extract key insights in seconds.",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
              <item.icon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">
              {item.title}
            </h3>
            <p className="text-slate-600 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </main>
  </div>
);

const AuthLayout = ({ title, subtitle, children, onNavigate }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <div className="text-center mb-8">
        <div className="inline-flex bg-blue-600 p-2 rounded-xl mb-4">
          <FileText className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="text-slate-600 mt-2">{subtitle}</p>
      </div>
      {children}
      <div className="mt-6 text-center">
        <button
          onClick={() => onNavigate("landing")}
          className="text-sm text-slate-500 hover:text-slate-900 font-medium"
        >
          ← Back to home
        </button>
      </div>
    </div>
  </div>
);

const LoginPage = ({ onNavigate }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(formData.username, formData.password);
    } catch (err) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account"
      onNavigate={onNavigate}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Username
          </label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Password
          </label>
          <input
            type="password"
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Don't have an account?{" "}
        <button
          onClick={() => onNavigate("signup")}
          className="text-blue-600 font-semibold hover:underline"
        >
          Sign up
        </button>
      </p>
    </AuthLayout>
  );
};

const SignupPage = ({ onNavigate }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail?.[0]?.msg || "Failed to sign up.");
      }

      // Automatically log in after successful signup
      await login(formData.username, formData.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Start chatting with your PDFs"
      onNavigate={onNavigate}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Username
          </label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            type="email"
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Password
          </label>
          <input
            type="password"
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <button
          onClick={() => onNavigate("login")}
          className="text-blue-600 font-semibold hover:underline"
        >
          Log in
        </button>
      </p>
    </AuthLayout>
  );
};

const Dashboard = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [processing, setProcessing] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !file) return;

    const userQuestion = input;
    setMessages((prev) => [...prev, { role: "user", content: userQuestion }]);
    setInput("");
    setProcessing(true);

    try {
      const response = await fetch(`${API_BASE}/api/v1/pdfs/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ question: userQuestion }),
      });

      if (!response.ok) {
        throw new Error("Failed to query PDF");
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: "Sorry, there was an error processing your query.",
        },
      ]);
    } finally {
      setProcessing(false);
    }
  };

  const handleFileUpload = async (e) => {
    const uploaded = e.target.files[0];
    if (uploaded) {
      setFile(uploaded);
      setMessages([
        {
          role: "system",
          content: `Uploading and processing "${uploaded.name}"...`,
        },
      ]);

      const formData = new FormData();
      formData.append("file", uploaded);

      try {
        const response = await fetch(`${API_BASE}/api/v1/pdfs/upload-pdf`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        setMessages([
          {
            role: "system",
            content: `Document "${uploaded.name}" processed. Ask away!`,
          },
        ]);
      } catch (err) {
        setFile(null);
        setMessages([
          {
            role: "system",
            content: `Failed to upload "${uploaded.name}". Please try again.`,
          },
        ]);
      }
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full"
        } bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ease-in-out relative`}
      >
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-white tracking-wide">PDF Chat</span>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-6">
            <label
              htmlFor="upload"
              className="flex items-center justify-center w-full p-3 border-2 border-dashed border-slate-700 rounded-lg hover:border-slate-500 hover:bg-slate-800 transition-all cursor-pointer group"
            >
              <div className="flex flex-col items-center">
                <Upload className="h-5 w-5 mb-2 text-slate-500 group-hover:text-white" />
                <span className="text-xs font-medium">Upload New PDF</span>
              </div>
              <input
                id="upload"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 pl-2">
              Active Document
            </h3>
            {file ? (
              <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 text-sm text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-400 shrink-0" />
                <span className="truncate">{file.name}</span>
              </div>
            ) : (
              <div className="px-3 py-2 text-sm text-slate-500 italic">
                No document selected
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">
                {user?.username}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col w-full h-full relative">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <Menu className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
          <h1 className="font-semibold text-slate-800">
            {file ? file.name : "Select a document"}
          </h1>
          <div className="w-9" /> {/* Spacer for centering */}
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          <div className="max-w-3xl mx-auto space-y-6">
            {!file && messages.length === 0 && (
              <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8">
                <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <Upload className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Upload a PDF to start
                </h3>
                <p className="text-slate-500 max-w-sm">
                  Your documents are processed securely. Upload a file via the
                  sidebar to begin asking questions.
                </p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : msg.role === "system"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100 text-center w-full max-w-lg mx-auto text-sm"
                        : "bg-white text-slate-700 border border-slate-200 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm sm:text-base leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}

            {processing && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 px-5 py-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  <span className="text-sm text-slate-500">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSend} className="max-w-3xl mx-auto relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!file || processing}
              placeholder={
                file
                  ? "Ask a question about this document..."
                  : "Please upload a PDF first"
              }
              className="w-full pl-5 pr-14 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={!file || !input.trim() || processing}
              className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-0 disabled:scale-75 transition-all duration-200"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

// --- Main App Logic ---

const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState("landing");

  // Redirect to dashboard on login
  useEffect(() => {
    if (user) setCurrentPage("dashboard");
  }, [user]);

  // Handle Logout redirect
  useEffect(() => {
    if (!user && currentPage === "dashboard") setCurrentPage("landing");
  }, [user, currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  switch (currentPage) {
    case "login":
      return <LoginPage onNavigate={setCurrentPage} />;
    case "signup":
      return <SignupPage onNavigate={setCurrentPage} />;
    case "dashboard":
      return user ? (
        <Dashboard onNavigate={setCurrentPage} />
      ) : (
        <LoginPage onNavigate={setCurrentPage} />
      );
    default:
      return <LandingPage onNavigate={setCurrentPage} />;
  }
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
