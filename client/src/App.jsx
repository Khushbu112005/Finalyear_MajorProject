import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Search, 
  MapPin, 
  User, 
  AlertTriangle, 
  FileText, 
  HelpCircle, 
  RefreshCw, 
  BookOpen, 
  ArrowLeft, 
  Briefcase,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PhoneCall,
  ExternalLink,
  Layers,
  ChevronLeft
} from 'lucide-react'

// Demo scenarios to inject mock data on demand
const DEMO_SCENARIOS = {
  default: {
    label: "Standard Profile (Maharashtra Farmer)",
    context: {
      age: 28,
      gender: "Female",
      state: "Maharashtra",
      district: "Pune",
      ruralUrban: "Rural",
      occupation: "Farmer",
      employmentStatus: "Farmer",
      annualIncome: 180000,
      socialCategory: "General",
      disabilityStatus: false,
      studentStatus: false,
      availableDocuments: ["Aadhaar Card", "Bank Account Passbook / Proof"]
    }
  },
  unemployed: {
    label: "Scenario A & B — Job Loss",
    context: {
      age: 24,
      gender: "Male",
      state: "", // Will trigger state clarification!
      district: "",
      ruralUrban: "Urban",
      occupation: "None",
      employmentStatus: "Unemployed",
      annualIncome: 80000,
      socialCategory: "OBC",
      disabilityStatus: false,
      studentStatus: false,
      availableDocuments: ["Aadhaar Card"] // Missing income & emp cards
    }
  },
  student: {
    label: "Scenario C — Education Scholarship",
    context: {
      age: 19,
      gender: "Female",
      state: "Karnataka",
      district: "Bangalore",
      ruralUrban: "Urban",
      occupation: "Student",
      employmentStatus: "Unemployed",
      annualIncome: 150000,
      socialCategory: "OBC",
      disabilityStatus: false,
      studentStatus: true,
      availableDocuments: ["Aadhaar Card", "Income Certificate"] // Missing fee receipt
    }
  },
  wrongJurisdiction: {
    label: "Scenario D — Wrong Jurisdiction",
    context: {
      age: 30,
      gender: "Male",
      state: "Karnataka", // Tries to query Maharashtra benefits
      district: "Mysore",
      ruralUrban: "Rural",
      occupation: "Farmer",
      employmentStatus: "Farmer",
      annualIncome: 150000,
      socialCategory: "General",
      disabilityStatus: false,
      studentStatus: false,
      availableDocuments: ["Aadhaar Card"]
    }
  }
};

