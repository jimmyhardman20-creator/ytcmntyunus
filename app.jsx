import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  UserRound, 
  Hash, 
  PlusCircle, 
  Trash2, 
  Play, 
  MessageSquare,
  Clock,
  Youtube,
  Wifi,
  WifiOff,
  Users,
  Activity,
  CheckCircle2,
  RefreshCcw
} from 'lucide-react';
import { io } from 'socket.io-client';

// Render URL auto-detection
const SERVER_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : window.location.origin;

const socket = io(SERVER_URL);

const App = () => {
  const [activeTab, setActiveTab] = useState('comments'); // 'comments', 'jobs', 'workers'
  const [comments, setComments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [newJobUrl, setNewJobUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // Real-time Listeners
    socket.on('new_comment', (comment) => {
      setComments(prev => [comment, ...prev]);
    });

    socket.on('new_job', (job) => {
      setJobs(prev => [job, ...prev]);
    });

    socket.on('worker_update', (workerList) => {
      setWorkers(workerList);
    });

    socket.on('clear_comments', () => {
      setComments([]);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('new_comment');
      socket.off('new_job');
      socket.off('worker_update');
      socket.off('clear_comments');
    };
  }, []);

  // Filter logic: Unique user check ebong Numbers detection
  const filteredData = useMemo(() => {
    const uniqueUsers = new Set();
    const general = [];
    const numbered = [];

    [...comments].reverse().forEach(item => {
      const name = item.userName?.toLowerCase().trim();
      if (name && !uniqueUsers.has(name)) {
        uniqueUsers.add(name);
        const hasNum = /\d+/.test(item.text);
        if (hasNum) numbered.push(item);
        else general.push(item);
      }
    });

    return { general: general.reverse(), numbered: numbered.reverse() };
  }, [comments]);

  const addJob = async (e) => {
    e.preventDefault();
    if (!newJobUrl) return;
    setLoading(true);
    try {
      await fetch(`${SERVER_URL}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newJobUrl })
      });
      setNewJobUrl('');
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const clearData = async () => {
    if (!window.confirm("Apni ki nishchit bhabe sob data muche felte chan?")) return;
    await fetch(`${SERVER_URL}/api/comments`, { method: 'DELETE' });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-20">
      {/* --- Top Navbar --- */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-2.5 rounded-2xl text-white shadow-lg shadow-red-200">
            <Youtube size={26} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-800 leading-none">YT Admin</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Real-time Stream Controller</p>
          </div>
        </div>

        <div className="hidden md:flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button 
            onClick={() => setActiveTab('comments')} 
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'comments' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <MessageSquare size={16} /> Live Comments
          </button>
          <button 
            onClick={() => setActiveTab('jobs')} 
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'jobs' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Clock size={16} /> Job Queue
          </button>
          <button 
            onClick={() => setActiveTab('workers')} 
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'workers' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Users size={16} /> Active Workers
          </button>
        </div>

        <button 
          onClick={clearData} 
          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          title="Clear Dashboard"
        >
          <Trash2 size={22} />
        </button>
      </nav>

      {/* --- Mobile Navigation --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-3 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('comments')} className={`flex flex-col items-center gap-1 ${activeTab === 'comments' ? 'text-blue-600' : 'text-slate-400'}`}>
          <MessageSquare size={20} /> <span className="text-[10px] font-bold">Comments</span>
        </button>
        <button onClick={() => setActiveTab('jobs')} className={`flex flex-col items-center gap-1 ${activeTab === 'jobs' ? 'text-blue-600' : 'text-slate-400'}`}>
          <Clock size={20} /> <span className="text-[10px] font-bold">Jobs</span>
        </button>
        <button onClick={() => setActiveTab('workers')} className={`flex flex-col items-center gap-1 ${activeTab === 'workers' ? 'text-blue-600' : 'text-slate-400'}`}>
          <Users size={20} /> <span className="text-[10px] font-bold">Workers</span>
        </button>
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* VIEW 1: COMMENTS DASHBOARD */}
        {activeTab === 'comments' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
            <div className="space-y-4">
              <h2 className="flex items-center justify-between font-extrabold text-xl text-slate-800">
                <span className="flex items-center gap-2 underline decoration-blue-500/30">Unique Users</span>
                <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-black shadow-md">{filteredData.general.length}</span>
              </h2>
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-3">
                {filteredData.general.length === 0 && <div className="bg-white p-20 text-center text-slate-400 border-2 border-dashed rounded-[2rem] italic">Kono unique comment asheni.</div>}
                {filteredData.general.map(c => (
                  <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex gap-4 hover:border-blue-400 transition-all group">
                    <div className="bg-blue-50 h-12 w-12 rounded-2xl flex items-center justify-center text-blue-600 font-black text-lg group-hover:scale-110 transition-transform">
                      {c.userName?.[0]?.toUpperCase()}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <h4 className="font-bold text-slate-900 truncate">{c.userName}</h4>
                      <p className="text-slate-600 text-sm mt-1 leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="flex items-center justify-between font-extrabold text-xl text-slate-800">
                <span className="flex items-center gap-2 underline decoration-emerald-500/30">Priority Numbers</span>
                <span className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-black shadow-md">{filteredData.numbered.length}</span>
              </h2>
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-3">
                {filteredData.numbered.length === 0 && <div className="bg-white p-20 text-center text-slate-400 border-2 border-dashed rounded-[2rem] italic">Number thaka kono comment nei.</div>}
                {filteredData.numbered.map(c => (
                  <div key={c.id} className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm flex gap-4">
                    <div className="bg-emerald-200/50 h-12 w-12 rounded-2xl flex items-center justify-center text-emerald-700 flex-shrink-0">
                      <Hash size={24} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-emerald-900 truncate">{c.userName}</h4>
                        <span className="text-[10px] font-mono text-emerald-600 bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
                          {new Date(c.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <p className="text-emerald-800 text-sm font-semibold bg-white/70 p-3 rounded-xl border border-emerald-100/50">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: JOB QUEUE */}
        {activeTab === 'jobs' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
              <h3 className="text-2xl font-black text-slate-800 mb-2">Push New Scrape Job</h3>
              <p className="text-slate-500 text-sm mb-8">YouTube Live URL-ti add korun, online worker-ra auto scrape shuru korbe.</p>
              <form onSubmit={addJob} className="flex flex-col gap-4">
                <div className="relative">
                  <Youtube className="absolute left-5 top-4 text-slate-400" size={20} />
                  <input 
                    type="url" 
                    value={newJobUrl}
                    onChange={e => setNewJobUrl(e.target.value)}
                    placeholder="https://www.youtube.com/live/..."
                    className="w-full pl-14 pr-6 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                    required
                  />
                </div>
                <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all">
                  {loading ? 'Processing...' : 'Add to Scrape Queue'}
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <h3 className="font-black text-slate-700 flex items-center gap-2 px-2"><RefreshCcw size={18} className="text-slate-400" /> Pending Jobs</h3>
              <div className="grid gap-3">
                {jobs.length === 0 && <div className="p-12 text-center text-slate-400 border-2 border-dashed rounded-3xl">Queue ekhon faka.</div>}
                {jobs.map(j => (
                  <div key={j.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm group hover:shadow-md transition-all">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="bg-amber-100 p-3 rounded-xl text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                        <Play size={18}/>
                      </div>
                      <p className="text-sm font-bold text-slate-700 truncate max-w-[300px]">{j.url}</p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tighter bg-amber-50 px-3 py-1.5 rounded-full text-amber-600 border border-amber-100">
                      {j.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: ACTIVE WORKERS */}
        {activeTab === 'workers' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10">
                <Users size={150} />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-1 flex items-center gap-3">
                  <Activity className="text-blue-400" /> Active Scrapers
                </h3>
                <p className="text-slate-400 text-sm mb-8 font-medium italic">Chrome extension theke connect kora worker-der eikhane dekhaben.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {workers.length === 0 && (
                    <div className="col-span-full py-16 text-center text-slate-500 italic border border-dashed border-slate-700 rounded-3xl bg-slate-800/50">
                      Kono worker ekhono connect hoyni.
                    </div>
                  )}
                  {workers.map(w => (
                    <div key={w.id} className="bg-slate-800/80 backdrop-blur p-5 rounded-2xl border border-slate-700 flex items-center justify-between group hover:border-blue-500 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="bg-blue-600/20 p-3 rounded-xl text-blue-400">
                            <UserRound size={24} />
                          </div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-[3px] border-slate-800 animate-pulse"></div>
                        </div>
                        <div>
                          <p className="font-black text-white">{w.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono tracking-tighter">SID: {w.id.slice(0, 15)}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black uppercase tracking-widest text-green-400 bg-green-400/10 px-3 py-1 rounded-lg">Online</span>
                        <div className="flex gap-1 mt-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500/20"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-500/20 flex items-center justify-between">
              <div>
                <h4 className="text-xl font-black flex items-center gap-2 uppercase tracking-tighter">
                  <CheckCircle2 /> System Status
                </h4>
                <p className="text-blue-100 text-sm font-medium mt-1">Worker connections are stable and monitoring the queue.</p>
              </div>
              <div className="bg-white/20 px-6 py-3 rounded-2xl text-2xl font-black">
                {workers.length}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- Global Status Indicator --- */}
      <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 bg-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-4 z-30">
        <div className="flex flex-col">
          <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Network</span>
          <span className={`text-xs font-black ${isConnected ? 'text-green-600' : 'text-red-500'}`}>
            {isConnected ? 'SERVER ONLINE' : 'CONNECTION LOST'}
          </span>
        </div>
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
      </div>
    </div>
  );
};

export default App;