export default function App() {
  const [currentView, setCurrentView] = useState('search') // 'search' | 'detail'
  const [selectedServiceId, setSelectedServiceId] = useState(null)
  
  const [problem, setProblem] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [citizenContext, setCitizenContext] = useState(DEMO_SCENARIOS.default.context)
  const [recommendations, setRecommendations] = useState([])
  const [interpretation, setInterpretation] = useState('')
  const [detectedCategory, setDetectedCategory] = useState('')
  const [detectedState, setDetectedState] = useState('')
  
  // Dynamic API Metadata states (Categories & States)
  const [categories, setCategories] = useState([])
  const [availableStates, setAvailableStates] = useState([])
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('')

  // Clarification questions state
  const [needsClarification, setNeedsClarification] = useState(false)
  const [clarificationQuestions, setClarificationQuestions] = useState([])
  const [clarificationAnswers, setClarificationAnswers] = useState({})
  
  // Detail page states
  const [serviceDetail, setServiceDetail] = useState(null)
  const [serviceConflicts, setServiceConflicts] = useState([])
  const [serviceSources, setServiceSources] = useState([])
  const [serviceWarnings, setServiceWarnings] = useState([])
  const [serviceConfidence, setServiceConfidence] = useState(1.0)
  
  // Interactive Stepper state
  const [activeStepIndex, setActiveStepIndex] = useState(0)

  // Document readiness state
  const [docReadiness, setDocReadiness] = useState(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeScenarioKey, setActiveScenarioKey] = useState('default')

  // Load dynamic Categories and States from Backend APIs
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, stateRes] = await Promise.all([
          axios.get('/api/government/categories'),
          axios.get('/api/government/states')
        ]);

        if (catRes.data && catRes.data.success && catRes.data.data.categories) {
          setCategories(catRes.data.data.categories);
        }
        if (stateRes.data && stateRes.data.success && stateRes.data.data.states) {
          setAvailableStates(stateRes.data.data.states);
        }
      } catch (err) {
        console.warn("Could not load dynamic metadata, using default fallbacks.", err);
      }
    };
    fetchMetadata();
  }, []);

  // Parse hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash.startsWith('#/government/service/')) {
        const id = hash.replace('#/government/service/', '')
        setSelectedServiceId(id)
        setCurrentView('detail')
        setActiveStepIndex(0) // Reset active stepper index
      } else {
        setCurrentView('search')
        setSelectedServiceId(null)
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    handleHashChange()
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Sync state changes with API Headers for Mock Profile
  const getMockHeaders = () => {
    return {
      'x-mock-state': citizenContext.state || '',
      'x-mock-district': citizenContext.district || '',
      'x-mock-income': citizenContext.annualIncome || '',
      'x-mock-age': citizenContext.age || '',
      'x-mock-employment': citizenContext.employmentStatus || '',
      'x-mock-documents': (citizenContext.availableDocuments || []).join(',')
    }
  }

  // Handle Scenario Toggling
  const handleScenarioChange = (key) => {
    setActiveScenarioKey(key)
    setCitizenContext(DEMO_SCENARIOS[key].context)
    setRecommendations([])
    setInterpretation('')
    setNeedsClarification(false)
    setClarificationQuestions([])
    setClarificationAnswers({})
    setError(null)
  }

  // Trigger problem-oriented recommendation
  const handleRecommend = async (e) => {
    if (e) e.preventDefault()
    if (!problem.trim()) return

    setLoading(true)
    setError(null)
    setNeedsClarification(false)

    try {
      const response = await axios.post('/api/government/recommend', {
        problem,
        citizenContext
      }, {
        headers: getMockHeaders()
      })

      const { success, data } = response.data
      if (success) {
        setInterpretation(data.interpretation)
        setDetectedCategory(data.category)
        setDetectedState(data.detectedState)
        setRecommendations(data.recommendations || [])
        
        if (data.needsClarification) {
          setNeedsClarification(true)
          setClarificationQuestions(data.questions || [])
          const initialAnswers = {}
          data.questions.forEach(q => {
            initialAnswers[q.field] = citizenContext[q.field] || ''
          })
          setClarificationAnswers(initialAnswers)
        }
      }
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error?.message || "Failed to analyze request.")
    } finally {
      setLoading(false)
    }
  }

  // Submit clarifications
  const handleClarifySubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const updatedContext = {
      ...citizenContext,
      ...clarificationAnswers
    }
    setCitizenContext(updatedContext)

    try {
      const response = await axios.post('/api/government/clarify', {
        problem,
        citizenContext: updatedContext,
        answers: clarificationAnswers
      }, {
        headers: {
          ...getMockHeaders(),
          'x-mock-state': clarificationAnswers.state || updatedContext.state,
          'x-mock-income': clarificationAnswers.annualIncome || updatedContext.annualIncome,
          'x-mock-age': clarificationAnswers.age || updatedContext.age,
          'x-mock-employment': clarificationAnswers.employmentStatus || updatedContext.employmentStatus
        }
      })

      const { success, data } = response.data
      if (success) {
        setInterpretation(data.interpretation)
        setRecommendations(data.recommendations || [])
        setNeedsClarification(data.needsClarification)
        if (data.needsClarification) {
          setClarificationQuestions(data.questions || [])
        } else {
          setClarificationQuestions([])
        }
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to clarify parameters.")
    } finally {
      setLoading(false)
    }
  }

  // Handle direct browse search (using dynamic category and state filters)
  const handleBrowseSearch = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const params = {}
      if (citizenContext.state) params.state = citizenContext.state
      if (selectedCategoryFilter) params.category = selectedCategoryFilter
      else if (detectedCategory && detectedCategory !== 'General') params.category = detectedCategory

      const response = await axios.get('/api/government/services', {
        params,
        headers: getMockHeaders()
      })

      const { success, data } = response.data
      if (success) {
        const mapped = (data.services || []).map(s => ({
          serviceId: s.serviceId,
          serviceName: s.serviceName,
          department: s.department,
          ministry: s.ministry,
          jurisdiction: s.jurisdiction,
          state: s.state,
          overallScore: 0.8,
          relevanceExplanation: s.description,
          eligibilityStatus: 'UNKNOWN',
          officialPortal: {
            title: s.officialPortal?.title || 'Portal',
            url: s.officialPortal?.url,
            verified: s.officialPortal?.verified
          },
          lastVerified: s.lastVerified,
          confidence: s.confidence
        }))
        setRecommendations(mapped)
        setInterpretation(`Browsing services matching state '${citizenContext.state || 'All'}' ${selectedCategoryFilter ? `and category '${selectedCategoryFilter}'` : ''}`)
      }
    } catch (err) {
      setError("Failed to fetch browse listings.")
    } finally {
      setLoading(false)
    }
  }

  // Fetch details when viewing a service
  useEffect(() => {
    if (currentView === 'detail' && selectedServiceId) {
      const fetchDetail = async () => {
        setLoading(true)
        setError(null)
        try {
          const res = await axios.get(`/api/government/services/${selectedServiceId}`, {
            headers: getMockHeaders()
          })
          if (res.data.success) {
            setServiceDetail(res.data.data.service)
            setServiceConflicts(res.data.data.conflicts || [])
            setServiceSources(res.data.sources || [])
            setServiceWarnings(res.data.warnings || [])
            setServiceConfidence(res.data.confidence || 1.0)
            setActiveStepIndex(0) // Reset active stepper index

            // Fetch document readiness dynamically
            const docsRes = await axios.get(`/api/government/services/${selectedServiceId}/document-readiness`, {
              params: {
                availableDocuments: citizenContext.availableDocuments
              },
              headers: getMockHeaders()
            })
            if (docsRes.data.success) {
              setDocReadiness(docsRes.data.data)
            }
          }
        } catch (err) {
          setError(err.response?.data?.error?.message || "Failed to load service details.")
        } finally {
          setLoading(false)
        }
      }
      fetchDetail()
    }
  }, [currentView, selectedServiceId, citizenContext.availableDocuments])

  // Get Confidence Rating Title
  const getConfidenceLevel = (score) => {
    if (score >= 0.90) return { title: "Strong Evidence", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (score >= 0.75) return { title: "Good Evidence", color: "text-blue-700 bg-blue-50 border-blue-200" };
    if (score >= 0.50) return { title: "Limited Evidence", color: "text-amber-700 bg-amber-50 border-amber-200" };
    return { title: "Insufficient Evidence", color: "text-red-700 bg-red-50 border-red-200" };
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header Banner */}
      <header className="bg-slate-900 border-b border-slate-800 text-white py-5 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded">CivicSphere</span>
              <h1 className="text-xl font-bold tracking-tight text-slate-100">Government Navigator</h1>
            </div>
            <p className="text-sm text-slate-400 font-medium">Service Discovery, Eligibility Engine & Action Planner</p>
          </div>
          
          {/* Identity Info Indicator */}
          <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/60 rounded-lg px-4 py-2 text-xs">
            <User className="w-4 h-4 text-blue-400" />
            <div>
              <p className="font-semibold text-slate-200">Citizen Identity Context</p>
              <p className="text-slate-400">
                {citizenContext.state || "No State Specified"} | {citizenContext.occupation || "No Occupation"} | Income: ₹{citizenContext.annualIncome?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Panel Layout */}
      <div className="max-w-7xl mx-auto w-full px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Sandbox Mock Identity Controller */}
        <aside className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Demo Simulator
            </h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Use these presets to test different eligibility routes, missing information prompts, and jurisdiction checks.
            </p>
            
            {/* Presets List */}
            <div className="flex flex-col gap-2 mb-6">
              {Object.entries(DEMO_SCENARIOS).map(([key, sc]) => (
                <button
                  key={key}
                  onClick={() => handleScenarioChange(key)}
                  className={`w-full text-left text-xs font-semibold px-3 py-2.5 rounded-lg border transition-all ${
                    activeScenarioKey === key 
                      ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {sc.label}
                </button>
              ))}
            </div>

            {/* Editable Profile Inputs */}
            <hr className="border-slate-100 my-4" />
            <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase">Active Profile Attributes</h3>
            <div className="flex flex-col gap-3">
              {/* Dynamic State Selection */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">State Residence</label>
                <select 
                  value={citizenContext.state || ''} 
                  onChange={e => setCitizenContext({ ...citizenContext, state: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
                >
                  <option value="">All States / No State</option>
                  {availableStates.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                  {citizenContext.state && !availableStates.includes(citizenContext.state) && (
                    <option value={citizenContext.state}>{citizenContext.state}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Annual Family Income (₹)</label>
                <input 
                  type="number" 
                  value={citizenContext.annualIncome || ''} 
                  onChange={e => setCitizenContext({ ...citizenContext, annualIncome: Number(e.target.value) })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Occupation Status</label>
                <select 
                  value={citizenContext.employmentStatus}
                  onChange={e => setCitizenContext({ ...citizenContext, employmentStatus: e.target.value, occupation: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1.5 focus:outline-none"
                >
                  <option value="Farmer">Farmer</option>
                  <option value="Unemployed">Unemployed / Jobless</option>
                  <option value="Student">Student</option>
                  <option value="Employee">Private Employee</option>
                  <option value="Self-Employed">Business / Self-Employed</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Age (Years)</label>
                <input 
                  type="number" 
                  value={citizenContext.age || ''} 
                  onChange={e => setCitizenContext({ ...citizenContext, age: Number(e.target.value) })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Available Document Wallet</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {["Aadhaar Card", "Income Certificate", "Employment Card", "Bank Account Passbook / Proof", "College Fee Receipt", "Landholding Certificate"].map(doc => {
                    const hasDoc = citizenContext.availableDocuments.includes(doc);
                    return (
                      <button
                        key={doc}
                        type="button"
                        onClick={() => {
                          const list = [...citizenContext.availableDocuments];
                          const index = list.indexOf(doc);
                          if (index > -1) list.splice(index, 1);
                          else list.push(doc);
                          setCitizenContext({ ...citizenContext, availableDocuments: list });
                        }}
                        className={`text-[9px] font-medium px-2 py-1 rounded border transition-all ${
                          hasDoc 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {hasDoc ? "✓ " : "+ "} {doc.split(" ")[0]}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Column: Search or Details View */}
        <main className="lg:col-span-3 flex flex-col gap-6">

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* VIEW: Search Dashboard */}
          {currentView === 'search' && (
            <>
              {/* Search Bar & Category/State Toolbar Block */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-2">Find Government Support Programs</h2>
                <p className="text-sm text-slate-600 mb-6">Describe your situation or challenge in normal words. CivicSphere extracts your intent and builds an action plan.</p>
                
                <form onSubmit={handleRecommend} className="flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                      <input
                        type="text"
                        value={problem}
                        onChange={e => setProblem(e.target.value)}
                        placeholder="Describe what happened: e.g. I lost my job and need support..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-800"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={loading || !problem.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                      >
                        {loading ? "Analyzing..." : "Find Services"}
                      </button>
                      <button
                        type="button"
                        onClick={handleBrowseSearch}
                        disabled={loading}
                        className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm px-5 py-3 rounded-lg transition-colors"
                      >
                        Browse All
                      </button>
                    </div>
                  </div>

                  {/* Feature 1 & 2: Dynamic Category & State Filter Toolbar */}
                  <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-600">Category Filter:</span>
                      <select
                        value={selectedCategoryFilter}
                        onChange={e => setSelectedCategoryFilter(e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
                      >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-600">State Focus:</span>
                      <select
                        value={citizenContext.state || ''}
                        onChange={e => setCitizenContext({ ...citizenContext, state: e.target.value })}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
                      >
                        <option value="">All States / Nationwide</option>
                        {availableStates.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </form>
              </div>

              {/* Clarification Panel (Render if missing information is needed) */}
              {needsClarification && clarificationQuestions.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-3 text-amber-900">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <h3 className="font-bold text-base">We Need A Little More Information</h3>
                  </div>
                  <p className="text-xs text-amber-800/80 mb-5 leading-relaxed">
                    To accurately calculate eligibility and sort schemes, please answer these missing details:
                  </p>
                  
                  <form onSubmit={handleClarifySubmit} className="flex flex-col gap-4">
                    {clarificationQuestions.map(q => (
                      <div key={q.field} className="bg-white border border-amber-200/60 p-4 rounded-lg">
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          {q.question}
                        </label>
                        <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                          <strong>Why this matters:</strong> {q.reason}
                        </p>
                        
                        {q.field === 'state' ? (
                          <select 
                            required
                            value={clarificationAnswers[q.field] || ''}
                            onChange={e => setClarificationAnswers({ ...clarificationAnswers, [q.field]: e.target.value })}
                            className="text-xs bg-slate-50 border border-slate-200 rounded p-2 w-full max-w-md focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                          >
                            <option value="">Select your state...</option>
                            {availableStates.map(st => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        ) : q.field === 'annualIncome' || q.field === 'age' ? (
                          <input 
                            type="number"
                            required
                            placeholder="e.g. 150000"
                            value={clarificationAnswers[q.field] || ''}
                            onChange={e => setClarificationAnswers({ ...clarificationAnswers, [q.field]: e.target.value })}
                            className="text-xs bg-slate-50 border border-slate-200 rounded p-2 w-full max-w-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        ) : (
                          <input 
                            type="text"
                            required
                            value={clarificationAnswers[q.field] || ''}
                            onChange={e => setClarificationAnswers({ ...clarificationAnswers, [q.field]: e.target.value })}
                            className="text-xs bg-slate-50 border border-slate-200 rounded p-2 w-full max-w-md focus:outline-none"
                          />
                        )}
                      </div>
                    ))}
                    
                    <div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-2.5 rounded transition-all shadow-sm"
                      >
                        Submit Answers
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Search Results Display */}
              {recommendations.length > 0 ? (
                <div className="flex flex-col gap-6">
                  {interpretation && (
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl px-5 py-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <HelpCircle className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-xs uppercase font-bold text-blue-500">Inferred Problem Statement Interpretation</p>
                          <p className="text-sm font-semibold text-slate-800">{interpretation}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {detectedCategory && (
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded uppercase">
                            {detectedCategory}
                          </span>
                        )}
                        {detectedState && (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" /> {detectedState}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide px-1">
                    Potentially Relevant Services ({recommendations.length})
                  </h3>

                  {/* Recommendations Cards Grid */}
                  <div className="grid grid-cols-1 gap-5">
                    {recommendations.map(rec => (
                      <div key={rec.serviceId} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all flex flex-col md:flex-row gap-5 justify-between">
                        
                        {/* Details Info */}
                        <div className="flex-1 flex flex-col gap-2.5">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                {rec.jurisdiction} {rec.state ? `| ${rec.state}` : ''}
                              </span>
                              <span className="text-[9px] uppercase font-bold tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                                Match Score: {Math.round(rec.overallScore * 100)}%
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-slate-900">{rec.serviceName}</h4>
                            <p className="text-xs text-slate-500 font-medium">{rec.department} {rec.ministry ? `(${rec.ministry})` : ''}</p>
                          </div>

                          <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-3 italic">
                            &ldquo;{rec.relevanceExplanation}&rdquo;
                          </p>

                          {/* Requirements Indicators */}
                          <div className="flex flex-wrap items-center gap-4 text-[10px] font-semibold text-slate-500 mt-1">
                            <div className="flex items-center gap-1.5">
                              {rec.eligibilityStatus === 'CONFIRMED' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : rec.eligibilityStatus === 'FAILED' ? (
                                <XCircle className="w-4 h-4 text-red-500" />
                              ) : (
                                <HelpCircle className="w-4 h-4 text-amber-500" />
                              )}
                              <span>
                                Eligibility: {
                                  rec.eligibilityStatus === 'CONFIRMED' ? "Verified Match" :
                                  rec.eligibilityStatus === 'FAILED' ? "Not Eligible" : "Awaiting Information"
                                }
                              </span>
                            </div>

                            {rec.eligibilityRulesSummary && (
                              <div className="text-[9px] text-slate-400">
                                ({rec.eligibilityRulesSummary.confirmed.length} match, {rec.eligibilityRulesSummary.unknown.length} unknown)
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions Side */}
                        <div className="flex md:flex-col justify-between items-end md:justify-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5 shrink-0">
                          <div className="text-right">
                            <span className={`inline-block border text-[10px] font-bold px-2 py-0.5 rounded-full ${getConfidenceLevel(rec.confidence).color}`}>
                              {getConfidenceLevel(rec.confidence).title}
                            </span>
                            <p className="text-[9px] text-slate-400 mt-1">Verified: {rec.lastVerified ? new Date(rec.lastVerified).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          
                          <a
                            href={`#/government/service/${rec.serviceId}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center gap-1 shadow-sm"
                          >
                            Explore Pathway
                            <ChevronRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                !loading && (
                  <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-bold text-slate-800 text-base mb-1">No services displayed yet</h3>
                    <p className="text-xs max-w-sm mx-auto">Use the Presets on the left or type your problem statement in the search bar above to trigger the recommender.</p>
                  </div>
                )
              )}

              {loading && (
                <div className="py-12 text-center text-slate-500">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                  <p className="text-xs font-semibold">Running hybrid recommendation engine...</p>
                </div>
              )}
            </>
          )}

          {/* VIEW: Service Detail Page */}
          {currentView === 'detail' && serviceDetail && (
            <div className="flex flex-col gap-6">
              
              {/* Back Button */}
              <div>
                <a
                  href="#/government/search"
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-lg hover:shadow-sm transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Search Results
                </a>
              </div>

              {/* SECTION 1: Service Banner Header */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {serviceDetail.jurisdiction} {serviceDetail.state ? `| ${serviceDetail.state}` : ''}
                    </span>
                    <span className={`border text-[10px] font-bold px-2 py-0.5 rounded-full ${getConfidenceLevel(serviceConfidence).color}`}>
                      {getConfidenceLevel(serviceConfidence).title} ({Math.round(serviceConfidence * 100)}% Confidence)
                    </span>
                  </div>
                  
                  <h2 className="text-xl font-bold text-slate-900 mb-1">{serviceDetail.serviceName}</h2>
                  <p className="text-xs font-medium text-slate-500 mb-3">{serviceDetail.department} {serviceDetail.ministry ? `(${serviceDetail.ministry})` : ''}</p>
                  
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-4">
                    {serviceDetail.description}
                  </p>
                </div>

                {/* Key Metadata Grid (Fees, Processing Time, Deadlines, Application Methods) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-3 border-t border-slate-100">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-150">
                    <span className="font-bold text-slate-500 text-[10px] uppercase block mb-1">Application Fees</span>
                    <span className="font-semibold text-slate-800">{serviceDetail.fees || "Free of cost"}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-150">
                    <span className="font-bold text-slate-500 text-[10px] uppercase block mb-1">Processing Time</span>
                    <span className="font-semibold text-slate-800">{serviceDetail.processingTime || "Standard processing"}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-150">
                    <span className="font-bold text-slate-500 text-[10px] uppercase block mb-1">Deadlines</span>
                    <span className="font-semibold text-slate-800">{serviceDetail.deadlines || "None"}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-150">
                    <span className="font-bold text-slate-500 text-[10px] uppercase block mb-1">Application Methods</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {Array.isArray(serviceDetail.applicationMethods) ? serviceDetail.applicationMethods.join(", ") : serviceDetail.applicationMethods || "Online Portal"}
                    </span>
                  </div>
                </div>
              </div>

              {/* WARNINGS BLOCK (Conflicts / Outdated Freshness) */}
              {(serviceWarnings.length > 0 || (serviceDetail.lastVerified && (new Date() - new Date(serviceDetail.lastVerified)) / (1000 * 60 * 60 * 24) > 180)) && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-2.5 text-red-950 font-bold mb-3.5">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h3 className="text-sm">Information Veracity & Warnings</h3>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {(new Date() - new Date(serviceDetail.lastVerified)) / (1000 * 60 * 60 * 24) > 180 && (
                      <div className="bg-white border border-red-200/60 p-3 rounded-lg text-xs leading-relaxed text-red-800">
                        <strong className="text-red-900 block mb-0.5">⚠ Outdated Source Warning</strong>
                        This information was last verified on {new Date(serviceDetail.lastVerified).toLocaleDateString()}. The data may be stale and requires physical verification.
                      </div>
                    )}

                    {serviceWarnings.map((w, idx) => (
                      <div key={idx} className="bg-white border border-red-200/60 p-3 rounded-lg text-xs leading-relaxed text-red-800">
                        <strong className="text-red-900 block mb-0.5">⚠ Source Conflict Warning</strong>
                        {w.message}
                      </div>
                    ))}
                  </div>

                  {serviceConflicts.length > 0 && (
                    <div className="mt-4 bg-white border border-red-200/60 rounded-lg overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-red-100/40 border-b border-red-100 text-red-900 font-bold">
                          <tr>
                            <th className="px-4 py-2">Field</th>
                            <th className="px-4 py-2">Source Title</th>
                            <th className="px-4 py-2">Source Tier</th>
                            <th className="px-4 py-2">Value Asserted</th>
                          </tr>
                        </thead>
                        <tbody>
                          {serviceConflicts.map((c, cIdx) => (
                            <React.Fragment key={cIdx}>
                              {c.details.map((detail, dIdx) => (
                                <tr key={dIdx} className={`border-b border-slate-100 ${detail.sourceId === c.resolvedSourceId ? 'bg-slate-50 font-medium' : ''}`}>
                                  {dIdx === 0 && (
                                    <td rowSpan={c.details.length} className="px-4 py-3 align-top font-bold text-slate-800 capitalize border-r border-slate-100">
                                      {c.field}
                                    </td>
                                  )}
                                  <td className="px-4 py-2.5 text-slate-700 flex items-center gap-1.5">
                                    {detail.sourceId === c.resolvedSourceId && (
                                      <span className="bg-emerald-100 text-emerald-800 text-[8px] px-1 rounded uppercase font-bold shrink-0">Resolved Winner</span>
                                    )}
                                    {detail.sourceTitle}
                                  </td>
                                  <td className="px-4 py-2.5 text-slate-500 uppercase">{detail.sourceType}</td>
                                  <td className="px-4 py-2.5 text-slate-800 font-semibold">{String(detail.value)}</td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 2: Document Readiness Card */}
              {docReadiness && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-3.5 uppercase tracking-wide border-b border-slate-100 pb-2">Document Readiness Checklist</h3>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    Compare required documents against files available in your citizen context profile.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* READY docs */}
                    <div className="border border-slate-100 rounded-xl p-4 bg-emerald-50/30">
                      <h4 className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-1.5 uppercase">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Ready to Apply ({docReadiness.ready.length})
                      </h4>
                      {docReadiness.ready.length > 0 ? (
                        <ul className="text-xs text-slate-700 flex flex-col gap-2">
                          {docReadiness.ready.map(d => (
                            <li key={d.documentId} className="bg-white border border-emerald-100 p-2 rounded shadow-sm">
                              ✓ {d.documentName}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">No documents ready.</p>
                      )}
                    </div>

                    {/* MISSING docs */}
                    <div className="border border-slate-100 rounded-xl p-4 bg-red-50/30">
                      <h4 className="text-xs font-bold text-red-800 mb-2 flex items-center gap-1.5 uppercase">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        Missing Mandatory ({docReadiness.missing.length})
                      </h4>
                      {docReadiness.missing.length > 0 ? (
                        <ul className="text-xs text-slate-700 flex flex-col gap-2">
                          {docReadiness.missing.map(d => (
                            <li key={d.documentId} className="bg-white border border-red-100 p-2 rounded shadow-sm">
                              ⚠ {d.documentName}
                              <p className="text-[9px] text-slate-400 mt-1 italic">{d.description}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">No missing documents!</p>
                      )}
                    </div>

                    {/* UNKNOWN / OPTIONAL docs */}
                    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                      <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5 uppercase">
                        <HelpCircle className="w-4 h-4 text-slate-500" />
                        Optional ({docReadiness.unknown.length})
                      </h4>
                      {docReadiness.unknown.length > 0 ? (
                        <ul className="text-xs text-slate-700 flex flex-col gap-2">
                          {docReadiness.unknown.map(d => (
                            <li key={d.documentId} className="bg-white border border-slate-200 p-2 rounded shadow-sm">
                              ? {d.documentName}
                              <p className="text-[9px] text-slate-400 mt-1 italic">{d.description}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">No optional documents.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: FEATURE 3 — Interactive Application Pathway Stepper */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Interactive Procedural Application Pathway</h3>
                    <p className="text-xs text-slate-500">Step-by-step verified application procedure</p>
                  </div>
                  
                  {serviceDetail.procedureSteps && serviceDetail.procedureSteps.length > 0 && (
                    <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">
                      Step {activeStepIndex + 1} of {serviceDetail.procedureSteps.length}
                    </span>
                  )}
                </div>

                {serviceDetail.procedureSteps && serviceDetail.procedureSteps.length > 0 ? (
                  <div>
                    {/* Horizontal Step Buttons */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-5 border-b border-slate-100">
                      {serviceDetail.procedureSteps.map((step, idx) => {
                        const isCurrent = idx === activeStepIndex;
                        const isDone = idx < activeStepIndex;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveStepIndex(idx)}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold shrink-0 transition-all border ${
                              isCurrent 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                                : isDone
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                              isCurrent ? 'bg-white text-blue-700' : isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {isDone ? "✓" : idx + 1}
                            </span>
                            <span className="truncate max-w-[140px]">{step.title}</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Active Step Content Card */}
                    {serviceDetail.procedureSteps[activeStepIndex] && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-5 relative">
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded">
                            Step {serviceDetail.procedureSteps[activeStepIndex].stepNumber || activeStepIndex + 1}
                          </span>
                          {serviceDetail.procedureSteps[activeStepIndex].sourceId && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              Verified Source: {serviceDetail.procedureSteps[activeStepIndex].sourceId}
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-slate-900 mb-2">
                          {serviceDetail.procedureSteps[activeStepIndex].title}
                        </h4>

                        <p className="text-sm text-slate-700 leading-relaxed mb-4">
                          {serviceDetail.procedureSteps[activeStepIndex].description}
                        </p>

                        {serviceDetail.procedureSteps[activeStepIndex].requiredInput && serviceDetail.procedureSteps[activeStepIndex].requiredInput.length > 0 && (
                          <div className="bg-white border border-slate-200/80 rounded-lg p-3 text-xs">
                            <span className="font-bold text-slate-700 block mb-1">Required Information / Input:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {serviceDetail.procedureSteps[activeStepIndex].requiredInput.map((inp, iIdx) => (
                                <span key={iIdx} className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200">
                                  • {inp}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Prev / Next Stepper Controls */}
                    <div className="flex justify-between items-center gap-3">
                      <button
                        type="button"
                        disabled={activeStepIndex === 0}
                        onClick={() => setActiveStepIndex(prev => Math.max(0, prev - 1))}
                        className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" /> Previous Step
                      </button>

                      <span className="text-xs font-semibold text-slate-500">
                        Step {activeStepIndex + 1} of {serviceDetail.procedureSteps.length}
                      </span>

                      <button
                        type="button"
                        disabled={activeStepIndex === serviceDetail.procedureSteps.length - 1}
                        onClick={() => setActiveStepIndex(prev => Math.min(serviceDetail.procedureSteps.length - 1, prev + 1))}
                        className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-all shadow-sm flex items-center gap-1"
                      >
                        Next Step <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No procedure steps declared for this service.</p>
                )}
              </div>

              {/* SECTION 4: Action Plan Summary Card */}
              <div className="bg-blue-900 text-white rounded-xl p-6 shadow-md">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-300" />
                  Your Next Best Actions
                </h3>
                
                <ol className="text-xs text-blue-100 list-decimal pl-4 flex flex-col gap-2.5 leading-relaxed">
                  {citizenContext.state !== serviceDetail.state && serviceDetail.jurisdiction !== 'central' && serviceDetail.jurisdiction !== 'All' ? (
                    <li className="text-red-200 font-semibold">
                      Verify Residence: Your profile state ({citizenContext.state || 'None'}) does not match the service state requirement ({serviceDetail.state}). Change state in the simulator if you belong there.
                    </li>
                  ) : null}

                  {docReadiness && docReadiness.missing.length > 0 ? (
                    <li>
                      <strong>Collect Missing Documents:</strong> You need to acquire {docReadiness.missing.map(d => d.documentName).join(", ")} before submitting.
                    </li>
                  ) : null}

                  {serviceDetail.officialPortal && serviceDetail.officialPortal.url ? (
                    <li>
                      <strong>Apply online:</strong> Submit your request on the verified official portal. 
                      <span className="block mt-2">
                        <a 
                          href={serviceDetail.officialPortal.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-white text-blue-950 font-bold hover:bg-slate-100 text-[11px] px-3.5 py-1.5 rounded transition-all shadow-sm"
                        >
                          Access Verified Portal ({serviceDetail.officialPortal.title}) <ExternalLink className="w-3 h-3 text-blue-900" />
                        </a>
                      </span>
                    </li>
                  ) : (
                    <li className="text-yellow-200 font-semibold">
                      Apply: An official URL could not be verified from our registry database. Refuse links from untrusted sources.
                    </li>
                  )}
                </ol>
              </div>

              {/* SECTION 5: FEATURE 4 — Grievance Escalation Widget */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2.5 mb-3 text-amber-950">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <h3 className="text-sm font-bold uppercase tracking-wide">Need Help or Want to File a Grievance?</h3>
                </div>
                
                <p className="text-xs text-amber-900/80 mb-4 leading-relaxed">
                  If your application is delayed past expected processing time ({serviceDetail.processingTime || "standard timeframe"}), rejected without valid cause, or requires escalation:
                </p>

                {serviceDetail.grievanceRoute ? (
                  <div className="bg-white border border-amber-200/80 rounded-xl p-5 flex flex-col gap-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block mb-0.5">Responsible Authority</span>
                      <span className="text-slate-700 font-medium">{serviceDetail.grievanceRoute.authority || 'State Public Grievances Department'}</span>
                    </div>

                    <div>
                      <span className="font-bold text-slate-800 block mb-0.5">Direct Helpline / Contact</span>
                      <span className="text-blue-700 font-mono font-bold bg-blue-50 border border-blue-100 px-2.5 py-1 rounded inline-flex items-center gap-1.5">
                        <PhoneCall className="w-3.5 h-3.5 text-blue-600" /> {serviceDetail.grievanceRoute.contact || '1800-11-0001 (Toll-Free)'}
                      </span>
                    </div>

                    {serviceDetail.grievanceRoute.description && (
                      <div>
                        <span className="font-bold text-slate-800 block mb-0.5">Redressal Scope & Details</span>
                        <p className="text-slate-600 leading-relaxed">{serviceDetail.grievanceRoute.description}</p>
                      </div>
                    )}

                    {serviceDetail.grievanceRoute.url && (
                      <div className="mt-2 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          ✓ Verified Official Portal
                        </span>
                        <a
                          href={serviceDetail.grievanceRoute.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded transition-all shadow-sm flex items-center gap-1.5"
                        >
                          Access Grievance Portal ({serviceDetail.grievanceRoute.portal || 'Redressal Portal'}) <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white border border-amber-200/80 rounded-xl p-4 text-xs text-slate-700">
                    <p className="mb-2">Official grievance route is managed through central public grievance portals:</p>
                    <a
                      href="https://pgportal.gov.in/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-amber-600 text-white font-bold px-3.5 py-1.5 rounded hover:bg-amber-700 transition-all text-xs"
                    >
                      CPGRAMS Central Grievance Portal (pgportal.gov.in) <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* SECTION 6: Citations & Verification Sources */}
              {serviceSources.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-3.5 uppercase tracking-wide border-b border-slate-100 pb-2">Citations & Verification Sources</h3>
                  <div className="flex flex-col gap-3">
                    {serviceSources.map(src => (
                      <div key={src.sourceId} className="bg-slate-50 border border-slate-150 p-3.5 rounded-lg flex flex-col gap-1 text-xs">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <strong className="text-slate-800">{src.title}</strong>
                          <span className="bg-slate-200 text-slate-800 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                            {src.sourceType}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">Publisher: {src.publisher || src.organization} | Last Verified: {src.lastVerified ? new Date(src.lastVerified).toLocaleDateString() : 'N/A'}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Verification Status: <strong>{src.verificationStatus}</strong></p>
                        {src.officialUrl && (
                          <div className="mt-2 text-[10.5px]">
                            <a href={src.officialUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1">
                              View Source document / URL <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 mt-12 shrink-0">
        <p>© 2026 CivicSphere AI. Built with Google Antigravity. All rights reserved.</p>
      </footer>
    </div>
  )
}
